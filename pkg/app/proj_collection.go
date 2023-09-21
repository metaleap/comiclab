package app

type Collection struct {
	Name        string        `json:"name"`
	Collections []*Collection `json:"collections"`
	Pages       []*PageLayout `json:"pages"`
	Props       struct {
		AuthorID      string                       `json:"authorId"`
		PageFormatID  string                       `json:"pageFormatId"`
		ContentFields map[string]map[string]string `json:"contentFields,omitempty"`
	} `json:"props"`
}

type PageLayout struct {
	Name   string   `json:"name"`
	Panels []*Panel `json:"panels"`
	Props  struct{} `json:"props"`
}

type Panel struct {
	X     int     `json:"x"`
	Y     int     `json:"y"`
	W     int     `json:"w"`
	H     int     `json:"h"`
	Round float64 `json:"round"`
}
