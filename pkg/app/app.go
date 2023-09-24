package app

import (
	"os"
)

type state = struct {
	Config *Config `json:"config,omitempty"`
	Proj   *Proj   `json:"proj,omitempty"`
}

var (
	userHomeDir = os.Getenv("HOME")
	State       state
)

func Main() {
	var err error
	if State.Config, err = readJSONFile(State.Config.FilePath(), &Config{}); err != nil {
		if !os.IsNotExist(err) {
			panic(err)
		} else {
			State.Config = &Config{}
			State.Config.ContentAuthoring.Authors, State.Config.ContentAuthoring.Languages, State.Config.ContentAuthoring.CustomFields = map[string]string{}, map[string]string{}, map[string]bool{}
			State.Config.ContentAuthoring.PaperFormats = map[string]*PaperFormat{}
		}
	}
	if State.Proj, err = readJSONFile(State.Proj.FilePath(), &Proj{}); err != nil {
		if !os.IsNotExist(err) {
			panic(err)
		} else {
			State.Proj = &Proj{Collections: []*Collection{}}
		}
	}

	const port = 64646
	httpListenAndServe(port)
}
