package skillsdata

import (
	"fmt"
	"strings"
	_ "embed"
)

//go:embed deploy.md
var deploySkill string

//go:embed log.md
var logSkill string

//go:embed hermes.md
var hermesSkill string

type Skill struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func All() map[string]string {
	return map[string]string{
		"deploy": strings.TrimSpace(deploySkill) + "\n",
		"log":    strings.TrimSpace(logSkill) + "\n",
		"hermes": strings.TrimSpace(hermesSkill) + "\n",
	}
}

func Get(name string) (string, error) {
	body, ok := All()[name]
	if !ok {
		return "", fmt.Errorf("unknown skill %q (want deploy, log, or hermes)", name)
	}
	return body, nil
}

func List() []Skill {
	return []Skill{
		{Name: "deploy", Description: "Current deploy state. Reopen or copy a deploy."},
		{Name: "log", Description: "Audit log. Failures and how many times it was installed."},
		{Name: "hermes", Description: "Beginner Hermes install. Opt-in; stop when green."},
	}
}
