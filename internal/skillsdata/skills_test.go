package skillsdata

import "testing"

func TestGetKnown(t *testing.T) {
	for _, name := range []string{"deploy", "log"} {
		body, err := Get(name)
		if err != nil {
			t.Fatal(err)
		}
		if !stringsContains(body, "yoi ") {
			t.Fatalf("%s missing yoi commands:\n%s", name, body)
		}
	}
}

func TestGetHermes(t *testing.T) {
	body, err := Get("hermes")
	if err != nil {
		t.Fatal(err)
	}
	if !stringsContains(body, "CHECKLIST.md") {
		t.Fatalf("hermes missing checklist pointer:\n%s", body)
	}
	if !stringsContains(body, "hermes-agent.nousresearch.com/install.sh") {
		t.Fatalf("hermes missing locked installer URL:\n%s", body)
	}
}

func TestListIncludesHermes(t *testing.T) {
	names := map[string]bool{}
	for _, s := range List() {
		names[s.Name] = true
	}
	for _, want := range []string{"deploy", "log", "hermes"} {
		if !names[want] {
			t.Fatalf("List missing %s", want)
		}
	}
}

func TestGetUnknown(t *testing.T) {
	if _, err := Get("backup"); err == nil {
		t.Fatal("expected error")
	}
}

func stringsContains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(sub) == 0 || (len(s) > 0 && contains(s, sub)))
}

func contains(s, sub string) bool {
	return stringIndex(s, sub) >= 0
}

func stringIndex(s, sub string) int {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return i
		}
	}
	return -1
}
