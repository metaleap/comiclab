package app

import (
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
		}
	}()
	println(httpReq.Method, "\t", httpReq.RequestURI)

	// custom semantics: all GETs are static-file requests,
	// all POSTs are API reqs (so API "gets" are body-less POSTs)
	switch httpReq.Method {
	default:
		http.Error(httpResp, "Not found: "+httpReq.Method+" "+httpReq.URL.Path, 404)

	case "GET":
		if httpReq.RequestURI != "" && httpReq.RequestURI != "/" {
			http.ServeFile(httpResp, httpReq, filepath.Join(DistDirPath, httpReq.URL.Path))
		} else if err = tmplMain.Execute(httpResp, State); err != nil {
			panic(err)
		}

	case "POST":
		switch httpReq.URL.Path {
		case "/appState":
			var body []byte
			if httpReq.Body != nil {
				defer httpReq.Body.Close()
				if body, err = io.ReadAll(httpReq.Body); err != nil {
					return
				}
			}
			if len(body) == 0 {
				var json_bytes []byte
				if json_bytes, err = JSON(State); err == nil {
					_, err = httpResp.Write(json_bytes)
				}
			} else {
				var postedState state
				postedState, err = FromJSON[state](body)
				println(string(body))
				if err == nil && postedState.Config != nil {
					if postedState.Config, err = writeJSONFile(State.Config.FilePath(), postedState.Config); err == nil {
						State.Config = postedState.Config
					}
				}
				if err == nil && postedState.Proj != nil {
					if postedState.Proj, err = writeJSONFile(State.Proj.FilePath(), postedState.Proj); err == nil {
						State.Proj = postedState.Proj
					}
				}
			}
		}
	}
}
