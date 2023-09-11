package app

import (
	"encoding/json"
)

func JSON(obj any) []byte {
	ret, err := json.Marshal(obj)
	if err != nil {
		panic(err)
	}
	return ret
}
