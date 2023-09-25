package app

type Collection struct {
	Name        string        `json:"name"`
	Collections []*Collection `json:"collections"`
	Pages       []*PageLayout `json:"pages"`
	CollProps   CollProps     `json:"collProps"`
}

type CollProps struct {
	Content struct {
		AuthorID     string                       `json:"authorId,omitempty"`
		CustomFields map[string]map[string]string `json:"customFields,omitempty"`
	} `json:"content"`
	Pages struct {
		PaperFormatID string `json:"paperFormatId,omitempty"`
		Panels        struct {
			BorderWidthMm int `json:"borderWidthMm,omitempty"`
		} `json:"panels"`
	} `json:"pages"`
}

type PageLayout struct {
	Name      string    `json:"name"`
	Panels    []*Panel  `json:"panels"`
	PageProps PageProps `json:"pageProps"`
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
