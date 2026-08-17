package skillsdata

import (
	_ "embed"
	"fmt"
	"strings"
)

//go:embed deploy.md
var deploySkill string

//go:embed log.md
var logSkill string

type Skill struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func All() map[string]string {
	return map[string]string{
		"deploy": strings.TrimSpace(deploySkill) + "\n",
		"log":    strings.TrimSpace(logSkill) + "\n",
	}
}

func Get(name string) (string, error) {
	body, ok := All()[name]
	if !ok {
		return "", fmt.Errorf("unknown skill %q (want deploy or log)", name)
	}
	return body, nil
}

func List() []Skill {
	return []Skill{
		{Name: "deploy", Description: "Current deploy state. Reopen or copy a deploy."},
		{Name: "log", Description: "Audit log. Failures and how many times it was installed."},
	}
}
