package app

import (
	"errors"
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
	tmpl_file_path := filepath.Join(DistDirPath, "app.tmpl")
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
	var err error
	println(httpReq.Method, "\t", httpReq.RequestURI)
	// custom semantics: all GETs are static-file requests,
	// all POSTs are API reqs (so API "gets" are body-less POSTs)
	switch httpReq.Method {
	case "GET":
		if httpReq.RequestURI == "" || httpReq.RequestURI == "/" {
			if err = tmplMain.Execute(httpResp, State); err != nil {
				panic(err)
			}
		} else {
			http.ServeFile(httpResp, httpReq, filepath.Join(DistDirPath, httpReq.URL.Path))
		}

	case "POST":
		switch httpReq.URL.Path {
		case "/appState":
			if httpReq.ContentLength <= 0 {
				_, err = httpResp.Write(JSON(State))
			} else {
				err = errors.New("TODO")
			}
		}

	default:
		http.Error(httpResp, "Not found: "+httpReq.Method+" "+httpReq.URL.Path, 404)
	}

	if err != nil {
		http.Error(httpResp, err.Error(), 500)
	}
}
