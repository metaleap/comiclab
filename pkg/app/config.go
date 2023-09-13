package app

import (
	"path/filepath"
)

const configFileName = "comiclab.json"

type Config struct {
	Authors     map[string]string      `json:"authors"`
	PageFormats map[string]*PageFormat `json:"pageFormats"`
}

type PageFormat struct {
	WidthMm  int `json:"widthMm"`
	HeightMm int `json:"heightMm"`
}

func (me Config) FileName() string  { return configFileName }
func (me *Config) FilePath() string { return filepath.Join(userHomeDir, ".config", projFileName) }
