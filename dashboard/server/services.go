package main

import (
	"net/http"

	"github.com/AkaraChen/yoi/dashboard/server/store"
)

// JSON DTOs for the service API. camelCase matches the existing contract
// convention (see docs/adr/dashboard-probe-server.md).

type serviceSummaryJSON struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Status string `json:"status"`
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
	ID        string         `json:"id"`
	Name      string         `json:"name"`
	Status    string         `json:"status"`
	PackRef   string         `json:"packRef"`
	CreatedAt string         `json:"createdAt"`
	Spec      map[string]any `json:"spec"`
	Links     []store.Link   `json:"links"`
	Releases  []releaseJSON  `json:"releases"`
	Events    []store.Event  `json:"events"`
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
		out = append(out, serviceSummaryJSON{ID: svc.ID, Name: svc.DisplayName, Status: svc.DesiredState})
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
		ID:        svc.ID,
		Name:      svc.DisplayName,
		Status:    svc.DesiredState,
		PackRef:   svc.PackRef,
		CreatedAt: svc.CreatedAt,
		Spec:      svc.Spec,
		Links:     svc.Links,
		Releases:  make([]releaseJSON, 0, len(releases)),
		Events:    events,
	}
	// Keep the JSON shape stable for the SPA: absent spec/links are {} / [],
	// never null.
	if out.Spec == nil {
		out.Spec = map[string]any{}
	}
	if out.Links == nil {
		out.Links = []store.Link{}
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
