package app

import (
	"os/exec"
	"strconv"
)

const browserTmpDirPath = "./.browser"

var browserPid = -1

var browserCmd = []string{
	"", // filled in by browserDetect()
	"--new-window", "--single-process",
	"--user-data-dir=" + browserTmpDirPath,
	"--disable-extensions",
	"--allow-file-access-from-files",
	// "--auto-open-devtools-for-tabs",

	"--disable-client-side-phishing-detection",
	"--force-device-scale-factor=2",
	"--disable-component-extensions-with-background-pages",
	"--disable-default-apps",
	"--mute-audio",
	"--no-default-browser-check",
	"--no-first-run",
	"--use-fake-device-for-media-stream",
	"--allow-running-insecure-content",
	"--autoplay-policy=user-gesture-required",
	"--disable-background-timer-throttling",
	"--disable-ipc-flooding-protection",
	"--disable-notifications",
	"--disable-popup-blocking",
	"--disable-prompt-on-repost",
	"--disable-device-discovery-notifications",
	"--password-store=basic",
	"--disable-background-networking",
	"--disable-background-networking",
	"--disable-breakpad",
	"--disable-component-update",
	"--disable-domain-reliability",
	"--disable-sync",
	"--disable-features=OptimizationHints",
	"--disable-features=Translate",
	"--enable-automation",
	"--deny-permission-prompts",
}

func browserDetect() {
	var cmdidx int
	cmdnames := []string{"chromium", "chromium-browser", "chrome", "google-chrome"}
	for i, l := 0, len(cmdnames); i < l; i++ {
		cmdnames = append(cmdnames, cmdnames[i]+"-stable")
	}
	for i, cmdname := range cmdnames {
		if _, nope := exec.LookPath(cmdname); nope == nil {
			cmdidx = i
			break
		}
	}
	browserCmd[0] = cmdnames[cmdidx]
}

func browserLaunch(port int) {
	if browserCmd[0] == "" {
		browserDetect()
	}

	cmd := exec.Command(browserCmd[0], append(browserCmd[1:], "--app=http://localhost:"+strconv.Itoa(port))...)
	if err := cmd.Start(); err != nil {
		panic(err)
	}
	browserPid = cmd.Process.Pid
	if err := cmd.Wait(); err != nil {
		panic(err)
	}
	browserPid = 0
}
