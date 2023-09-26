package app

type Collection struct {
	Name         string        `json:"name"`
	Collections  []*Collection `json:"collections"`
	Pages        []*Page       `json:"pages"`
	CollProps    CollProps     `json:"collProps"`
	PageProps    PageProps     `json:"pageProps"`
	PanelProps   PanelProps    `json:"panelProps"`
	BalloonProps BalloonProps  `json:"balloonProps"`
}

type Page struct {
	Name         string       `json:"name"`
	Panels       []*Panel     `json:"panels"`
	PageProps    PageProps    `json:"pageProps"`
	PanelProps   PanelProps   `json:"panelProps"`
	BalloonProps BalloonProps `json:"balloonProps"`
}

type Shape struct {
	X int `json:"x"`
	Y int `json:"y"`
	W int `json:"w"`
	H int `json:"h"`
}

type Panel struct {
	Shape
	PanelProps PanelProps `json:"panelProps"`
}

type Balloon struct {
	Shape
	BalloonProps BalloonProps `json:"balloonProps"`
}

type CollProps struct {
	AuthorID     string                       `json:"authorId,omitempty"`
	CustomFields map[string]map[string]string `json:"customFields,omitempty"`
}

type PageProps struct {
	PaperFormatID string `json:"paperFormatId,omitempty"`
}

type ShapeProps struct {
	Roundness     *float64 `json:"roundness,omitempty"`
	BorderWidthMm *float64 `json:"borderWidthMm,omitempty"`
}

type PanelProps struct {
	ShapeProps
	OuterMarginMm *float64 `json:"outerMarginMm,omitempty"`
	InnerMarginMm *float64 `json:"innerMarginMm,omitempty"`
}

type BalloonProps struct {
	ShapeProps
}
