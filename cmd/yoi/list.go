package main

import (
	"os"

	"github.com/AkaraChen/yoi/internal/packlist"
	"github.com/spf13/cobra"
)

func newList() *cobra.Command {
	var from string
	cmd := &cobra.Command{
		Use:   "list",
		Short: "List all packs as JSON",
		Args:  cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			if from == "" {
				from = os.Getenv("YOI_PACKS")
			}
			packs, err := packlist.List(from)
			if err != nil {
				return err
			}
			return printJSON(packs)
		},
	}
	cmd.Flags().StringVar(&from, "from", "", "pack base URL (default "+packlist.DefaultBase+")")
	return cmd
}

func newSearch() *cobra.Command {
	var from string
	cmd := &cobra.Command{
		Use:   "search <query>",
		Short: "Search packs by slug or excerpt, print matches as JSON",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			if from == "" {
				from = os.Getenv("YOI_PACKS")
			}
			packs, err := packlist.List(from)
			if err != nil {
				return err
			}
			return printJSON(packlist.Search(args[0], packs))
		},
	}
	cmd.Flags().StringVar(&from, "from", "", "pack base URL (default "+packlist.DefaultBase+")")
	return cmd
}
