package packget

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

const DefaultBase = "https://yoi-sigma.vercel.app/packs"

var nameOK = regexp.MustCompile(`^[a-z0-9][a-z0-9-]*$`)

type manifest struct {
	Files []string `json:"files"`
}

func Get(name, destRoot, base string) (string, error) {
	if !nameOK.MatchString(name) {
		return "", fmt.Errorf("pack name %q is not a slug", name)
	}
	if base == "" {
		base = DefaultBase
	}
	base = strings.TrimRight(base, "/")
	if _, err := url.ParseRequestURI(base); err != nil {
		return "", fmt.Errorf("pack base must be an http or https URL")
	}

	client := &http.Client{Timeout: 15 * time.Second}
	indexURL := base + "/" + name + "/index.json"
	raw, err := getOK(client, indexURL)
	if err != nil {
		return "", err
	}
	var man manifest
	if err := json.Unmarshal(raw, &man); err != nil {
		return "", fmt.Errorf("index.json: %w", err)
	}
	if len(man.Files) == 0 {
		return "", fmt.Errorf("index.json lists no files")
	}

	dest := filepath.Join(destRoot, "packs", name)
	for _, rel := range man.Files {
		rel = path.Clean(rel)
		if rel == "." || strings.HasPrefix(rel, "..") || path.IsAbs(rel) {
			return "", fmt.Errorf("bad file path %q", rel)
		}
		body, err := getOK(client, base+"/"+name+"/"+rel)
		if err != nil {
			return "", err
		}
		out := filepath.Join(dest, filepath.FromSlash(rel))
		if err := os.MkdirAll(filepath.Dir(out), 0o755); err != nil {
			return "", err
		}
		mode := os.FileMode(0o644)
		if strings.HasSuffix(rel, ".sh") {
			mode = 0o755
		}
		if err := os.WriteFile(out, body, mode); err != nil {
			return "", err
		}
	}
	return dest, nil
}

func getOK(client *http.Client, rawURL string) ([]byte, error) {
	u, err := url.Parse(rawURL)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") {
		return nil, fmt.Errorf("want an http or https URL")
	}
	resp, err := client.Get(u.String())
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GET %s: %s", u.String(), resp.Status)
	}
	return io.ReadAll(io.LimitReader(resp.Body, 8<<20))
}
