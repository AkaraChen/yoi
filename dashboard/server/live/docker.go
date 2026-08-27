package live

import (
	"context"
	"encoding/json"
	"path/filepath"
	"strings"

	"github.com/AkaraChen/yoi/dashboard/server/store"
)

func collectCompose(ctx context.Context, h Host, rt store.Runtime) Result {
	if strings.TrimSpace(rt.File) == "" {
		return Result{ProbeFailed: true, Error: "compose: file is required"}
	}
	args := []string{"compose", "-f", rt.File}
	if rt.Project != "" {
		args = append(args, "-p", rt.Project)
	}
	args = append(args, "ps", "--format", "json")
	out, err := h.Run(ctx, "docker", args...)
	if err != nil {
		return Result{ProbeFailed: true, Error: "compose: " + err.Error()}
	}
	items := parseJSONObjects(out)
	byService := map[string]map[string]any{}
	for _, item := range items {
		svc := stringField(item, "Service", "service")
		if svc != "" {
			byService[svc] = item
		}
	}
	want := rt.Services
	if len(want) == 0 {
		for _, item := range items {
			if name := stringField(item, "Service", "service", "Name", "name"); name != "" {
				want = append(want, name)
			}
		}
	}
	if len(want) == 0 {
		return Result{Rows: []Row{}}
	}
	rows := make([]Row, 0, len(want))
	for _, svc := range want {
		item, ok := byService[svc]
		if !ok {
			// compose ps with no filter listed every service as Name-based
			for _, candidate := range items {
				if stringField(candidate, "Name", "name") == svc {
					item = candidate
					ok = true
					break
				}
			}
		}
		if !ok {
			rows = append(rows, missingRow(svc))
			continue
		}
		name := stringField(item, "Name", "name")
		if name == "" {
			name = svc
		}
		row := inspectContainer(ctx, h, "docker", name)
		if row.Name == "" || row.Name == name {
			row.Name = svc
		}
		if row.Status == "missing" {
			// compose listed it; fall back to ps State/Health
			row = rowFromComposePS(svc, item)
		}
		rows = append(rows, row)
	}
	return Result{Rows: rows}
}

func rowFromComposePS(name string, item map[string]any) Row {
	state := strings.ToLower(stringField(item, "State", "state", "Status", "status"))
	health := strings.ToLower(stringField(item, "Health", "health"))
	row := Row{Name: name, Status: composeStatus(state, health)}
	return row
}

func composeStatus(state, health string) string {
	if state == "" || state == "exited" || state == "dead" || state == "stopped" {
		if state == "" {
			return "missing"
		}
		return state
	}
	if health == "unhealthy" {
		return "unhealthy"
	}
	if health == "healthy" || state == "running" {
		if health == "healthy" {
			return "healthy"
		}
		return "running"
	}
	if state != "" {
		return state
	}
	return "missing"
}

func collectContainers(ctx context.Context, h Host, bin string, names []string) Result {
	if len(names) == 0 {
		return Result{ProbeFailed: true, Error: bin + ": no containers declared"}
	}
	rows := make([]Row, 0, len(names))
	for _, name := range names {
		rows = append(rows, inspectContainer(ctx, h, bin, name))
	}
	return Result{Rows: rows}
}

func inspectContainer(ctx context.Context, h Host, bin, name string) Row {
	out, err := h.Run(ctx, bin, "inspect", name)
	if err != nil {
		return missingRow(name)
	}
	var arr []map[string]any
	if err := json.Unmarshal(out, &arr); err != nil || len(arr) == 0 {
		return missingRow(name)
	}
	info := arr[0]
	state, _ := info["State"].(map[string]any)
	status := strings.ToLower(stringField(state, "Status", "status"))
	health := ""
	if hmap, ok := state["Health"].(map[string]any); ok {
		health = strings.ToLower(stringField(hmap, "Status", "status"))
	}
	row := Row{Name: trimContainerName(stringField(info, "Name", "name"), name), Status: composeStatus(status, health)}
	if pid, ok := asInt32(state["Pid"]); ok {
		row.PID = i32(pid)
	}
	applyStats(ctx, h, bin, name, &row)
	return row
}

func applyStats(ctx context.Context, h Host, bin, name string, row *Row) {
	out, err := h.Run(ctx, bin, "stats", "--no-stream", "--format", "{{json .}}", name)
	if err != nil {
		return
	}
	items := parseJSONObjects(out)
	if len(items) == 0 {
		return
	}
	if cpu, ok := parsePercent(stringField(items[0], "CPUPerc", "CPUPercentage")); ok {
		row.CPUPercent = f64(cpu)
	}
	if mem, ok := parseDockerSize(stringField(items[0], "MemUsage", "MemUsage")); ok {
		row.MemBytes = u64(mem)
	}
}

func trimContainerName(name, fallback string) string {
	name = strings.TrimPrefix(strings.TrimSpace(name), "/")
	if name == "" {
		return fallback
	}
	return filepath.Base(name)
}
