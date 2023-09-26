package app

type Collection struct {
	Name        string        `json:"name"`
	Collections []*Collection `json:"collections"`
	Pages       []*Page       `json:"pages"`
	CollProps   CollProps     `json:"collProps"`
	PageProps   PageProps     `json:"pageProps"`
	PanelProps  PanelProps    `json:"panelProps"`
}

type Page struct {
	Name       string     `json:"name"`
	Panels     []*Panel   `json:"panels"`
	PageProps  PageProps  `json:"pageProps"`
	PanelProps PanelProps `json:"panelProps"`
}

type Panel struct {
	X          int        `json:"x"`
	Y          int        `json:"y"`
	W          int        `json:"w"`
	H          int        `json:"h"`
	PanelProps PanelProps `json:"panelProps"`
}

type CollProps struct {
	AuthorID     string                       `json:"authorId,omitempty"`
	CustomFields map[string]map[string]string `json:"customFields,omitempty"`
}

type PageProps struct {
	PaperFormatID string `json:"paperFormatId,omitempty"`
}

type PanelProps struct {
	Roundness     *float64 `json:"roundness,omitempty"`
	BorderWidthMm *float64 `json:"borderWidthMm,omitempty"`
	MarginMm      *float64 `json:"marginMm,omitempty"`
}
