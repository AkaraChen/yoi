// Package store reads the yoi-server fact store (~/.yoi) for the dashboard
// probe. The store is written by the ctxl-generated yoi-server CLI; this
// package is strictly read-only and tolerant of hand-edited files: malformed
// frontmatter, missing sections, or invalid JSON blocks degrade to zero
// values instead of failing the whole read.
package store

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

// Link is one entry of a service spec's links array.
type Link struct {
	Kind  string `json:"kind"`
	Label string `json:"label"`
	URL   string `json:"url"`
}

// Service is one services/<id>.md document.
type Service struct {
	ID           string
	DisplayName  string
	PackRef      string
	DesiredState string
	CreatedAt    string
	Spec         map[string]any
	Links        []Link
}

// Release is one releases/<uuid>.md document. Plan/Config/Outcome hold the
// parsed JSON of the matching body sections (nil when absent or invalid).
type Release struct {
	ID        string
	Service   string
	Seq       string
	Status    string
	Image     string
	CreatedBy string
	CreatedAt string
	Plan      map[string]any
	Config    map[string]any
	Outcome   map[string]any
}

// Event is one line of events.ndjson.
type Event struct {
	ID      int64          `json:"id"`
	TS      string         `json:"ts"`
	Service string         `json:"service"`
	Release string         `json:"release,omitempty"`
	Actor   string         `json:"actor"`
	Kind    string         `json:"kind"`
	Summary string         `json:"summary"`
	Data    map[string]any `json:"data,omitempty"`
}

