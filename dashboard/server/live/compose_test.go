package live

import (
	"context"
	"testing"

	"github.com/AkaraChen/yoi/dashboard/server/store"
)

func TestComposeCollector(t *testing.T) {
	h := &fakeHost{
		cmds: map[string]cmdResult{
			"docker compose -f /opt/app/compose.yml ps --format json": {
				out: []byte(`{"Name":"app-web-1","Service":"web","State":"running","Health":"healthy"}
{"Name":"app-db-1","Service":"db","State":"exited"}`),
			},
			"docker inspect app-web-1":                               {out: []byte(`[{"Name":"/app-web-1","State":{"Status":"running","Health":{"Status":"healthy"}}}]`)},
			"docker stats --no-stream --format {{json .}} app-web-1": {out: []byte(`{"CPUPerc":"0.20%","MemUsage":"8MiB / 1GiB"}`)},
			"docker inspect app-db-1":                                {err: errNotArray},
		},
	}
	res := collectCompose(context.Background(), h, store.Runtime{
		Kind:     "compose",
		File:     "/opt/app/compose.yml",
		Services: []string{"web", "db", "cache"},
	})
	if res.ProbeFailed || len(res.Rows) != 3 {
		t.Fatalf("%+v", res)
	}
	if res.Rows[0].Status != "healthy" || res.Rows[1].Status != "exited" || res.Rows[2].Status != "missing" {
		t.Fatalf("rows: %+v", res.Rows)
	}
}

func TestProbeSynthesizes(t *testing.T) {
	h := &fakeHost{
		cmds: map[string]cmdResult{
			"docker inspect web": {out: []byte(`[{"Name":"/web","State":{"Status":"running"}}]`)},
			"docker stats --no-stream --format {{json .}} web": {out: []byte(`{"CPUPerc":"1.00%","MemUsage":"1MiB / 1GiB"}`)},
		},
	}
	snap := Probe(context.Background(), h, store.Service{
		ID: "s",
		ServiceFrontmatter: store.ServiceFrontmatter{
			DesiredState: "running",
			Runtime:      &store.Runtime{Kind: "docker", Containers: []string{"web"}},
		},
	})
	if snap.Status != "running" || snap.Undetectable || len(snap.Rows) != 1 {
		t.Fatalf("%+v", snap)
	}
}
