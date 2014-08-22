package main

import (
	"fmt"

	"github.com/citadel/citadel"
	"github.com/codegangsta/cli"
)

var runCommand = cli.Command{
	Name:      "run",
	ShortName: "r",
	Usage:     "run a container",
	Action:    runAction,
	Flags: []cli.Flag{
		cli.StringFlag{
			Name:  "name",
			Usage: "image name",
		},
		cli.StringFlag{
			Name:  "cpus",
			Value: "0.1",
			Usage: "cpu shares",
		},
		cli.StringFlag{
			Name:  "memory",
			Value: "256",
			Usage: "memory (in MB)",
		},
		cli.StringFlag{
			Name:  "type",
			Value: "service",
			Usage: "type (service, batch, etc.)",
		},
		cli.StringFlag{
			Name:  "hostname",
			Value: "",
			Usage: "container hostname",
		},
		cli.StringFlag{
			Name:  "domain",
			Value: "",
			Usage: "container domain name",
		},
		cli.StringSliceFlag{
			Name:  "env",
			Usage: "environment variables (key=value pairs)",
			Value: &cli.StringSlice{},
		},
		cli.StringSliceFlag{
			Name:  "arg",
			Usage: "run arguments",
			Value: &cli.StringSlice{},
		},
		cli.StringSliceFlag{
			Name:  "label",
			Usage: "labels",
			Value: &cli.StringSlice{},
		},
		cli.StringSliceFlag{
			Name:  "port",
			Usage: "expose container ports. usage: --port <proto>/<host-port>:<container-port> i.e. --port tcp/:8080 --port tcp/80:8080",
			Value: &cli.StringSlice{},
		},
		cli.BoolFlag{
			Name:  "pull",
			Usage: "pull the image from the repository",
		},
		cli.IntFlag{
			Name:  "count",
			Usage: "number of instances",
			Value: 1,
		},
	},
}

func runAction(c *cli.Context) {
	m := NewManager()
	env := parseEnvironmentVariables(c.StringSlice("env"))
	ports := parsePorts(c.StringSlice("port"))
	for i := 0; i < c.Int("count"); i++ {
		image := &citadel.Image{
			Name:        c.String("name"),
			Cpus:        c.Float64("cpus"),
			Memory:      c.Float64("memory"),
			Hostname:    c.String("hostname"),
			Domainname:  c.String("domain"),
			Labels:      c.StringSlice("label"),
			Args:        c.StringSlice("arg"),
			Environment: env,
			BindPorts:   ports,
			Type:        c.String("type"),
		}
		container, err := m.Run(image, c.Bool("pull"))
		if err != nil {
			logger.Fatalf("error running container: %s\n", err)
		}
		fmt.Printf("started %s on %s\n", container.ID[:12], container.Engine.ID)
	}
}
