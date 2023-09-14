package app

type Collection struct {
	ID            string                       `json:"id"`
	ContentFields map[string]map[string]string `json:"contentFields,omitempty"`
	Author        string                       `json:"author,omitempty"`
	Collections   []*Collection                `json:"collections,omitempty"`
	Pages         []*PageLayout                `json:"pages,omitempty"`
}

type Episode struct {
	ID            string                       `json:"id"`
	ContentFields map[string]map[string]string `json:"contentFields,omitempty"`
	Pages         []*PageLayout                `json:"pages,omitempty"`
	Author        string                       `json:"author,omitempty"`
}

type Series struct {
	ID            string                       `json:"id"`
	ContentFields map[string]map[string]string `json:"contentFields,omitempty"`
	Episodes      []*Episode                   `json:"episodes,omitempty"`
	Author        string                       `json:"author,omitempty"`
}

type PageLayout struct {
	ID string `json:"id"`
}
