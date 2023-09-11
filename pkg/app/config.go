package app

import (
	"path/filepath"
)

const configFileName = "comiclab.json"

type Config struct {
	Authors map[string]string
}

func (me Config) FileName() string  { return configFileName }
func (me *Config) FilePath() string { return filepath.Join(userHomeDir, ".config", projFileName) }
