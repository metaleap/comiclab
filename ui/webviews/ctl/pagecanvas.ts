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

    const panels: SVGElement[] = []
    for (let pidx = 0; pidx < page.panels.length; pidx++) {
        const panel = page.panels[pidx]
        const rect = svg.rect({
            'id': 'panel_' + pidx, 'data-pidx': pidx, 'stroke-width': '0.77mm', 'fill': '#ffffff', 'stroke': '#000000',
            'x': `${panel.x}mm`, 'y': `${panel.y}mm`, 'width': `${panel.w}mm`, 'height': `${panel.h}mm`,
            'onclick': (evt: MouseEvent) => {
                evt.stopPropagation()
                rect.style['fill'] = '#ffbb00'
            },
        }) as any
        panels.push(rect)
    }

    ret.dom = svg.svg({
        'id': domId,
        'width': `${page_size.wMm}mm`,
        'height': `${page_size.hMm}mm`,
        'style': utils.dictToArr(style, (k, v) => k + ':' + v).join(';'),
        'onclick': () => { },
    }, ...panels) as any
    ret.onDataChangedAtSource = (newPage: º.Page) => {
        page = newPage
    }
    return ret
}
