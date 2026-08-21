package state

import (
	"fmt"
	"path/filepath"

	"github.com/AkaraChen/ctxl/core/schema"
	"github.com/AkaraChen/ctxl/core/store"
	yoi "github.com/AkaraChen/yoi"
)

const FileName = "DEPLOY.md"

type Record struct {
	Service   string `json:"service"`
	Port      string `json:"port"`
	Start     string `json:"start"`
	Stop      string `json:"stop"`
	LastGreen string `json:"last_green"`
	Body      string `json:"body,omitempty"`
}

func Path(root string) string {
	return filepath.Join(root, FileName)
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
	e, err := st.Entity("deploy")
	return st, e, err
}

func Write(root string, rec Record) error {
	st, e, err := open(root)
	if err != nil {
		return err
	}
	return st.WriteSingular(e, store.Record{
		Fields: map[string]string{
			"service":    rec.Service,
			"port":       rec.Port,
			"start":      rec.Start,
			"stop":       rec.Stop,
			"last_green": rec.LastGreen,
		},
		Body: rec.Body,
	})
}

func Read(root string) (Record, error) {
	st, e, err := open(root)
	if err != nil {
		return Record{}, err
	}
	got, err := st.ReadSingular(e)
	if err != nil {
		return Record{}, fmt.Errorf("no %s (treat as never deployed)", FileName)
	}
	return Record{
		Service:   got.Fields["service"],
		Port:      got.Fields["port"],
		Start:     got.Fields["start"],
		Stop:      got.Fields["stop"],
		LastGreen: got.Fields["last_green"],
		Body:      got.Body,
	}, nil
}
