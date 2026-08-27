package live

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"unicode"
)

func parseJSONObjects(data []byte) []map[string]any {
	data = bytes.TrimSpace(data)
	if len(data) == 0 {
		return nil
	}
	if data[0] == '[' {
		var arr []map[string]any
		if err := json.Unmarshal(data, &arr); err == nil {
			return arr
		}
		return nil
	}
	if data[0] == '{' {
		dec := json.NewDecoder(bytes.NewReader(data))
		var out []map[string]any
		for dec.More() {
			var m map[string]any
			if err := dec.Decode(&m); err != nil {
				break
			}
			out = append(out, m)
		}
		if len(out) > 0 {
			return out
		}
	}
	return nil
}

func stringField(m map[string]any, keys ...string) string {
	for _, key := range keys {
		if s := asString(m[key]); s != "" {
			return s
		}
	}
	return ""
}

func asString(v any) string {
	switch t := v.(type) {
	case nil:
		return ""
	case string:
		return strings.TrimSpace(t)
	case float64:
		if t == float64(int64(t)) {
			return strconv.FormatInt(int64(t), 10)
		}
		return strconv.FormatFloat(t, 'f', -1, 64)
	case json.Number:
		return t.String()
	default:
		return strings.TrimSpace(fmt.Sprint(t))
	}
}

func asFloat(v any) (float64, bool) {
	switch t := v.(type) {
	case float64:
		return t, true
	case json.Number:
		f, err := t.Float64()
		return f, err == nil
	case int:
		return float64(t), true
	case int64:
		return float64(t), true
	case string:
		s := strings.TrimSpace(strings.TrimSuffix(t, "%"))
		f, err := strconv.ParseFloat(s, 64)
		return f, err == nil
	default:
		return 0, false
	}
}

func asUint64(v any) (uint64, bool) {
	switch t := v.(type) {
	case float64:
		if t < 0 {
			return 0, false
		}
		return uint64(t), true
	case json.Number:
		u, err := t.Int64()
		if err != nil || u < 0 {
			return 0, false
		}
		return uint64(u), true
	case int:
		if t < 0 {
			return 0, false
		}
		return uint64(t), true
	case int64:
		if t < 0 {
			return 0, false
		}
		return uint64(t), true
	case uint64:
		return t, true
	case string:
		u, err := strconv.ParseUint(strings.TrimSpace(t), 10, 64)
		return u, err == nil
	default:
		return 0, false
	}
}

func asInt32(v any) (int32, bool) {
	u, ok := asUint64(v)
	if !ok || u > 1<<31-1 {
		return 0, false
	}
	return int32(u), u > 0
}

func parseDockerSize(s string) (uint64, bool) {
	s = strings.TrimSpace(s)
	if i := strings.Index(s, "/"); i >= 0 {
		s = strings.TrimSpace(s[:i])
	}
	if s == "" || s == "--" {
		return 0, false
	}
	i := 0
	for i < len(s) && (unicode.IsDigit(rune(s[i])) || s[i] == '.') {
		i++
	}
	if i == 0 {
		return 0, false
	}
	n, err := strconv.ParseFloat(s[:i], 64)
	if err != nil {
		return 0, false
	}
	unit := strings.TrimSpace(s[i:])
	mult := 1.0
	switch strings.ToLower(unit) {
	case "b", "":
		mult = 1
	case "kb", "k":
		mult = 1000
	case "kib":
		mult = 1024
	case "mb":
		mult = 1000 * 1000
	case "mib":
		mult = 1024 * 1024
	case "gb":
		mult = 1000 * 1000 * 1000
	case "gib":
		mult = 1024 * 1024 * 1024
	}
	if n < 0 {
		return 0, false
	}
	return uint64(n * mult), true
}

func parsePercent(s string) (float64, bool) {
	s = strings.TrimSpace(strings.TrimSuffix(s, "%"))
	if s == "" || s == "--" {
		return 0, false
	}
	f, err := strconv.ParseFloat(s, 64)
	return f, err == nil
}

func parseKV(data []byte) map[string]string {
	out := map[string]string{}
	for _, line := range strings.Split(string(data), "\n") {
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		out[strings.TrimSpace(key)] = strings.TrimSpace(value)
	}
	return out
}
