package store

import (
	"os"
	"path/filepath"
	"testing"
)

func seedStore(t *testing.T) string {
	t.Helper()
	root := t.TempDir()
	writeFile(t, root, "services/lobehub.md", `---
display_name: LobeHub
pack_ref: lobehub
desired_state: running
created_at: 2026-08-20T10:00:00Z
---

## Spec

`+"```json"+`
{"ports": [3210], "resources": {"memory": "1G"}, "links": [{"kind": "website", "label": "官网", "url": "https://example.com"}]}
`+"```"+`
`)
	writeFile(t, root, "services/oldbox.md", `---
display_name: OldBox
desired_state: removed
created_at: 2026-08-01T10:00:00Z
---
`)
	writeFile(t, root, "releases/aaaa-older.md", `---
service: lobehub
seq: 1
status: superseded
image: lobehub:v1
created_by: agent-a
created_at: 2026-08-25T12:00:00Z
---

## Plan

`+"```json"+`
{"goal": "v1"}
`+"```"+`
`)
	writeFile(t, root, "releases/bbbb-newer.md", `---
service: lobehub
seq: 2
status: active
image: lobehub:v2
created_by: agent-a
created_at: 2026-08-27T12:00:00Z
---

## Plan

`+"```json"+`
{"goal": "v2"}
`+"```"+`
)

## Outcome

`+"```json"+`
{"success": true}
`+"```"+`
`)
	writeFile(t, root, "releases/cccc-other.md", `---
service: other
seq: 9
status: active
created_at: 2026-08-28T12:00:00Z
---
`)
	writeFile(t, root, "events.ndjson", `{"id":1,"ts":"2026-08-25T12:00:10Z","service":"lobehub","actor":"agent-a","kind":"deploy_started","summary":"开始部署 v1"}
{"id":2,"ts":"2026-08-27T12:00:10Z","service":"lobehub","release":"bbbb-newer","actor":"agent-a","kind":"deploy_finished","summary":"v2 上线","data":{"duration_sec":45}}
not json at all
{"id":3,"ts":"2026-08-26T12:00:00Z","service":"other","actor":"agent-b","kind":"oom_killed","summary":"OOM"}
`)
	return root
}

