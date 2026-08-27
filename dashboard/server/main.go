// Command dashboard is the yoi probe panel: a single-binary web server that
// serves the embedded SPA plus a small JSON API for live server metrics.
// It binds localhost only and gates every API route behind password auth.
package main

import (
	"crypto/rand"
	"crypto/subtle"
	"embed"
	"encoding/hex"
	"encoding/json"
	"flag"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/disk"
	"github.com/shirou/gopsutil/v4/host"
	"github.com/shirou/gopsutil/v4/load"
	"github.com/shirou/gopsutil/v4/mem"
	"github.com/shirou/gopsutil/v4/net"
	"github.com/shirou/gopsutil/v4/process"
)

//go:embed all:dist
var distFS embed.FS

type serverInfo struct {
	Hostname       string `json:"hostname"`
	OS             string `json:"os"`
	Kernel         string `json:"kernel"`
	Arch           string `json:"arch"`
	CPUModel       string `json:"cpuModel"`
	CPUCores       int    `json:"cpuCores"`
	Virtualization string `json:"virtualization"`
	BootTime       string `json:"bootTime"`
}

type serverMetrics struct {
	CPUPercent   float64 `json:"cpuPercent"`
	MemUsed      uint64  `json:"memUsed"`
	MemTotal     uint64  `json:"memTotal"`
	SwapUsed     uint64  `json:"swapUsed"`
	SwapTotal    uint64  `json:"swapTotal"`
	DiskUsed     uint64  `json:"diskUsed"`
	DiskTotal    uint64  `json:"diskTotal"`
	NetUpRate    float64 `json:"netUpRate"`
	NetDownRate  float64 `json:"netDownRate"`
	NetUpTotal   uint64  `json:"netUpTotal"`
	NetDownTotal uint64  `json:"netDownTotal"`
	TCPConns     int     `json:"tcpConns"`
	UDPConns     int     `json:"udpConns"`
	ProcessCount int     `json:"processCount"`
	Load1        float64 `json:"load1"`
	Load5        float64 `json:"load5"`
	Load15       float64 `json:"load15"`
	UptimeSec    uint64  `json:"uptimeSec"`
}

const (
	sampleInterval = 5 * time.Second
	sampleCapacity = 720 // 1 hour at 5s interval
)

type sample struct {
	ts      time.Time
	metrics serverMetrics
}

type historyPoint struct {
	TS          string  `json:"ts"`
	CPUPercent  float64 `json:"cpuPercent"`
	MemPercent  float64 `json:"memPercent"`
	NetUpRate   float64 `json:"netUpRate"`
	NetDownRate float64 `json:"netDownRate"`
	Load1       float64 `json:"load1"`
}

type server struct {
	password string

	mu       sync.Mutex
	sessions map[string]bool
	samples  []sample

	lastNetSampleAt  time.Time
	lastNetBytesSent uint64
	lastNetBytesRecv uint64
}

func main() {
	addr := flag.String("addr", "127.0.0.1:8788", "listen address (localhost only by default)")
	password := flag.String("password", envOr("YOI_DASHBOARD_PASSWORD", "yoi"), "panel password (env YOI_DASHBOARD_PASSWORD)")
	flag.Parse()

	if !strings.HasPrefix(*addr, "127.0.0.1") && !strings.HasPrefix(*addr, "localhost") {
		log.Printf("warning: listening on %s, the panel is meant to be localhost-only", *addr)
	}

	s := &server{password: *password, sessions: map[string]bool{}}
	s.collect() // one synchronous sample so the API never serves zeros at boot
	go s.runSampler()

	static, err := fs.Sub(distFS, "dist")
	if err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/login", s.handleLogin)
	mux.HandleFunc("POST /api/logout", s.handleLogout)
	mux.HandleFunc("GET /api/server/info", s.withAuth(s.handleServerInfo))
	mux.HandleFunc("GET /api/server/metrics", s.withAuth(s.handleServerMetrics))
	mux.HandleFunc("GET /api/server/history", s.withAuth(s.handleServerHistory))
	mux.Handle("/", spaHandler(static))

	log.Printf("yoi dashboard listening on http://%s", *addr)
	log.Fatal(http.ListenAndServe(*addr, mux))
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func (s *server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if subtle.ConstantTimeCompare([]byte(body.Password), []byte(s.password)) != 1 {
		writeError(w, http.StatusUnauthorized, "wrong password")
		return
	}
	token, err := newToken()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create session")
		return
	}
	s.mu.Lock()
	s.sessions[token] = true
	s.mu.Unlock()
	http.SetCookie(w, &http.Cookie{
		Name:     "yoi_session",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
	w.WriteHeader(http.StatusNoContent)
}

func (s *server) handleLogout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie("yoi_session"); err == nil {
		s.mu.Lock()
		delete(s.sessions, cookie.Value)
		s.mu.Unlock()
	}
	http.SetCookie(w, &http.Cookie{Name: "yoi_session", Value: "", Path: "/", MaxAge: -1})
	w.WriteHeader(http.StatusNoContent)
}

func (s *server) withAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("yoi_session")
		if err != nil {
			writeError(w, http.StatusUnauthorized, "not authenticated")
			return
		}
		s.mu.Lock()
		ok := s.sessions[cookie.Value]
		s.mu.Unlock()
		if !ok {
			writeError(w, http.StatusUnauthorized, "not authenticated")
			return
		}
		next(w, r)
	}
}

