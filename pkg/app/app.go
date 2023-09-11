package app

import (
	"math/rand"
	"os"
	"time"
)

var (
	Exiting     = false
	userHomeDir = os.Getenv("HOME")
	State       struct {
		Config Config
		Proj   Proj
	}
)

func Main() {
	port := 1024 + rand.Intn(64000)
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
