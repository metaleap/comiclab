package app

type Collection struct {
	Name          string                       `json:"name"`
	Collections   []*Collection                `json:"collections"`
	Pages         []*PageLayout                `json:"pages"`
	ContentFields map[string]map[string]string `json:"contentFields,omitempty"`
	AuthorID      string                       `json:"authorID,omitempty"`
}

type PageLayout struct {
	Name string `json:"name"`
}
