package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/AkaraChen/yoi/internal/audit"
	"github.com/AkaraChen/yoi/internal/skillsdata"
	"github.com/AkaraChen/yoi/internal/state"
)

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintf(os.Stderr, "yoi: %v\n", err)
		os.Exit(1)
	}
}

func run(args []string) error {
	if len(args) < 1 {
		return fmt.Errorf("usage: yoi <deploy|log|skills> ...")
	}
	switch args[0] {
	case "deploy":
		return runDeploy(args[1:])
	case "log":
		return runLog(args[1:])
	case "skills":
		return runSkills(args[1:])
	default:
		return fmt.Errorf("unknown command %q (want deploy, log, or skills)", args[0])
	}
}

func runSkills(args []string) error {
	if len(args) == 0 || args[0] == "list" {
		return printJSON(skillsdata.List())
	}
	if args[0] != "get" {
		return fmt.Errorf("usage: yoi skills list | yoi skills get <deploy|log>")
	}
	if len(args) < 2 {
		return fmt.Errorf("usage: yoi skills get <deploy|log>")
	}
	body, err := skillsdata.Get(args[1])
	if err != nil {
		return err
	}
	fmt.Print(body)
	return nil
}

func runDeploy(args []string) error {
	if len(args) < 1 {
		return fmt.Errorf("usage: yoi deploy <write|show>")
	}
	root, err := os.Getwd()
	if err != nil {
		return err
	}
	switch args[0] {
	case "write":
		fs := parseFlags(args[1:])
		rec := state.Record{
			Service: fs["service"],
			Port:    fs["port"],
			Start:   fs["start"],
			Stop:    fs["stop"],
			Body:    fs["body"],
		}
		if rec.Service == "" || rec.Start == "" || rec.Stop == "" {
			return fmt.Errorf("deploy write needs --service --start --stop (optional --port --body)")
		}
		return state.Write(root, rec)
	case "show":
		rec, err := state.Read(root)
		if err != nil {
			return err
		}
		return printJSON(rec)
	default:
		return fmt.Errorf("unknown deploy subcommand %q", args[0])
	}
}

func runLog(args []string) error {
	if len(args) < 1 {
		return fmt.Errorf("usage: yoi log <append|show>")
	}
	root, err := os.Getwd()
	if err != nil {
		return err
	}
	switch args[0] {
	case "append":
		fs := parseFlags(args[1:])
		var custom map[string]any
		if raw := fs["custom"]; raw != "" {
			if err := json.Unmarshal([]byte(raw), &custom); err != nil {
				return fmt.Errorf("custom_data must be a JSON object: %w", err)
			}
		}
		project := fs["project"]
		if project == "" {
			project = audit.DefaultProject(root)
		}
		if fs["result"] == "" || fs["cmd"] == "" {
			return fmt.Errorf("log append needs --result --cmd (optional --project --custom)")
		}
		entry, err := audit.Append(root, audit.Entry{
			Project:    project,
			Result:     fs["result"],
			Cmd:        fs["cmd"],
			CustomData: custom,
		})
		if err != nil {
			return err
		}
		return printJSON(entry.Fixed())
	case "show":
		fs := parseFlags(args[1:])
		full := flagSet(args[1:], "full")
		entries, err := audit.ReadAll(root)
		if err != nil {
			return err
		}
		out := make([]any, 0, len(entries))
		for _, e := range entries {
			if full || fs["full"] == "true" {
				out = append(out, e)
			} else {
				out = append(out, e.Fixed())
			}
		}
		return printJSON(out)
	default:
		return fmt.Errorf("unknown log subcommand %q", args[0])
	}
}

func parseFlags(args []string) map[string]string {
	out := map[string]string{}
	for i := 0; i < len(args); i++ {
		a := args[i]
		if !strings.HasPrefix(a, "--") {
			continue
		}
		key := strings.TrimPrefix(a, "--")
		if key == "full" {
			out["full"] = "true"
			continue
		}
		if i+1 >= len(args) || strings.HasPrefix(args[i+1], "--") {
			out[key] = "true"
			continue
		}
		i++
		out[key] = args[i]
	}
	return out
}

func flagSet(args []string, name string) bool {
	for _, a := range args {
		if a == "--"+name {
			return true
		}
	}
	return false
}

func printJSON(v any) error {
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	return enc.Encode(v)
}
