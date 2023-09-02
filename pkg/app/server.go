package app

import (
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strconv"
)

var DistDirPath = filepath.Join(os.Getenv("GOPATH"), "src/github.com/metaleap/comiclab/dist")

func httpListenAndServe(port int) {
	if err := (&http.Server{
		Addr:    ":" + strconv.Itoa(port),
		Handler: http.HandlerFunc(httpHandle),
	}).ListenAndServe(); err != nil {
		panic(err)
	}
}

func httpHandle(httpResp http.ResponseWriter, httpReq *http.Request) {
	println(httpReq.URL.Path)
	switch ext := path.Ext(httpReq.URL.Path); ext {
	case "":
		http.ServeFile(httpResp, httpReq, filepath.Join(DistDirPath, "app.html"))
	case ".css", ".js":
		http.ServeFile(httpResp, httpReq, filepath.Join(DistDirPath, httpReq.URL.Path))
	default:
		http.Error(httpResp, "Not found: "+httpReq.URL.Path, 404)
	}
}
