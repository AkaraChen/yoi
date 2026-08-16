package state

import (
	"os"
	"path/filepath"
	"testing"
)

func TestWriteReadRoundTrip(t *testing.T) {
	dir := t.TempDir()
	in := Record{Service: "hermes", Port: "8787", Start: "docker compose up -d", Stop: "docker compose down", Body: "再开先看这五个键。"}
	if err := Write(dir, in); err != nil {
		t.Fatal(err)
	}
	out, err := Read(dir)
	if err != nil {
		t.Fatal(err)
	}
	if out.Service != in.Service || out.Port != in.Port || out.Start != in.Start || out.Stop != in.Stop {
		t.Fatalf("got %+v", out)
	}
	if out.LastGreen == "" {
		t.Fatal("last_green empty")
	}
	if out.Body != in.Body {
		t.Fatalf("body %q", out.Body)
	}
	if _, err := os.Stat(filepath.Join(dir, FileName)); err != nil {
		t.Fatal(err)
	}
}

func TestReadMissing(t *testing.T) {
	_, err := Read(t.TempDir())
	if err == nil {
		t.Fatal("expected error")
	}
}
