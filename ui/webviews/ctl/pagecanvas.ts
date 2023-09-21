import van, { ChildDom } from '../vanjs/van-1.2.0.js'
import * as utils from '../utils.js'
import * as º from '../_º.js'

const html = van.tags
const svg = van.tagsNS("http://www.w3.org/2000/svg")

export type PageCanvas = {
    dom: HTMLElement & SVGElement
    onDataChangedAtSource: (page: º.Page) => void
}

export function create(domId: string, page: º.Page, style: { [_: string]: string }): PageCanvas {
    const ret = {} as PageCanvas
    const page_size = º.pageSizeMm(page)
    let sel_panel_idx: number | undefined = undefined

    const selectPanel = (pIdx?: number, rect?: SVGRectElement) => {
        if (sel_panel_idx === pIdx)
            return
        if (sel_panel_idx !== undefined)
            (document.getElementById('panel_' + sel_panel_idx) as any as SVGRectElement).classList.remove('panel-selected')
        if ((sel_panel_idx = pIdx) !== undefined) {
            if (!rect)
                rect = document.getElementById('panel_' + pIdx) as any as SVGRectElement
            if (rect)
                rect.classList.add('panel-selected')
        }
    }

    const panels: SVGElement[] = []
    for (let pidx = 0; pidx < page.panels.length; pidx++) {
        const panel = page.panels[pidx]
        const rect = svg.rect({
            'class': 'panel', 'id': 'panel_' + pidx, 'data-pidx': pidx,
            'x': `${panel.x}mm`, 'y': `${panel.y}mm`, 'width': `${panel.w}mm`, 'height': `${panel.h}mm`,
            'onclick': (evt: MouseEvent) => {
                evt.stopPropagation()
                selectPanel(pidx, rect)
            },
        }) as any
        panels.push(rect)
    }

    ret.dom = svg.svg({
        'id': domId,
        'width': `${page_size.wMm}mm`,
        'height': `${page_size.hMm}mm`,
        'style': utils.dictToArr(style, (k, v) => k + ':' + v).join(';'),
        'onclick': () => {
            selectPanel(undefined)
        },
    }, ...panels) as any
    ret.onDataChangedAtSource = (newPage: º.Page) => {
        page = newPage
    }
    return ret
}
