package live

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/AkaraChen/yoi/dashboard/server/store"
)

type fakeHost struct {
	home    string
	files   map[string][]byte
	cmds    map[string]cmdResult
	procs   map[int32]ProcInfo
	shell   cmdResult
	shellIn string
}

type cmdResult struct {
	out []byte
	err error
}

func (f *fakeHost) Home() string { return f.home }

func (f *fakeHost) ReadFile(path string) ([]byte, error) {
	if b, ok := f.files[path]; ok {
		return b, nil
	}
	return nil, os.ErrNotExist
}

func (f *fakeHost) Run(_ context.Context, name string, args ...string) ([]byte, error) {
	key := name + " " + strings.Join(args, " ")
	if r, ok := f.cmds[key]; ok {
		return r.out, r.err
	}
	return nil, errors.New("unexpected command: " + key)
}

func (f *fakeHost) RunShell(_ context.Context, dir, command string) ([]byte, error) {
	f.shellIn = dir + "\n" + command
	return f.shell.out, f.shell.err
}

func (f *fakeHost) Proc(pid int32) ProcInfo { return f.procs[pid] }

func TestSynthesize(t *testing.T) {
	healthy := Result{Rows: []Row{{Name: "web", Status: "running"}}}
	unhealthy := Result{Rows: []Row{{Name: "web", Status: "unhealthy"}}}
	missing := Result{Rows: []Row{{Name: "web", Status: "missing"}}}
	failed := Result{ProbeFailed: true, Error: "boom"}
	down := Result{Rows: []Row{{Name: "web", Status: "exited"}}}

	cases := []struct {
		desired string
		hasRT   bool
		res     Result
		want    string
	}{
		{"running", false, Result{}, "unknown"},
		{"running", true, failed, "degraded"},
		{"running", true, healthy, "running"},
		{"running", true, unhealthy, "degraded"},
		{"running", true, missing, "degraded"},
		{"stopped", true, down, "stopped"},
		{"stopped", true, healthy, "degraded"},
		{"stopped", true, missing, "stopped"},
	}
	for _, tc := range cases {
		if got := Synthesize(tc.desired, tc.hasRT, tc.res); got != tc.want {
			t.Fatalf("desired=%s runtime=%v rows=%v → %s, want %s", tc.desired, tc.hasRT, tc.res.Rows, got, tc.want)
		}
	}
}

func TestProbeNoRuntime(t *testing.T) {
	snap := Probe(context.Background(), &fakeHost{}, store.Service{
		ID:                 "x",
		ServiceFrontmatter: store.ServiceFrontmatter{DesiredState: "running"},
	})
	if !snap.Undetectable || snap.Status != "unknown" || len(snap.Rows) != 0 {
		t.Fatalf("%+v", snap)
	}
}

func TestCustomCollector(t *testing.T) {
	h := &fakeHost{
		home:  "/home/u",
		shell: cmdResult{out: []byte(`[{"name":"web","status":"running","cpuPercent":1.5,"memBytes":2048,"pid":9,"extra":"x"}]`)},
	}
	res := collectCustom(context.Background(), h, "echo hi")
	if res.ProbeFailed || len(res.Rows) != 1 {
		t.Fatalf("%+v", res)
	}
	row := res.Rows[0]
	if row.Name != "web" || row.Status != "running" || row.PID == nil || *row.PID != 9 {
		t.Fatalf("row: %+v", row)
	}
	if row.CPUPercent == nil || *row.CPUPercent != 1.5 || row.MemBytes == nil || *row.MemBytes != 2048 {
		t.Fatalf("metrics: %+v", row)
	}
	if row.Raw["extra"] != "x" {
		t.Fatalf("raw: %v", row.Raw)
	}
	if !strings.Contains(h.shellIn, "/home/u") {
		t.Fatalf("cwd: %q", h.shellIn)
	}
}

func TestCustomBadJSON(t *testing.T) {
	h := &fakeHost{shell: cmdResult{out: []byte(`{"name":"nope"}`)}}
	res := collectCustom(context.Background(), h, "echo")
	if !res.ProbeFailed {
		t.Fatalf("want probe failed, got %+v", res)
	}
}

