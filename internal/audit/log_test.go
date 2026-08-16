package audit

import "testing"

func TestAppendIncrementsAndShowHidesCustom(t *testing.T) {
	dir := t.TempDir()
	a, err := Append(dir, Entry{Project: "demo", Result: "green", Cmd: "up", CustomData: map[string]any{"note": "x"}})
	if err != nil {
		t.Fatal(err)
	}
	if a.ID != 1 || a.TS == "" {
		t.Fatalf("first %+v", a)
	}
	b, err := Append(dir, Entry{Project: "demo", Result: "fail", Cmd: "up"})
	if err != nil {
		t.Fatal(err)
	}
	if b.ID != 2 {
		t.Fatalf("id %d", b.ID)
	}
	all, err := ReadAll(dir)
	if err != nil {
		t.Fatal(err)
	}
	if len(all) != 2 || all[0].CustomData["note"] != "x" {
		t.Fatalf("%+v", all)
	}
	fixed := all[0].Fixed()
	if fixed.Cmd != "up" || fixed.Result != "green" {
		t.Fatalf("%+v", fixed)
	}
}

func TestReadMissingIsEmpty(t *testing.T) {
	all, err := ReadAll(t.TempDir())
	if err != nil || len(all) != 0 {
		t.Fatalf("%v %#v", err, all)
	}
}