func writeFile(t *testing.T, root, rel, content string) {
	t.Helper()
	path := filepath.Join(root, rel)
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestReadServices(t *testing.T) {
	root := seedStore(t)
	svcs, err := ReadServices(root)
	if err != nil {
		t.Fatal(err)
	}
	if len(svcs) != 2 {
		t.Fatalf("want 2 services, got %d", len(svcs))
	}
	if svcs[0].ID != "lobehub" || svcs[1].ID != "oldbox" {
		t.Fatalf("services not sorted by id: %v", []string{svcs[0].ID, svcs[1].ID})
	}
	if svcs[0].DisplayName != "LobeHub" || svcs[0].DesiredState != "running" {
		t.Fatalf("bad fields: %+v", svcs[0])
	}
	if svcs[0].PackRef == nil || *svcs[0].PackRef != "lobehub" {
		t.Fatalf("pack_ref: %v", svcs[0].PackRef)
	}
	if svcs[1].PackRef != nil || svcs[1].Runtime.Present() {
		t.Fatalf("no-pack service must read without pack_ref/runtime: %+v", svcs[1])
	}
	if svcs[0].Ports != "3210" || svcs[0].Memory != "1G" {
		t.Fatalf("spec fallback: ports=%q memory=%q", svcs[0].Ports, svcs[0].Memory)
	}
	if len(svcs[0].Links) != 1 || svcs[0].Links[0].Link != "https://example.com" || svcs[0].Links[0].Name != "官网" {
		t.Fatalf("bad links: %+v", svcs[0].Links)
	}
}

func TestReadYAMLFrontmatter(t *testing.T) {
	root := t.TempDir()
	writeFile(t, root, "services/web.md", `---
display_name: Web
desired_state: running
ports: 3210 8080
memory: 1G
cpu: "1"
runtime:
  kind: compose
  file: /opt/app/docker-compose.yml
  services:
    - web
    - db
links:
  - id: site
    name: 官网
    link: https://example.com
---
`)
	svc, err := ReadService(root, "web")
	if err != nil || svc == nil {
		t.Fatalf("read: %v %v", svc, err)
	}
	if svc.Ports != "3210 8080" || svc.Memory != "1G" || svc.Cpu != "1" {
		t.Fatalf("scalars: %+v", svc)
	}
	if !svc.Runtime.Present() || svc.Runtime.Kind != "compose" || svc.Runtime.File != "/opt/app/docker-compose.yml" {
		t.Fatalf("runtime: %+v", svc.Runtime)
	}
	if len(svc.Runtime.Services) != 2 || svc.Runtime.Services[0] != "web" {
		t.Fatalf("services: %v", svc.Runtime.Services)
	}
	if len(svc.Links) != 1 || svc.Links[0].ID != "site" || svc.Links[0].Link != "https://example.com" {
		t.Fatalf("links: %+v", svc.Links)
	}
}

func TestReadJSONStringObjects(t *testing.T) {
	root := t.TempDir()
	writeFile(t, root, "services/cli.md", `---
display_name: CLI
desired_state: running
runtime: {"kind":"docker","containers":["web"]}
links: '[{"id":"docs","name":"文档","link":"https://docs.example"}]'
---
`)
	svc, err := ReadService(root, "cli")
	if err != nil || svc == nil {
		t.Fatalf("read: %v %v", svc, err)
	}
	if svc.Runtime == nil || svc.Runtime.Kind != "docker" || len(svc.Runtime.Containers) != 1 {
		t.Fatalf("runtime: %+v", svc.Runtime)
	}
	if len(svc.Links) != 1 || svc.Links[0].Name != "文档" {
		t.Fatalf("links: %+v", svc.Links)
	}
}

func TestReadServiceMissingAndInvalid(t *testing.T) {
	root := seedStore(t)
	svc, err := ReadService(root, "nope")
	if err != nil || svc != nil {
		t.Fatalf("missing service should be (nil, nil), got %v %v", svc, err)
	}
	if _, err := ReadService(root, "../etc"); err == nil {
		t.Fatal("path traversal id must be rejected")
	}
}

func TestReadReleasesSortedAndFiltered(t *testing.T) {
	root := seedStore(t)
	rels, err := ReadReleases(root, "lobehub")
	if err != nil {
		t.Fatal(err)
	}
	if len(rels) != 2 {
		t.Fatalf("want 2 releases for lobehub, got %d", len(rels))
	}
	if rels[0].ID != "bbbb-newer" || rels[1].ID != "aaaa-older" {
		t.Fatalf("releases not newest-first: %v", []string{rels[0].ID, rels[1].ID})
	}
	if rels[0].Plan["goal"] != "v2" || rels[0].Outcome["success"] != true {
		t.Fatalf("bad sections: %+v", rels[0])
	}
	if rels[1].Outcome != nil {
		t.Fatalf("missing Outcome section should be nil, got %v", rels[1].Outcome)
	}
}

func TestReadEventsSortedFilteredTolerant(t *testing.T) {
	root := seedStore(t)
	events, err := ReadEvents(root, "lobehub")
	if err != nil {
		t.Fatal(err)
	}
	if len(events) != 2 {
		t.Fatalf("want 2 events for lobehub, got %d", len(events))
	}
	if events[0].ID != 2 || events[1].ID != 1 {
		t.Fatalf("events not newest-first: %v", []int{events[0].ID, events[1].ID})
	}
	if events[0].Data["duration_sec"] != float64(45) || events[0].Release != "bbbb-newer" {
		t.Fatalf("bad event payload: %+v", events[0])
	}
}

func TestMissingStoreIsEmptyNotError(t *testing.T) {
	root := filepath.Join(t.TempDir(), "does-not-exist")
	svcs, err := ReadServices(root)
	if err != nil || len(svcs) != 0 {
		t.Fatalf("services: %v %v", svcs, err)
	}
	rels, err := ReadReleases(root, "x")
	if err != nil || len(rels) != 0 {
		t.Fatalf("releases: %v %v", rels, err)
	}
	events, err := ReadEvents(root, "x")
	if err != nil || len(events) != 0 {
		t.Fatalf("events: %v %v", events, err)
	}
}
