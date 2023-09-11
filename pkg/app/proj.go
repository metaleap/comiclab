package app

import (
	"os"
	"path/filepath"
	"strings"
)

const projFileName = "comiclab.json"

var userHomeDir = os.Getenv("HOME")

func init() {
	var err error
	if State.Proj.dirPath, err = os.Getwd(); err != nil {
		panic(err)
	}
}

type Proj struct {
	dirPath string
}

func (me *Proj) filePath() string {
	return filepath.Join(me.dirPath, projFileName)
}

func (me Proj) Name() (ret string) {
	ret = me.dirPath
	if userHomeDir != "" && strings.HasPrefix(ret, userHomeDir) {
		ret = "~" + ret[len(userHomeDir):]
	}
	return
}
