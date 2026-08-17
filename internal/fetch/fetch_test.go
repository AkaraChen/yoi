package fetch

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestTextOK(t *testing.T) {
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("# hello\n"))
	}))
	defer s.Close()

	got, err := Text(s.URL)
	if err != nil {
		t.Fatal(err)
	}
	if got != "# hello\n" {
		t.Fatalf("got %q", got)
	}
}

func TestTextRejectsScheme(t *testing.T) {
	if _, err := Text("file:///tmp/x"); err == nil {
		t.Fatal("expected error")
	}
}

func TestTextNotFound(t *testing.T) {
	s := httptest.NewServer(http.NotFoundHandler())
	defer s.Close()
	if _, err := Text(s.URL); err == nil {
		t.Fatal("expected error")
	}
}
