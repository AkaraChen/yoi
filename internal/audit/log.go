package audit

import (
	"fmt"
	"path/filepath"

	"github.com/AkaraChen/ctxl/schema"
	"github.com/AkaraChen/ctxl/store"
	yoi "github.com/AkaraChen/yoi"
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

func open(root string) (store.Store, schema.Entity, error) {
	s, err := schema.Parse(yoi.SchemaJSON)
	if err != nil {
		return store.Store{}, schema.Entity{}, err
	}
	st, err := store.Open(s, store.ScopeProject, root)
	if err != nil {
		return store.Store{}, schema.Entity{}, err
	}
	e, err := st.Entity("log")
	return st, e, err
}

func Append(root string, in Entry) (Entry, error) {
	st, e, err := open(root)
	if err != nil {
		return Entry{}, err
	}
	fields := map[string]any{
		"project": in.Project,
		"result":  in.Result,
		"cmd":     in.Cmd,
	}
	if in.CustomData != nil {
		fields["custom_data"] = in.CustomData
	}
	row, err := st.AppendNDJSON(e, fields)
	if err != nil {
		return Entry{}, err
	}
	return entryFrom(row), nil
}

func ReadAll(root string) ([]Entry, error) {
	st, e, err := open(root)
	if err != nil {
		return nil, err
	}
	rows, err := st.ListNDJSON(e)
	if err != nil {
		return nil, err
	}
	out := make([]Entry, 0, len(rows))
	for _, row := range rows {
		out = append(out, entryFrom(row))
	}
	return out, nil
}

func entryFrom(row map[string]any) Entry {
	e := Entry{
		TS:      fmt.Sprint(row["ts"]),
		Project: fmt.Sprint(row["project"]),
		Result:  fmt.Sprint(row["result"]),
		Cmd:     fmt.Sprint(row["cmd"]),
	}
	switch n := row["id"].(type) {
	case int:
		e.ID = n
	case int64:
		e.ID = int(n)
	case float64:
		e.ID = int(n)
	}
	if extra, ok := row["custom_data"].(map[string]any); ok {
		e.CustomData = extra
	}
	if e.TS == "<nil>" {
		e.TS = ""
	}
	return e
}
