package app

import (
	"path/filepath"
)

const configFileName = "comiclab.json"

type Config struct {
	ContentAuthoring struct {
		Authors       map[string]string       `json:"authors"`
		PaperFormats  map[string]*PaperFormat `json:"paperFormats"`
		Languages     map[string]string       `json:"languages"`
		ContentFields map[string]string       `json:"contentFields"`
	} `json:"contentAuthoring"`
}

type PaperFormat struct {
	WidthMm  int `json:"widthMm"`
	HeightMm int `json:"heightMm"`
}

func (me Config) FileName() string  { return configFileName }
func (me *Config) FilePath() string { return filepath.Join(userHomeDir, ".config", projFileName) }