func (s *server) handleServerInfo(w http.ResponseWriter, r *http.Request) {
	hostInfo, err := host.Info()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	cpuInfos, err := cpu.Info()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	cores, err := cpu.Counts(true)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	model := "unknown"
	if len(cpuInfos) > 0 {
		model = cpuInfos[0].ModelName
	}
	virt := hostInfo.VirtualizationSystem
	if virt == "" {
		virt = "bare-metal"
	}
	writeJSON(w, serverInfo{
		Hostname:       hostInfo.Hostname,
		OS:             strings.TrimSpace(hostInfo.Platform + " " + hostInfo.PlatformVersion),
		Kernel:         hostInfo.KernelVersion,
		Arch:           hostInfo.KernelArch,
		CPUModel:       model,
		CPUCores:       cores,
		Virtualization: virt,
		BootTime:       time.Unix(int64(hostInfo.BootTime), 0).Format(time.RFC3339),
	})
}

func (s *server) handleServerMetrics(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	latest := s.samples[len(s.samples)-1].metrics
	s.mu.Unlock()
	writeJSON(w, latest)
}

func (s *server) handleServerHistory(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	points := make([]historyPoint, 0, len(s.samples))
	for _, p := range s.samples {
		points = append(points, historyPoint{
			TS:          p.ts.Format(time.RFC3339),
			CPUPercent:  p.metrics.CPUPercent,
			MemPercent:  percentOf(p.metrics.MemUsed, p.metrics.MemTotal),
			NetUpRate:   p.metrics.NetUpRate,
			NetDownRate: p.metrics.NetDownRate,
			Load1:       p.metrics.Load1,
		})
	}
	s.mu.Unlock()
	writeJSON(w, map[string]any{"intervalSec": int(sampleInterval.Seconds()), "points": points})
}

func percentOf(used, total uint64) float64 {
	if total == 0 {
		return 0
	}
	return float64(used) / float64(total) * 100
}

// runSampler appends a metrics snapshot to the in-memory ring buffer every
// sampleInterval. History is intentionally volatile: a probe restart clears it.
func (s *server) runSampler() {
	ticker := time.NewTicker(sampleInterval)
	defer ticker.Stop()
	for range ticker.C {
		s.collect()
	}
}

func (s *server) collect() {
	var m serverMetrics

	if percents, err := cpu.Percent(0, false); err == nil && len(percents) > 0 {
		m.CPUPercent = percents[0]
	}
	if vm, err := mem.VirtualMemory(); err == nil {
		m.MemUsed, m.MemTotal = vm.Used, vm.Total
	}
	if sm, err := mem.SwapMemory(); err == nil {
		m.SwapUsed, m.SwapTotal = sm.Used, sm.Total
	}
	if du, err := disk.Usage("/"); err == nil {
		m.DiskUsed, m.DiskTotal = du.Used, du.Total
	}
	if avg, err := load.Avg(); err == nil {
		m.Load1, m.Load5, m.Load15 = avg.Load1, avg.Load5, avg.Load15
	}
	if up, err := host.Uptime(); err == nil {
		m.UptimeSec = up
	}
	if counters, err := net.IOCounters(false); err == nil && len(counters) > 0 {
		m.NetUpTotal, m.NetDownTotal = counters[0].BytesSent, counters[0].BytesRecv
		m.NetUpRate, m.NetDownRate = s.netRates(counters[0].BytesSent, counters[0].BytesRecv)
	}
	if conns, err := net.Connections("tcp"); err == nil {
		m.TCPConns = len(conns)
	}
	if conns, err := net.Connections("udp"); err == nil {
		m.UDPConns = len(conns)
	}
	if pids, err := process.Pids(); err == nil {
		m.ProcessCount = len(pids)
	}

	s.mu.Lock()
	s.samples = append(s.samples, sample{ts: time.Now(), metrics: m})
	if len(s.samples) > sampleCapacity {
		s.samples = s.samples[len(s.samples)-sampleCapacity:]
	}
	s.mu.Unlock()
}

// netRates derives per-second throughput from the previous sample. The first
// call after boot reports 0 rather than a since-boot average.
func (s *server) netRates(sent, recv uint64) (up, down float64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now()
	if !s.lastNetSampleAt.IsZero() {
		elapsed := now.Sub(s.lastNetSampleAt).Seconds()
		if elapsed > 0 {
			up = float64(sent-s.lastNetBytesSent) / elapsed
			down = float64(recv-s.lastNetBytesRecv) / elapsed
		}
	}
	s.lastNetSampleAt = now
	s.lastNetBytesSent = sent
	s.lastNetBytesRecv = recv
	return up, down
}

func newToken() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// spaHandler serves the embedded build and falls back to index.html so
// client-side routes survive a refresh.
func spaHandler(static fs.FS) http.Handler {
	fileServer := http.FileServer(http.FS(static))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}
		if _, err := fs.Stat(static, path); err != nil {
			r.URL.Path = "/"
		}
		fileServer.ServeHTTP(w, r)
	})
}
