package app

type Series struct {
	ID       string     `json:"id"`
	Episodes []*Episode `json:"episodes,omitempty"`
}

type Episode struct {
	ID    string        `json:"id"`
	Pages []*PageLayout `json:"pages,omitempty"`
}

type PageLayout struct {
}
