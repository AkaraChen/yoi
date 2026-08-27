package live

import (
	"bytes"
	"context"
	"encoding/json"
	"path/filepath"
	"strconv"
	"strings"
)

func collectSystemd(ctx context.Context, h Host, units []string) Result {
	if len(units) == 0 {
		return Result{ProbeFailed: true, Error: "systemd: no units declared"}
	}
	rows := make([]Row, 0, len(units))
	for _, unit := range units {
		out, err := h.Run(ctx, "systemctl", "show", unit,
			"--property=LoadState,ActiveState,SubState,MainPID,MemoryCurrent",
			"--no-page")
		if err != nil {
			rows = append(rows, missingRow(unit))
			continue
		}
		kv := parseKV(out)
		if kv["LoadState"] == "not-found" {
			rows = append(rows, missingRow(unit))
			continue
		}
		row := Row{Name: unit, Status: strings.ToLower(kv["ActiveState"])}
		if row.Status == "" {
			row.Status = "missing"
		}
		if pid, err := strconv.ParseInt(kv["MainPID"], 10, 32); err == nil && pid > 0 {
			p := int32(pid)
			row.PID = i32(p)
			info := h.Proc(p)
			if info.Alive {
				row.CPUPercent = f64(info.CPUPercent)
				if info.MemBytes > 0 {
					row.MemBytes = u64(info.MemBytes)
				}
			}
		}
		if mem, err := strconv.ParseUint(kv["MemoryCurrent"], 10, 64); err == nil && mem > 0 && mem < 1<<62 {
			row.MemBytes = u64(mem)
		}
		rows = append(rows, row)
	}
	return Result{Rows: rows}
}

func collectPM2(ctx context.Context, h Host, names []string) Result {
	if len(names) == 0 {
		return Result{ProbeFailed: true, Error: "pm2: no names declared"}
	}
	out, err := h.Run(ctx, "pm2", "jlist")
	if err != nil {
		return Result{ProbeFailed: true, Error: "pm2: " + err.Error()}
	}
	items := parseJSONObjects(out)
	byName := map[string]map[string]any{}
	for _, item := range items {
		if n := stringField(item, "name"); n != "" {
			byName[n] = item
		}
	}
	rows := make([]Row, 0, len(names))
	for _, name := range names {
		item, ok := byName[name]
		if !ok {
			rows = append(rows, missingRow(name))
			continue
		}
		row := Row{Name: name, Status: strings.ToLower(stringField(item, "pm2_env.status", "status"))}
		if env, ok := item["pm2_env"].(map[string]any); ok {
			if s := stringField(env, "status"); s != "" {
				row.Status = strings.ToLower(s)
			}
		}
		if row.Status == "" {
			row.Status = "missing"
		}
		if pid, ok := asInt32(item["pid"]); ok {
			row.PID = i32(pid)
		}
		if monit, ok := item["monit"].(map[string]any); ok {
			if cpu, ok := asFloat(monit["cpu"]); ok {
				row.CPUPercent = f64(cpu)
			}
			if mem, ok := asUint64(monit["memory"]); ok {
				row.MemBytes = u64(mem)
			}
		}
		rows = append(rows, row)
	}
	return Result{Rows: rows}
}

func collectPIDFiles(ctx context.Context, h Host, files []string) Result {
	if len(files) == 0 {
		return Result{ProbeFailed: true, Error: "pidfile: no files declared"}
	}
	rows := make([]Row, 0, len(files))
	for _, file := range files {
		name := filepath.Base(file)
		data, err := h.ReadFile(file)
		if err != nil {
			rows = append(rows, missingRow(name))
			continue
		}
		pid, ok := parsePIDBytes(data)
		if !ok {
			rows = append(rows, missingRow(name))
			continue
		}
		rows = append(rows, rowFromProc(h, name, pid))
	}
	return Result{Rows: rows}
}

func collectSockets(ctx context.Context, h Host, sockets []string) Result {
	if len(sockets) == 0 {
		return Result{ProbeFailed: true, Error: "socket: no sockets declared"}
	}
	rows := make([]Row, 0, len(sockets))
	for _, sock := range sockets {
		name := filepath.Base(sock)
		pid, ok := pidOfSocket(ctx, h, sock)
		if !ok {
			rows = append(rows, missingRow(name))
			continue
		}
		rows = append(rows, rowFromProc(h, name, pid))
	}
	return Result{Rows: rows}
}

func collectCustom(ctx context.Context, h Host, command string) Result {
	command = strings.TrimSpace(command)
	if command == "" {
		return Result{ProbeFailed: true, Error: "custom: command is required"}
	}
	out, err := h.RunShell(ctx, h.Home(), command)
	if err != nil {
		return Result{ProbeFailed: true, Error: "custom: " + err.Error()}
	}
	var items []map[string]any
	if err := jsonUnmarshalArray(out, &items); err != nil {
		return Result{ProbeFailed: true, Error: "custom: stdout is not a JSON array"}
	}
	rows := make([]Row, 0, len(items))
	for _, item := range items {
		rows = append(rows, rowFromCustom(item))
	}
	return Result{Rows: rows}
}

func rowFromCustom(item map[string]any) Row {
	row := Row{
		Name:   stringField(item, "name"),
		Status: strings.ToLower(stringField(item, "status")),
	}
	if row.Name == "" {
		row.Name = "process"
	}
	if row.Status == "" {
		row.Status = "unknown"
	}
	if cpu, ok := asFloat(item["cpuPercent"]); ok {
		row.CPUPercent = f64(cpu)
	}
	if mem, ok := asUint64(item["memBytes"]); ok {
		row.MemBytes = u64(mem)
	}
	if pid, ok := asInt32(item["pid"]); ok {
		row.PID = i32(pid)
	}
	raw := map[string]any{}
	for k, v := range item {
		switch k {
		case "name", "status", "cpuPercent", "memBytes", "pid":
			continue
		default:
			raw[k] = v
		}
	}
	if len(raw) > 0 {
		row.Raw = raw
	}
	return row
}

func rowFromProc(h Host, name string, pid int32) Row {
	info := h.Proc(pid)
	if !info.Alive {
		return missingRow(name)
	}
	row := Row{Name: name, Status: "running", PID: i32(pid)}
	if info.Name != "" {
		row.Name = info.Name
	}
	row.CPUPercent = f64(info.CPUPercent)
	if info.MemBytes > 0 {
		row.MemBytes = u64(info.MemBytes)
	}
	return row
}

func parsePIDBytes(data []byte) (int32, bool) {
	s := strings.TrimSpace(string(data))
	if i := strings.IndexAny(s, " \n\t"); i >= 0 {
		s = s[:i]
	}
	n, err := strconv.ParseInt(s, 10, 32)
	if err != nil || n <= 0 {
		return 0, false
	}
	return int32(n), true
}

func pidOfSocket(ctx context.Context, h Host, path string) (int32, bool) {
	if out, err := h.Run(ctx, "lsof", "-t", "--", path); err == nil {
		if pid, ok := parsePIDBytes(out); ok {
			return pid, true
		}
	}
	if out, err := h.Run(ctx, "fuser", path); err == nil {
		if pid, ok := parsePIDBytes(out); ok {
			return pid, true
		}
	}
	return 0, false
}

func jsonUnmarshalArray(data []byte, dest *[]map[string]any) error {
	data = bytes.TrimSpace(data)
	if len(data) == 0 || data[0] != '[' {
		return errNotArray
	}
	return json.Unmarshal(data, dest)
}

type constError string

func (e constError) Error() string { return string(e) }

const errNotArray constError = "not a JSON array"
