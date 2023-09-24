package app

type Collection struct {
	Name        string        `json:"name"`
	Collections []*Collection `json:"collections"`
	Pages       []*PageLayout `json:"pages"`
	Props       CollProps     `json:"props"`
}

type CollProps struct {
	Content struct {
		AuthorID     string                       `json:"authorId,omitempty"`
		CustomFields map[string]map[string]string `json:"customFields,omitempty"`
	} `json:"content"`
	Pages struct {
		PaperFormatID string `json:"paperFormatId,omitempty"`
		BorderWidthMm int    `json:"borderWidthMm,omitempty"`
	} `json:"pages"`
}

type PageLayout struct {
	Name   string    `json:"name"`
	Panels []*Panel  `json:"panels"`
	Props  PageProps `json:"props"`
}

type PageProps struct {
}

type Panel struct {
	X     int        `json:"x"`
	Y     int        `json:"y"`
	W     int        `json:"w"`
	H     int        `json:"h"`
	Round float64    `json:"round"`
	Props PanelProps `json:"props"`
}

type PanelProps struct {
}
