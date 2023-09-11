package app

import (
	"errors"
	"html/template"
	"io"
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
	defer func() {
		if err != nil {
			http.Error(httpResp, err.Error(), 500)
			panic(err)
		}
	}()
	println(httpReq.Method, "\t", httpReq.RequestURI)

	// custom semantics: all GETs are static-file requests,
	// all POSTs are API reqs (so API "gets" are body-less POSTs)
	switch httpReq.Method {
	default:
		http.Error(httpResp, "Not found: "+httpReq.Method+" "+httpReq.URL.Path, 404)

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
			var body []byte
			if httpReq.Body != nil {
				defer httpReq.Body.Close()
				body, err = io.ReadAll(httpReq.Body)
			}
			if len(body) == 0 {
				json_data := JSON(State)
				println(string(json_data))
				_, err = httpResp.Write(json_data)
			} else {
				err = errors.New("TODO")
			}
		}
	}
}
