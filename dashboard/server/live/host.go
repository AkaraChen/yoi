package live

import (
	"bytes"
	"context"
	"os"
	"os/exec"
	"sync"
	"time"

	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/process"
)

// Host is the process/supervisor seam the collectors talk to. Tests swap
// it for a fake; production uses DefaultHost.
type Host interface {
	Run(ctx context.Context, name string, args ...string) ([]byte, error)
	RunShell(ctx context.Context, dir, command string) ([]byte, error)
	Home() string
	ReadFile(path string) ([]byte, error)
	Proc(pid int32) ProcInfo
}

// ProcInfo is a live view of one OS process.
type ProcInfo struct {
	Alive      bool
	Name       string
	CPUPercent float64
	MemBytes   uint64
}

// DefaultHost runs real commands and reads the real filesystem.
type DefaultHost struct {
	cpu *pidCPU
}

// NewHost returns a DefaultHost with a process-CPU delta cache.
func NewHost() *DefaultHost {
	return &DefaultHost{cpu: newPIDCPU()}
}

func (h *DefaultHost) Home() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	return home
}

func (h *DefaultHost) ReadFile(path string) ([]byte, error) {
	return os.ReadFile(path)
}

func (h *DefaultHost) Run(ctx context.Context, name string, args ...string) ([]byte, error) {
	cmd := exec.CommandContext(ctx, name, args...)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return stdout.Bytes(), err
	}
	return stdout.Bytes(), nil
}

func (h *DefaultHost) RunShell(ctx context.Context, dir, command string) ([]byte, error) {
	cmd := exec.CommandContext(ctx, "sh", "-c", command)
	cmd.Dir = dir
	var stdout bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stdout
	if err := cmd.Run(); err != nil {
		return stdout.Bytes(), err
	}
	return stdout.Bytes(), nil
}

func (h *DefaultHost) Proc(pid int32) ProcInfo {
	if pid <= 0 {
		return ProcInfo{}
	}
	p, err := process.NewProcess(pid)
	if err != nil {
		return ProcInfo{}
	}
	alive, err := p.IsRunning()
	if err != nil || !alive {
		return ProcInfo{}
	}
	info := ProcInfo{Alive: true}
	if name, err := p.Name(); err == nil {
		info.Name = name
	}
	if mem, err := p.MemoryInfo(); err == nil && mem != nil {
		info.MemBytes = mem.RSS
	}
	info.CPUPercent = h.cpu.percent(p)
	return info
}

type pidCPU struct {
	mu    sync.Mutex
	last  map[int32]cpu.TimesStat
	lastT map[int32]time.Time
	ncpu  float64
}

func newPIDCPU() *pidCPU {
	n := 1.0
	if c, err := cpu.Counts(true); err == nil && c > 0 {
		n = float64(c)
	}
	return &pidCPU{last: map[int32]cpu.TimesStat{}, lastT: map[int32]time.Time{}, ncpu: n}
}

func (c *pidCPU) percent(p *process.Process) float64 {
	times, err := p.Times()
	if err != nil || times == nil {
		return 0
	}
	now := time.Now()
	busy := times.User + times.System
	c.mu.Lock()
	defer c.mu.Unlock()
	prev, ok := c.last[p.Pid]
	prevT := c.lastT[p.Pid]
	c.last[p.Pid] = *times
	c.lastT[p.Pid] = now
	if !ok {
		return 0
	}
	elapsed := now.Sub(prevT).Seconds()
	if elapsed <= 0 {
		return 0
	}
	delta := busy - (prev.User + prev.System)
	if delta < 0 {
		return 0
	}
	pct := delta / elapsed / c.ncpu * 100
	if pct < 0 {
		return 0
	}
	return pct
}
