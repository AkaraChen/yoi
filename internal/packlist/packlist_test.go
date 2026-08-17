package packlist

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

const indexBody = `[
  {"slug":"hermes","excerpt":"在自己的 Linux 上跑 Hermes","cover":null},
  {"slug":"lobehub","excerpt":"LobeHub 自建部署","cover":"/packs/lobehub/cover.png"}
]`

func newIndexServer(t *testing.T) *httptest.Server {
	t.Helper()
	mux := http.NewServeMux()
	mux.HandleFunc("/packs.json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_, _ = w.Write([]byte(indexBody))
	})
	s := httptest.NewServer(mux)
	t.Cleanup(s.Close)
	return s
}

func TestListFetchesPacksJSON(t *testing.T) {
	s := newIndexServer(t)

	packs, err := List(s.URL)
	if err != nil {
		t.Fatal(err)
	}
	if len(packs) != 2 || packs[0].Slug != "hermes" {
		t.Fatalf("got %+v", packs)
	}
	if packs[0].Cover != nil {
		t.Fatalf("null cover should decode to nil, got %+v", packs[0].Cover)
	}
	if packs[1].Cover == nil || *packs[1].Cover != "/packs/lobehub/cover.png" {
		t.Fatalf("cover not decoded: %+v", packs[1])
	}
}

func TestListAcceptsGetStyleBase(t *testing.T) {
	s := newIndexServer(t)

	packs, err := List(s.URL + "/packs")
	if err != nil {
		t.Fatal(err)
	}
	if len(packs) != 2 {
		t.Fatalf("got %+v", packs)
	}
}

func TestListRejectsBadBase(t *testing.T) {
	if _, err := List("ftp://example.com"); err == nil {
		t.Fatal("expected error")
	}
}

func TestSearchFiltersBySlugAndExcerpt(t *testing.T) {
	packs := []Pack{
		{Slug: "hermes", Excerpt: "在自己的 Linux 上跑 Hermes"},
		{Slug: "lobehub", Excerpt: "LobeHub 自建部署"},
		{Slug: "openclaw", Excerpt: "OpenClaw 部署"},
	}
	if got := Search("HERMES", packs); len(got) != 1 || got[0].Slug != "hermes" {
		t.Fatalf("slug match: %+v", got)
	}
	if got := Search("自建", packs); len(got) != 1 || got[0].Slug != "lobehub" {
		t.Fatalf("excerpt match: %+v", got)
	}
	if got := Search("部署", packs); len(got) != 2 {
		t.Fatalf("multi match: %+v", got)
	}
	if got := Search("zzz", packs); len(got) != 0 {
		t.Fatalf("no match expected: %+v", got)
	}
	if got := Search("  ", packs); len(got) != len(packs) {
		t.Fatalf("blank query should return all: %+v", got)
	}
}
