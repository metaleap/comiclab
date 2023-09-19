package app

type Collection struct {
	ID            string                       `json:"id"`
	Collections   []*Collection                `json:"collections"`
	Pages         []*PageLayout                `json:"pages"`
	ContentFields map[string]map[string]string `json:"contentFields,omitempty"`
	AuthorID      string                       `json:"authorID,omitempty"`
}

type PageLayout struct {
	ID string `json:"id"`
}
