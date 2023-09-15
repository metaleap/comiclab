package app

import (
	"os"
	"time"
)

type state = struct {
	Config *Config `json:"config,omitempty"`
	Proj   *Proj   `json:"proj,omitempty"`
}

var (
	Exiting     = false
	userHomeDir = os.Getenv("HOME")
	State       state
)

func Main() {
	var err error
	if State.Config, err = readJSONFile(State.Config.FilePath(), &Config{}); err != nil {
		panic(err)
	}
	if State.Proj, err = readJSONFile(State.Proj.FilePath(), &Proj{}); err != nil {
		panic(err)
	}

	const port = 64646
	go httpListenAndServe(port)
	go browserLaunch(port)

	for Exiting = false; !Exiting; time.Sleep(time.Second) {
		Exiting = (browserPid == 0)
	}
	onExit()
}

func onExit() {
	// _ = os.RemoveAll(browserTmpDirPath)
}
