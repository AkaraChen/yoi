package main

import (
	"net/http"
	"sync"
	"time"

	"github.com/AkaraChen/yoi/dashboard/server/live"
	"github.com/AkaraChen/yoi/dashboard/server/store"
)

// JSON DTOs for the service API. camelCase matches the existing contract
// convention (see docs/adr/dashboard-probe-server.md).

type serviceSummaryJSON struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	DesiredState string `json:"desiredState"`
}

type releaseJSON struct {
	ID        string         `json:"id"`
	Seq       string         `json:"seq"`
	Status    string         `json:"status"`
	Image     string         `json:"image"`
	CreatedBy string         `json:"createdBy"`
	CreatedAt string         `json:"createdAt"`
	Plan      map[string]any `json:"plan"`
	Config    map[string]any `json:"config"`
	Outcome   map[string]any `json:"outcome"`
}

type serviceJSON struct {
	ID           string         `json:"id"`
	Name         string         `json:"name"`
	DesiredState string         `json:"desiredState"`
	PackRef      string         `json:"packRef"`
	CreatedAt    string         `json:"createdAt"`
	Ports        string         `json:"ports"`
	CPU          string         `json:"cpu"`
	Memory       string         `json:"memory"`
	Runtime      *store.Runtime `json:"runtime"`
	Links        []store.Link   `json:"links"`
	Releases     []releaseJSON  `json:"releases"`
	Events       []store.Event  `json:"events"`
}

const liveCacheTTL = 2 * time.Second

type liveCache struct {
	mu    sync.Mutex
	at    time.Time
	snaps []live.Snapshot
}

func (s *server) handleServices(w http.ResponseWriter, r *http.Request) {
	services, err := store.ReadServices(s.storeRoot)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	out := make([]serviceSummaryJSON, 0, len(services))
	for _, svc := range services {
		if svc.DesiredState == "removed" {
			continue
		}
		out = append(out, serviceSummaryJSON{ID: svc.ID, Name: svc.DisplayName, DesiredState: svc.DesiredState})
	}
	writeJSON(w, out)
}

func (s *server) handleService(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	svc, err := store.ReadService(s.storeRoot, id)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if svc == nil || svc.DesiredState == "removed" {
		writeError(w, http.StatusNotFound, "service not found")
		return
	}
	releases, err := store.ReadReleases(s.storeRoot, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	events, err := store.ReadEvents(s.storeRoot, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	out := serviceJSON{
		ID:           svc.ID,
		Name:         svc.DisplayName,
		DesiredState: svc.DesiredState,
		PackRef:      svc.PackRef,
		CreatedAt:    svc.CreatedAt,
		Ports:        svc.Ports,
		CPU:          svc.Cpu,
		Memory:       svc.Memory,
		Runtime:      svc.Runtime,
		Links:        svc.Links,
		Releases:     make([]releaseJSON, 0, len(releases)),
		Events:       events,
	}
	if out.Links == nil {
		out.Links = []store.Link{}
	}
	if out.Events == nil {
		out.Events = []store.Event{}
	}
	for _, rel := range releases {
		out.Releases = append(out.Releases, releaseJSON{
			ID:        rel.ID,
			Seq:       rel.Seq,
			Status:    rel.Status,
			Image:     rel.Image,
			CreatedBy: rel.CreatedBy,
			CreatedAt: rel.CreatedAt,
			Plan:      rel.Plan,
			Config:    rel.Config,
			Outcome:   rel.Outcome,
		})
	}
	writeJSON(w, out)
}

func (s *server) handleServicesLive(w http.ResponseWriter, r *http.Request) {
	snaps, err := s.liveAll(r)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, snaps)
}

func (s *server) handleServiceLive(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	svc, err := store.ReadService(s.storeRoot, id)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if svc == nil || svc.DesiredState == "removed" {
		writeError(w, http.StatusNotFound, "service not found")
		return
	}
	writeJSON(w, live.Probe(r.Context(), s.host, *svc))
}

func (s *server) liveAll(r *http.Request) ([]live.Snapshot, error) {
	s.live.mu.Lock()
	if time.Since(s.live.at) < liveCacheTTL && s.live.snaps != nil {
		out := s.live.snaps
		s.live.mu.Unlock()
		return out, nil
	}
	s.live.mu.Unlock()

	services, err := store.ReadServices(s.storeRoot)
	if err != nil {
		return nil, err
	}
	active := make([]store.Service, 0, len(services))
	for _, svc := range services {
		if svc.DesiredState != "removed" {
			active = append(active, svc)
		}
	}
	snaps := live.ProbeAll(r.Context(), s.host, active)
	s.live.mu.Lock()
	s.live.at = time.Now()
	s.live.snaps = snaps
	s.live.mu.Unlock()
	return snaps, nil
}
