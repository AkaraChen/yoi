// Package store reads the yoi-server fact store (~/.yoi) for the dashboard
// probe. Frontmatter types are generated from schema.json; this file only
// splits markdown, decodes into those types, and lists documents.
package store

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

//go:generate go run github.com/atombender/go-jsonschema@v0.24.1 -p store -o schema_gen.go --only-models --tags json,yaml --capitalization ID schema.json

// Service is one services/<id>.md document. Fields come from the generated
// ServiceFrontmatter; ID is the filename stem.
type Service struct {
	ID string `json:"id"`
	ServiceFrontmatter
}

// Release is one releases/<uuid>.md document. Plan/Config/Outcome hold the
// parsed JSON of the matching body sections (nil when absent or invalid).
type Release struct {
	ID string `json:"id"`
	ReleaseFrontmatter
	Plan    map[string]any `json:"plan"`
	Config  map[string]any `json:"config"`
	Outcome map[string]any `json:"outcome"`
}

// Present reports whether a kind is declared.
func (r *Runtime) Present() bool {
	return r != nil && strings.TrimSpace(r.Kind) != ""
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
	raw, body, err := splitDoc(filepath.Join(root, "services", id+".md"))
	if os.IsNotExist(err) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	fm := decode[ServiceFrontmatter](prepareService(raw))
	applySpecFallback(&fm, sectionJSON(body, "Spec"))
	normalizeLinks(fm.Links)
	if !fm.Runtime.Present() {
		fm.Runtime = nil
	}
	return &Service{ID: id, ServiceFrontmatter: fm}, nil
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
		raw, body, err := splitDoc(filepath.Join(root, "releases", e.Name()))
		if err != nil {
			return nil, err
		}
		fm := decode[ReleaseFrontmatter](prepareYAML(raw))
		if fm.Service != serviceID {
			continue
		}
		out = append(out, Release{
			ID:                 id,
			ReleaseFrontmatter: fm,
			Plan:               sectionJSON(body, "Plan"),
			Config:             sectionJSON(body, "Config"),
			Outcome:            sectionJSON(body, "Outcome"),
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
			continue
		}
		if ev.Service == serviceID {
			out = append(out, ev)
		}
	}
	if err := sc.Err(); err != nil {
		return nil, err
	}
	sort.SliceStable(out, func(i, j int) bool { return out[i].Ts > out[j].Ts })
	return out, nil
}

func splitDoc(path string) ([]byte, string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, "", err
	}
	text := strings.ReplaceAll(string(data), "\r\n", "\n")
	if !strings.HasPrefix(text, "---\n") {
		return nil, text, nil
	}
	rest := text[len("---\n"):]
	end := strings.Index(rest, "\n---")
	if end < 0 {
		return nil, text, nil
	}
	body := strings.TrimPrefix(rest[end+len("\n---"):], "\n")
	return []byte(rest[:end]), body, nil
}

func decode[T any](node any) T {
	var out T
	if node == nil {
		return out
	}
	b, err := json.Marshal(node)
	if err != nil {
		return out
	}
	_ = json.Unmarshal(b, &out)
	return out
}

func prepareYAML(raw []byte) any {
	if len(raw) == 0 {
		return nil
	}
	var node any
	if err := yaml.Unmarshal(raw, &node); err != nil {
		return nil
	}
	return stringifyLeaves(coerceJSONStrings(node))
}

func prepareService(raw []byte) any {
	node := prepareYAML(raw)
	m, ok := node.(map[string]any)
	if !ok {
		return node
	}
	if _, isSlice := m["ports"].([]any); isSlice {
		m["ports"] = joinPorts(m["ports"])
	}
	return m
}

func applySpecFallback(fm *ServiceFrontmatter, spec map[string]any) {
	if spec == nil {
		return
	}
	fb := decode[SpecFallback](spec)
	if fm.Ports == "" {
		fm.Ports = joinPorts(fb.Ports)
	}
	if fb.Resources != nil {
		if fm.Cpu == "" {
			fm.Cpu = fb.Resources.Cpu
		}
		if fm.Memory == "" {
			fm.Memory = fb.Resources.Memory
		}
	}
	if len(fm.Links) == 0 {
		fm.Links = fb.Links
	}
}

func normalizeLinks(links []Link) {
	for i := range links {
		if links[i].ID == "" {
			links[i].ID = links[i].Kind
		}
		if links[i].Name == "" {
			links[i].Name = links[i].Label
		}
		if links[i].Link == "" {
			links[i].Link = links[i].Url
		}
	}
}

func coerceJSONStrings(v any) any {
	switch t := v.(type) {
	case map[string]any:
		for k, val := range t {
			t[k] = coerceJSONStrings(val)
		}
		return t
	case []any:
		for i, val := range t {
			t[i] = coerceJSONStrings(val)
		}
		return t
	case string:
		s := strings.TrimSpace(t)
		if s == "" {
			return t
		}
		if s[0] != '{' && s[0] != '[' {
			return t
		}
		var parsed any
		if json.Unmarshal([]byte(s), &parsed) != nil {
			return t
		}
		return coerceJSONStrings(parsed)
	default:
		return v
	}
}

func stringifyLeaves(v any) any {
	switch t := v.(type) {
	case map[string]any:
		for k, val := range t {
			t[k] = stringifyLeaves(val)
		}
		return t
	case []any:
		for i, val := range t {
			t[i] = stringifyLeaves(val)
		}
		return t
	case time.Time:
		if t.IsZero() {
			return ""
		}
		return t.UTC().Format(time.RFC3339)
	case float64:
		if t == float64(int64(t)) {
			return strconv.FormatInt(int64(t), 10)
		}
		return strconv.FormatFloat(t, 'f', -1, 64)
	case int:
		return strconv.Itoa(t)
	case int64:
		return strconv.FormatInt(t, 10)
	case uint64:
		return strconv.FormatUint(t, 10)
	default:
		return v
	}
}

func joinPorts(v any) string {
	switch t := v.(type) {
	case nil:
		return ""
	case string:
		return strings.TrimSpace(t)
	case []any:
		parts := make([]string, 0, len(t))
		for _, item := range t {
			if s := strings.TrimSpace(fmt.Sprint(item)); s != "" {
				parts = append(parts, s)
			}
		}
		return strings.Join(parts, " ")
	default:
		return strings.TrimSpace(fmt.Sprint(t))
	}
}

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

func seqLess(a, b string) bool {
	var ai, bi int
	if _, err := fmt.Sscanf(a, "%d", &ai); err == nil {
		if _, err := fmt.Sscanf(b, "%d", &bi); err == nil {
			return ai < bi
		}
	}
	return a < b
}
