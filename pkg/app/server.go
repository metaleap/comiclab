package app

import (
	"io"
	"net/http"
	"path/filepath"
	"strconv"
)

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

	// custom convention: all GETs are binary-file requests,
	// all POSTs are API requests (so API "gets" are body-less POSTs)
	if httpReq.Method == "GET" {
		http.ServeFile(httpResp, httpReq, filepath.Join(projDirPath, httpReq.URL.Path))
		return
	}
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
