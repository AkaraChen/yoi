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
