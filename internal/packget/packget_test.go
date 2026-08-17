package packget

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestGetWritesPack(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/packs/demo/index.json", func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"files":["README.md","reference/install.sh"]}`))
	})
	mux.HandleFunc("/packs/demo/README.md", func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("hello\n"))
	})
	mux.HandleFunc("/packs/demo/reference/install.sh", func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("#!/bin/sh\n"))
	})
	s := httptest.NewServer(mux)
	defer s.Close()

	root := t.TempDir()
	dest, err := Get("demo", root, s.URL+"/packs")
	if err != nil {
		t.Fatal(err)
	}
	got, err := os.ReadFile(filepath.Join(dest, "README.md"))
	if err != nil {
		t.Fatal(err)
	}
	if string(got) != "hello\n" {
		t.Fatalf("got %q", got)
	}
	st, err := os.Stat(filepath.Join(dest, "reference", "install.sh"))
	if err != nil {
		t.Fatal(err)
	}
	if st.Mode()&0o111 == 0 {
		t.Fatal("install.sh should be executable")
	}
}

func TestGetRejectsBadName(t *testing.T) {
	if _, err := Get("../etc", t.TempDir(), "https://example.com/packs"); err == nil {
		t.Fatal("expected error")
	}
}