var idOK = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._-]*$`)

// ReadServices lists services/*.md sorted by id (os.ReadDir order). A missing
// store directory is not an error and yields an empty slice.
func ReadServices(root string) ([]Service, error) {
	entries, err := os.ReadDir(filepath.Join(root, "services"))
	if os.IsNotExist(err) {
		return []Service{}, nil
	}
	if err != nil {
		return nil, err
	}
	out := make([]Service, 0, len(entries))
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".md") {
			continue
		}
		svc, err := ReadService(root, strings.TrimSuffix(e.Name(), ".md"))
		if err != nil {
			return nil, err
		}
		out = append(out, *svc)
	}
	return out, nil
}

// ReadService reads one service by id. It returns (nil, nil) when the
// document does not exist, and rejects non-slug ids outright.
func ReadService(root, id string) (*Service, error) {
	if !idOK.MatchString(id) {
		return nil, fmt.Errorf("invalid service id %q", id)
	}
	fields, body, err := readDoc(filepath.Join(root, "services", id+".md"))
	if os.IsNotExist(err) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	svc := &Service{
		ID:           id,
		DisplayName:  fields["display_name"],
		PackRef:      fields["pack_ref"],
		DesiredState: fields["desired_state"],
		CreatedAt:    fields["created_at"],
		Spec:         sectionJSON(body, "Spec"),
	}
	svc.Links = linksOf(svc.Spec)
	return svc, nil
}

// ReadReleases lists releases/*.md whose frontmatter service matches
// serviceID, newest first by created_at (falling back to seq descending).
func ReadReleases(root, serviceID string) ([]Release, error) {
	entries, err := os.ReadDir(filepath.Join(root, "releases"))
	if os.IsNotExist(err) {
		return []Release{}, nil
	}
	if err != nil {
		return nil, err
	}
	out := make([]Release, 0, len(entries))
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".md") {
			continue
		}
		id := strings.TrimSuffix(e.Name(), ".md")
		if !idOK.MatchString(id) {
			continue
		}
		fields, body, err := readDoc(filepath.Join(root, "releases", e.Name()))
		if err != nil {
			return nil, err
		}
		if fields["service"] != serviceID {
			continue
		}
		out = append(out, Release{
			ID:        id,
			Service:   serviceID,
			Seq:       fields["seq"],
			Status:    fields["status"],
			Image:     fields["image"],
			CreatedBy: fields["created_by"],
			CreatedAt: fields["created_at"],
			Plan:      sectionJSON(body, "Plan"),
			Config:    sectionJSON(body, "Config"),
			Outcome:   sectionJSON(body, "Outcome"),
		})
	}
	sort.SliceStable(out, func(i, j int) bool {
		if out[i].CreatedAt != out[j].CreatedAt {
			return out[i].CreatedAt > out[j].CreatedAt
		}
		return seqLess(out[j].Seq, out[i].Seq)
	})
	return out, nil
}

// ReadEvents lists events.ndjson rows for one service, newest first by ts.
func ReadEvents(root, serviceID string) ([]Event, error) {
	data, err := os.ReadFile(filepath.Join(root, "events.ndjson"))
	if os.IsNotExist(err) {
		return []Event{}, nil
	}
	if err != nil {
		return nil, err
	}
	out := []Event{}
	sc := bufio.NewScanner(strings.NewReader(string(data)))
	sc.Buffer(make([]byte, 0, 64*1024), 4*1024*1024)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" {
			continue
		}
		var ev Event
		if err := json.Unmarshal([]byte(line), &ev); err != nil {
			continue // tolerate a corrupt line rather than failing the stream
		}
		if ev.Service == serviceID {
			out = append(out, ev)
		}
	}
	if err := sc.Err(); err != nil {
		return nil, err
	}
	sort.SliceStable(out, func(i, j int) bool { return out[i].TS > out[j].TS })
	return out, nil
}

// readDoc splits a markdown document into frontmatter fields and body. The
// frontmatter convention matches what ctxl writes: a leading --- line, flat
// "key: value" lines, then a closing --- line.
func readDoc(path string) (map[string]string, string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, "", err
	}
	text := strings.ReplaceAll(string(data), "\r\n", "\n")
	if !strings.HasPrefix(text, "---\n") {
		return map[string]string{}, text, nil
	}
	rest := text[len("---\n"):]
	end := strings.Index(rest, "\n---")
	if end < 0 {
		return map[string]string{}, text, nil
	}
	fields := map[string]string{}
	for _, line := range strings.Split(rest[:end], "\n") {
		key, value, ok := strings.Cut(line, ":")
		if !ok {
			continue
		}
		fields[strings.TrimSpace(key)] = strings.TrimSpace(value)
	}
	body := strings.TrimPrefix(rest[end+len("\n---"):], "\n")
	return fields, body, nil
}

// sectionJSON extracts the first ```json fenced block under a `## name`
// heading and parses it. Headings inside code fences are ignored. It returns
// nil when the heading, the fence, or the JSON is missing or invalid.
func sectionJSON(body, name string) map[string]any {
	lines := strings.Split(body, "\n")
	inSection := false
	inFence := false
	var buf strings.Builder
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "```") {
			if inSection {
				if inFence {
					var parsed map[string]any
					if err := json.Unmarshal([]byte(buf.String()), &parsed); err == nil {
						return parsed
					}
					return nil
				}
				if trimmed == "```json" {
					inFence = true
					buf.Reset()
				}
			}
			continue
		}
		if !inFence && strings.HasPrefix(trimmed, "## ") {
			inSection = strings.TrimPrefix(trimmed, "## ") == name
			continue
		}
		if inSection && inFence {
			buf.WriteString(line)
			buf.WriteByte('\n')
		}
	}
	return nil
}

func linksOf(spec map[string]any) []Link {
	raw, ok := spec["links"].([]any)
	if !ok {
		return nil
	}
	out := make([]Link, 0, len(raw))
	for _, item := range raw {
		m, ok := item.(map[string]any)
		if !ok {
			continue
		}
		out = append(out, Link{
			Kind:  stringOf(m, "kind"),
			Label: stringOf(m, "label"),
			URL:   stringOf(m, "url"),
		})
	}
	return out
}

func stringOf(m map[string]any, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}

// seqLess compares human-facing sequence numbers numerically when both parse,
// lexically otherwise.
func seqLess(a, b string) bool {
	var ai, bi int
	if _, err := fmt.Sscanf(a, "%d", &ai); err == nil {
		if _, err := fmt.Sscanf(b, "%d", &bi); err == nil {
			return ai < bi
		}
	}
	return a < b
}
