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
	Name  string   `json:"name"`
	Props struct{} `json:"props"`
}
