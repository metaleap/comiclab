package app

import (
	"math/rand"
	"time"
)

var Exiting = false
var State struct {
	Config
	Proj
}

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
