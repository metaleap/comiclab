package app

type Collection struct {
	Name        string        `json:"name"`
	Collections []*Collection `json:"collections"`
	Pages       []*PageLayout `json:"pages"`
	Props       struct {
		ContentFields map[string]map[string]string `json:"contentFields,omitempty"`
		AuthorID      string                       `json:"authorID,omitempty"`
	} `json:"props"`
}

type PageLayout struct {
	Name  string   `json:"name"`
	Props struct{} `json:"props"`
}
