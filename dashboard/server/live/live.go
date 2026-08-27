package live

import (
	"context"
	"strings"
	"sync"
	"time"

	"github.com/AkaraChen/yoi/dashboard/server/store"
)

// Row is one bound target's live occupancy.
type Row struct {
	Name       string         `json:"name"`
	Status     string         `json:"status"`
	CPUPercent *float64       `json:"cpuPercent,omitempty"`
	MemBytes   *uint64        `json:"memBytes,omitempty"`
	PID        *int32         `json:"pid,omitempty"`
	Raw        map[string]any `json:"raw,omitempty"`
}

// Result is the raw collector output before synthesis.
type Result struct {
	Rows        []Row
	ProbeFailed bool
	Error       string
}

// Snapshot is the HTTP live payload for one service.
type Snapshot struct {
	ID           string `json:"id"`
	Status       string `json:"status"`
	Undetectable bool   `json:"undetectable"`
	Error        string `json:"error,omitempty"`
	Rows         []Row  `json:"rows"`
}

const probeTimeout = 10 * time.Second

// Probe asks the declared runtime for occupancy and synthesizes status.
func Probe(ctx context.Context, h Host, svc store.Service) Snapshot {
	if !svc.Runtime.Present() {
		return Snapshot{ID: svc.ID, Status: "unknown", Undetectable: true, Rows: []Row{}}
	}
	ctx, cancel := context.WithTimeout(ctx, probeTimeout)
	defer cancel()
	res := collect(ctx, h, *svc.Runtime)
	if res.Rows == nil {
		res.Rows = []Row{}
	}
	return Snapshot{
		ID:           svc.ID,
		Status:       Synthesize(svc.DesiredState, true, res),
		Undetectable: false,
		Error:        res.Error,
		Rows:         res.Rows,
	}
}

// ProbeAll probes each service concurrently.
func ProbeAll(ctx context.Context, h Host, svcs []store.Service) []Snapshot {
	out := make([]Snapshot, len(svcs))
	var wg sync.WaitGroup
	for i, svc := range svcs {
		wg.Add(1)
		go func(i int, svc store.Service) {
			defer wg.Done()
			out[i] = Probe(ctx, h, svc)
		}(i, svc)
	}
	wg.Wait()
	return out
}

func collect(ctx context.Context, h Host, rt store.Runtime) Result {
	switch strings.ToLower(strings.TrimSpace(rt.Kind)) {
	case "compose":
		return collectCompose(ctx, h, rt)
	case "docker":
		return collectContainers(ctx, h, "docker", rt.Containers)
	case "podman":
		return collectContainers(ctx, h, "podman", rt.Containers)
	case "systemd":
		return collectSystemd(ctx, h, rt.Units)
	case "pm2":
		return collectPM2(ctx, h, rt.Names)
	case "pidfile":
		return collectPIDFiles(ctx, h, rt.Files)
	case "socket":
		return collectSockets(ctx, h, rt.Sockets)
	case "custom":
		return collectCustom(ctx, h, rt.Command)
	default:
		return Result{ProbeFailed: true, Error: "unknown runtime kind " + rt.Kind}
	}
}

// Synthesize combines desired_state, binding, and runtime health.
//
//	no runtime            → unknown
//	probe failed          → degraded
//	desired stopped, down → stopped
//	desired stopped, up   → degraded
//	desired running, bound and healthy → running
//	otherwise             → degraded
func Synthesize(desired string, hasRuntime bool, r Result) string {
	if !hasRuntime {
		return "unknown"
	}
	if r.ProbeFailed {
		return "degraded"
	}
	bound := len(r.Rows) > 0
	allHealthy := bound
	anyUp := false
	for _, row := range r.Rows {
		if row.Status == "missing" {
			bound = false
			allHealthy = false
			continue
		}
		if isHealthy(row.Status) {
			anyUp = true
			continue
		}
		allHealthy = false
		if isUp(row.Status) {
			anyUp = true
		}
	}
	if desired == "stopped" {
		if anyUp {
			return "degraded"
		}
		return "stopped"
	}
	if !bound || !allHealthy {
		return "degraded"
	}
	return "running"
}

func isHealthy(status string) bool {
	switch strings.ToLower(status) {
	case "running", "healthy", "online", "active":
		return true
	default:
		return false
	}
}

func isUp(status string) bool {
	switch strings.ToLower(status) {
	case "missing", "exited", "stopped", "inactive", "dead", "failed", "not-found":
		return false
	default:
		return true
	}
}

func f64(v float64) *float64 { return &v }
func u64(v uint64) *uint64   { return &v }
func i32(v int32) *int32     { return &v }

func missingRow(name string) Row {
	return Row{Name: name, Status: "missing"}
}
