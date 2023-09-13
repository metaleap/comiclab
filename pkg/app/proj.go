package app

import (
	"os"
	"path/filepath"
	"strings"
)

const projFileName = "comiclab.json"

var projDirPath string

func init() {
	var err error
	if projDirPath, err = os.Getwd(); err != nil {
		panic(err)
	}
}

type Proj struct {
	Series          []*Series `json:"series"`
	DefaultLanguage string    `json:"defaultLanguage"`
}

func (me *Proj) FilePath() string { return filepath.Join(projDirPath, projFileName) }
func (me Proj) Name() (ret string) {
	ret = projDirPath
	if userHomeDir != "" && strings.HasPrefix(ret, userHomeDir) {
		ret = "~" + ret[len(userHomeDir):]
	}
	return
}
