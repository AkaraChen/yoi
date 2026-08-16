package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/AkaraChen/yoi/internal/audit"
	"github.com/AkaraChen/yoi/internal/skillsdata"
	"github.com/AkaraChen/yoi/internal/state"
	"github.com/spf13/cobra"
)

func main() {
	if err := newRoot().Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "yoi: %v\n", err)
		os.Exit(1)
	}
}

func newRoot() *cobra.Command {
	root := &cobra.Command{
		Use:           "yoi",
		Short:         "Current deploy state and append-only deploy log",
		SilenceUsage:  true,
		SilenceErrors: true,
	}
	root.AddCommand(newDeploy(), newLog(), newSkills())
	return root
}

func newDeploy() *cobra.Command {
	cmd := &cobra.Command{Use: "deploy", Short: "Read or overwrite DEPLOY.md"}
	cmd.AddCommand(newDeployWrite(), newDeployShow())
	return cmd
}

func newDeployWrite() *cobra.Command {
	var service, port, start, stop, body string
	cmd := &cobra.Command{
		Use:   "write",
		Short: "Overwrite DEPLOY.md with the current five keys",
		RunE: func(cmd *cobra.Command, args []string) error {
			root, err := os.Getwd()
			if err != nil {
				return err
			}
			return state.Write(root, state.Record{
				Service: service,
				Port:    port,
				Start:   start,
				Stop:    stop,
				Body:    body,
			})
		},
	}
	cmd.Flags().StringVar(&service, "service", "", "service name")
	cmd.Flags().StringVar(&port, "port", "", "listen port")
	cmd.Flags().StringVar(&start, "start", "", "how to start")
	cmd.Flags().StringVar(&stop, "stop", "", "how to stop")
	cmd.Flags().StringVar(&body, "body", "", "one or two human sentences")
	_ = cmd.MarkFlagRequired("service")
	_ = cmd.MarkFlagRequired("start")
	_ = cmd.MarkFlagRequired("stop")
	return cmd
}

func newDeployShow() *cobra.Command {
	return &cobra.Command{
		Use:   "show",
		Short: "Print the current DEPLOY.md keys",
		RunE: func(cmd *cobra.Command, args []string) error {
			root, err := os.Getwd()
			if err != nil {
				return err
			}
			rec, err := state.Read(root)
			if err != nil {
				return err
			}
			return printJSON(rec)
		},
	}
}

func newLog() *cobra.Command {
	cmd := &cobra.Command{Use: "log", Short: "Append or read .yoi/deploy.log"}
	cmd.AddCommand(newLogAppend(), newLogShow())
	return cmd
}

func newLogAppend() *cobra.Command {
	var result, command, project, custom string
	cmd := &cobra.Command{
		Use:   "append",
		Short: "Append one LDJSON line",
		RunE: func(cmd *cobra.Command, args []string) error {
			root, err := os.Getwd()
			if err != nil {
				return err
			}
			var extra map[string]any
			if custom != "" {
				if err := json.Unmarshal([]byte(custom), &extra); err != nil {
					return fmt.Errorf("custom_data must be a JSON object: %w", err)
				}
			}
			if project == "" {
				project = audit.DefaultProject(root)
			}
			entry, err := audit.Append(root, audit.Entry{
				Project:    project,
				Result:     result,
				Cmd:        command,
				CustomData: extra,
			})
			if err != nil {
				return err
			}
			return printJSON(entry.Fixed())
		},
	}
	cmd.Flags().StringVar(&result, "result", "", "green or fail")
	cmd.Flags().StringVar(&command, "cmd", "", "command that was run")
	cmd.Flags().StringVar(&project, "project", "", "project name (defaults to directory name)")
	cmd.Flags().StringVar(&custom, "custom", "", "optional JSON object for custom_data")
	_ = cmd.MarkFlagRequired("result")
	_ = cmd.MarkFlagRequired("cmd")
	return cmd
}

func newLogShow() *cobra.Command {
	var full bool
	cmd := &cobra.Command{
		Use:   "show",
		Short: "Print log lines; default is fixed fields only",
		RunE: func(cmd *cobra.Command, args []string) error {
			root, err := os.Getwd()
			if err != nil {
				return err
			}
			entries, err := audit.ReadAll(root)
			if err != nil {
				return err
			}
			out := make([]any, 0, len(entries))
			for _, e := range entries {
				if full {
					out = append(out, e)
				} else {
					out = append(out, e.Fixed())
				}
			}
			return printJSON(out)
		},
	}
	cmd.Flags().BoolVar(&full, "full", false, "include custom_data")
	return cmd
}

func newSkills() *cobra.Command {
	cmd := &cobra.Command{Use: "skills", Short: "Serve bundled skill markdown from this binary"}
	cmd.AddCommand(newSkillsList(), newSkillsGet())
	return cmd
}

func newSkillsList() *cobra.Command {
	return &cobra.Command{
		Use:   "list",
		Short: "List bundled skills",
		RunE: func(cmd *cobra.Command, args []string) error {
			return printJSON(skillsdata.List())
		},
	}
}

func newSkillsGet() *cobra.Command {
	return &cobra.Command{
		Use:   "get <deploy|log|hermes>",
		Short: "Print a bundled skill",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			body, err := skillsdata.Get(args[0])
			if err != nil {
				return err
			}
			fmt.Print(body)
			return nil
		},
	}
}

func printJSON(v any) error {
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	return enc.Encode(v)
}
