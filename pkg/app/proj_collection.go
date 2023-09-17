package app

type Collection struct {
	ID            string                       `json:"id"`
	ContentFields map[string]map[string]string `json:"contentFields,omitempty"`
	AuthorID      string                       `json:"authorID,omitempty"`
	Collections   []*Collection                `json:"collections,omitempty"`
	Pages         []*PageLayout                `json:"pages,omitempty"`
}

type PageLayout struct {
	ID string `json:"id"`
}
