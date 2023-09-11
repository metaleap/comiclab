package app

import (
	"encoding/json"
	"os"
)

func JSON(obj any) ([]byte, error) {
	return json.Marshal(obj)
}

func FromJSON[T any](jsonBytes []byte) (ret T, err error) {
	err = json.Unmarshal(jsonBytes, &ret)
	return
}

func readJSONFile[T any](filePath string, ifNotExists T) (ret T, err error) {
	file_bytes, err := os.ReadFile(filePath)
	if err == nil {
		ret, err = FromJSON[T](file_bytes)
	} else if os.IsNotExist(err) {
		ret, err = ifNotExists, nil
	}
	return
}

func writeJSONFile[T any](filePath string, obj T) (T, error) {
	file_bytes, err := JSON(obj)
	if err == nil {
		err = writeFile(filePath, file_bytes)
	}
	return obj, err
}

func writeFile(filePath string, fileBytes []byte) error {
	return os.WriteFile(filePath, fileBytes, os.ModePerm)
}
