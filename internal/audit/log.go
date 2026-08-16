package audit

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const RelPath = ".yoi/deploy.log"

type Entry struct {
	ID         int            `json:"id"`
	TS         string         `json:"ts"`
	Project    string         `json:"project"`
	Result     string         `json:"result"`
	Cmd        string         `json:"cmd"`
	CustomData map[string]any `json:"custom_data,omitempty"`
}

type Fixed struct {
	ID      int    `json:"id"`
	TS      string `json:"ts"`
	Project string `json:"project"`
	Result  string `json:"result"`
	Cmd     string `json:"cmd"`
}

func (e Entry) Fixed() Fixed {
	return Fixed{ID: e.ID, TS: e.TS, Project: e.Project, Result: e.Result, Cmd: e.Cmd}
}

func Path(root string) string {
	return filepath.Join(root, RelPath)
}

func DefaultProject(root string) string {
	return filepath.Base(root)
}

func Append(root string, in Entry) (Entry, error) {
	if err := os.MkdirAll(filepath.Dir(Path(root)), 0o755); err != nil {
		return Entry{}, err
	}
	existing, err := ReadAll(root)
	if err != nil {
		return Entry{}, err
	}
	in.ID = 1
	if n := len(existing); n > 0 {
		in.ID = existing[n-1].ID + 1
	}
	in.TS = time.Now().Format(time.RFC3339)
	line, err := json.Marshal(in)
	if err != nil {
		return Entry{}, err
	}
	f, err := os.OpenFile(Path(root), os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		return Entry{}, err
	}
	defer f.Close()
	if _, err := f.Write(append(line, '\n')); err != nil {
		return Entry{}, err
	}
	return in, nil
}

func ReadAll(root string) ([]Entry, error) {
	f, err := os.Open(Path(root))
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	defer f.Close()
	var out []Entry
	sc := bufio.NewScanner(f)
	sc.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	lineNo := 0
	for sc.Scan() {
		lineNo++
		line := strings.TrimSpace(sc.Text())
		if line == "" {
			continue
		}
		var e Entry
		if err := json.Unmarshal([]byte(line), &e); err != nil {
			return nil, fmt.Errorf("%s:%d: %w", RelPath, lineNo, err)
		}
		out = append(out, e)
	}
	return out, sc.Err()
}
