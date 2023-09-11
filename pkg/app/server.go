package app

import (
	"html/template"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
)

var DistDirPath = filepath.Join(os.Getenv("GOPATH"), "src/github.com/metaleap/comiclab/dist")
var tmplMain *template.Template

func init() {
	var err error
	tmpl_file_path := filepath.Join(DistDirPath, "app.html")
	if tmplMain, err = template.New(filepath.Base(tmpl_file_path)).ParseFiles(tmpl_file_path); err != nil {
		panic(err)
	}
}

func httpListenAndServe(port int) {
	if err := (&http.Server{
		Addr:    ":" + strconv.Itoa(port),
		Handler: http.HandlerFunc(httpHandle),
	}).ListenAndServe(); err != nil {
		panic(err)
	}
}

func httpHandle(httpResp http.ResponseWriter, httpReq *http.Request) {
	println(httpReq.Method, "\t", httpReq.RequestURI)
	switch httpReq.Method {
	case "GET":
		if httpReq.RequestURI == "" || httpReq.RequestURI == "/" {
			if err := tmplMain.Execute(httpResp, State); err != nil {
				panic(err)
			}
		} else {
			http.ServeFile(httpResp, httpReq, filepath.Join(DistDirPath, httpReq.URL.Path))
		}

	case "POST":

	default:
		http.Error(httpResp, "Not found: "+httpReq.Method+" "+httpReq.URL.Path, 404)
	}
}