func TestPIDFileAndSocket(t *testing.T) {
	file := filepath.Join(t.TempDir(), "app.pid")
	h := &fakeHost{
		files: map[string][]byte{file: []byte("4242\n")},
		procs: map[int32]ProcInfo{4242: {Alive: true, Name: "app", CPUPercent: 2, MemBytes: 99}},
		cmds: map[string]cmdResult{
			"lsof -t -- /tmp/app.sock": {out: []byte("4242\n")},
		},
	}
	res := collectPIDFiles(context.Background(), h, []string{file})
	if res.ProbeFailed || len(res.Rows) != 1 || res.Rows[0].Status != "running" {
		t.Fatalf("pidfile: %+v", res)
	}
	if res.Rows[0].PID == nil || *res.Rows[0].PID != 4242 {
		t.Fatalf("pid: %+v", res.Rows[0])
	}
	res = collectSockets(context.Background(), h, []string{"/tmp/app.sock"})
	if res.Rows[0].Status != "running" {
		t.Fatalf("socket: %+v", res)
	}
	res = collectPIDFiles(context.Background(), h, []string{"/nope.pid"})
	if res.Rows[0].Status != "missing" {
		t.Fatalf("missing pidfile: %+v", res)
	}
}

func TestDockerInspect(t *testing.T) {
	h := &fakeHost{
		cmds: map[string]cmdResult{
			"docker inspect web": {out: []byte(`[{"Name":"/web","State":{"Status":"running","Pid":11,"Health":{"Status":"healthy"}}}]`)},
			"docker stats --no-stream --format {{json .}} web": {out: []byte(`{"CPUPerc":"1.50%","MemUsage":"10.5MiB / 1GiB"}`)},
			"docker inspect gone":                              {err: errors.New("no such container")},
		},
	}
	row := inspectContainer(context.Background(), h, "docker", "web")
	if row.Status != "healthy" || row.PID == nil || *row.PID != 11 {
		t.Fatalf("row: %+v", row)
	}
	if row.CPUPercent == nil || *row.CPUPercent != 1.5 {
		t.Fatalf("cpu: %+v", row)
	}
	if row.MemBytes == nil || *row.MemBytes < 10*1024*1024 {
		t.Fatalf("mem: %+v", row)
	}
	if inspectContainer(context.Background(), h, "docker", "gone").Status != "missing" {
		t.Fatal("missing container")
	}
}

func TestSystemdAndPM2(t *testing.T) {
	h := &fakeHost{
		cmds: map[string]cmdResult{
			"systemctl show app.service --property=LoadState,ActiveState,SubState,MainPID,MemoryCurrent --no-page": {
				out: []byte("LoadState=loaded\nActiveState=active\nSubState=running\nMainPID=7\nMemoryCurrent=4096\n"),
			},
			"systemctl show missing.service --property=LoadState,ActiveState,SubState,MainPID,MemoryCurrent --no-page": {
				out: []byte("LoadState=not-found\nActiveState=inactive\nMainPID=0\n"),
			},
			"pm2 jlist": {out: []byte(`[{"name":"web","pid":3,"pm2_env":{"status":"online"},"monit":{"cpu":4,"memory":128}}]`)},
		},
		procs: map[int32]ProcInfo{7: {Alive: true, CPUPercent: 1, MemBytes: 8}},
	}
	res := collectSystemd(context.Background(), h, []string{"app.service", "missing.service"})
	if res.Rows[0].Status != "active" || res.Rows[1].Status != "missing" {
		t.Fatalf("systemd: %+v", res.Rows)
	}
	res = collectPM2(context.Background(), h, []string{"web", "nope"})
	if res.Rows[0].Status != "online" || res.Rows[1].Status != "missing" {
		t.Fatalf("pm2: %+v", res.Rows)
	}
	if res.Rows[0].CPUPercent == nil || *res.Rows[0].CPUPercent != 4 {
		t.Fatalf("pm2 cpu: %+v", res.Rows[0])
	}
}

func TestParseDockerSize(t *testing.T) {
	n, ok := parseDockerSize("10.5MiB / 1GiB")
	if !ok || n < 10*1024*1024 {
		t.Fatalf("%d %v", n, ok)
	}
}
