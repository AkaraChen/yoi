package packlist

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const DefaultBase = "https://yoi-sigma.vercel.app"

type Pack struct {
	Slug    string  `json:"slug"`
	Excerpt string  `json:"excerpt"`
	Cover   *string `json:"cover"`
}

// SiteBase normalizes a base override to the site root: a get-style base
// ending in "/packs" is trimmed so one override value serves both "yoi get"
// and the list/search commands.
func SiteBase(base string) (string, error) {
	if base == "" {
		base = DefaultBase
	}
	base = strings.TrimRight(base, "/")
	u, err := url.Parse(base)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") {
		return "", fmt.Errorf("pack base must be an http or https URL")
	}
	u.Path = strings.TrimSuffix(u.Path, "/packs")
	return strings.TrimRight(u.String(), "/"), nil
}

func List(base string) ([]Pack, error) {
	site, err := SiteBase(base)
	if err != nil {
		return nil, err
	}
	client := &http.Client{Timeout: 15 * time.Second}
	raw, err := getOK(client, site+"/packs.json")
	if err != nil {
		return nil, err
	}
	var packs []Pack
	if err := json.Unmarshal(raw, &packs); err != nil {
		return nil, fmt.Errorf("packs.json: %w", err)
	}
	return packs, nil
}

func Search(query string, packs []Pack) []Pack {
	q := strings.ToLower(strings.TrimSpace(query))
	out := make([]Pack, 0, len(packs))
	for _, p := range packs {
		if q == "" ||
			strings.Contains(strings.ToLower(p.Slug), q) ||
			strings.Contains(strings.ToLower(p.Excerpt), q) {
			out = append(out, p)
		}
	}
	return out
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
	return io.ReadAll(io.LimitReader(resp.Body, 1<<20))
}
