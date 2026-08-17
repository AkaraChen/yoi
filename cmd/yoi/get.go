package main

import (
	"fmt"
	"os"

	"github.com/AkaraChen/yoi/internal/packget"
	"github.com/spf13/cobra"
)

func newGet() *cobra.Command {
	var from string
	cmd := &cobra.Command{
		Use:   "get <name>",
		Short: "Download a pack by name. Does not install anything.",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			root, err := os.Getwd()
			if err != nil {
				return err
			}
			if from == "" {
				from = os.Getenv("YOI_PACKS")
			}
			dest, err := packget.Get(args[0], root, from)
			if err != nil {
				return err
			}
			fmt.Println(dest)
			return nil
		},
	}
	cmd.Flags().StringVar(&from, "from", "", "pack base URL (default https://yoi-sigma.vercel.app/packs)")
	return cmd
}
