package state

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const FileName = "DEPLOY.md"

type Record struct {
	Service    string `json:"service"`
	Port       string `json:"port"`
	Start      string `json:"start"`
	Stop       string `json:"stop"`
	LastGreen  string `json:"last_green"`
	Body       string `json:"body,omitempty"`
}

func Path(root string) string {
	return filepath.Join(root, FileName)
}

func Write(root string, rec Record) error {
	rec.LastGreen = time.Now().Format(time.RFC3339)
	body := strings.TrimSpace(rec.Body)
	var b strings.Builder
	b.WriteString("---\n")
	fmt.Fprintf(&b, "service: %s\n", rec.Service)
	fmt.Fprintf(&b, "port: %s\n", rec.Port)
	fmt.Fprintf(&b, "start: %s\n", rec.Start)
	fmt.Fprintf(&b, "stop: %s\n", rec.Stop)
	fmt.Fprintf(&b, "last_green: %s\n", rec.LastGreen)
	b.WriteString("---\n")
	if body != "" {
		b.WriteString("\n")
		b.WriteString(body)
		b.WriteString("\n")
	}
	return os.WriteFile(Path(root), []byte(b.String()), 0o644)
}

func Read(root string) (Record, error) {
	raw, err := os.ReadFile(Path(root))
	if err != nil {
		if os.IsNotExist(err) {
			return Record{}, fmt.Errorf("no %s (treat as never deployed)", FileName)
		}
		return Record{}, err
	}
	return parse(string(raw))
}

func parse(text string) (Record, error) {
	text = strings.TrimSpace(text)
	if !strings.HasPrefix(text, "---") {
		return Record{}, fmt.Errorf("%s: missing frontmatter", FileName)
	}
	rest := strings.TrimPrefix(text, "---")
	end := strings.Index(rest, "\n---")
	if end < 0 {
		return Record{}, fmt.Errorf("%s: unclosed frontmatter", FileName)
	}
	head := rest[:end]
	body := strings.TrimSpace(rest[end+len("\n---"):])
	rec := Record{Body: body}
	for _, line := range strings.Split(head, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		k, v, ok := strings.Cut(line, ":")
		if !ok {
			continue
		}
		k = strings.TrimSpace(k)
		v = strings.TrimSpace(v)
		switch k {
		case "service":
			rec.Service = v
		case "port":
			rec.Port = v
		case "start":
			rec.Start = v
		case "stop":
			rec.Stop = v
		case "last_green":
			rec.LastGreen = v
		}
	}
	return rec, nil
}
