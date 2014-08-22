package main

import (
	"encoding/json"
	"os"
	"os/user"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/citadel/citadel"
)

func parseEnvironmentVariables(pairs []string) map[string]string {
	env := make(map[string]string)
	for _, p := range pairs {
		parts := strings.Split(p, "=")
		if len(parts) != 2 {
			logger.Error("environment variables must be in key=value pairs")
			return nil
		}
		k := parts[0]
		v := parts[1]
		env[k] = v
	}
	return env
}

func parsePorts(pairs []string) []*citadel.Port {
	ports := []*citadel.Port{}
	for _, p := range pairs {
		parts := strings.Split(p, "/")
		if len(parts) != 2 {
			logger.Error("port definitions must be in <proto>/<host-port>:<container-port> pairs")
			return nil
		}
		proto := parts[0]
		portDef := parts[1]
		// parse ports
		portParts := strings.Split(portDef, ":")
		if len(portParts) != 2 {
			logger.Error("port definitions must be in <proto>/<host-port>:<container-port> pairs")
			return nil
		}
		hostPortDef := portParts[0]
		containerPortDef := portParts[1]
		hostPort := 0
		containerPort := 0
		if hostPortDef != "" {
			i, err := strconv.Atoi(hostPortDef)
			if err != nil {
				logger.Error("unable to parse port: %s", err)
				return nil
			}
			hostPort = i
		}
		if containerPortDef != "" {
			i, err := strconv.Atoi(containerPortDef)
			if err != nil {
				logger.Error("unable to parse port: %s", err)
				return nil
			}
			containerPort = i
		}
		port := &citadel.Port{
			Proto:         proto,
			Port:          hostPort,
			ContainerPort: containerPort,
		}
		ports = append(ports, port)
	}
	return ports
}

func loadConfig() (*ShipyardConfig, error) {
	usr, err := user.Current()
	if err != nil {
		return nil, err
	}
	path := filepath.Join(usr.HomeDir, CONFIG_PATH)
	f, err := os.OpenFile(path, os.O_RDONLY, 0600)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, ErrConfigDoesNotExist
		} else {
			return nil, err
		}
	}
	defer f.Close()
	var cfg *ShipyardConfig
	if err := json.NewDecoder(f).Decode(&cfg); err != nil {
		return nil, ErrInvalidConfig
	}
	return cfg, nil
}
