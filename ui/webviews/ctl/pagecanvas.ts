import van, { ChildDom } from '../vanjs/van-1.2.1.js'
import * as utils from '../utils.js'
import * as º from '../_º.js'

const svg = van.tagsNS("http://www.w3.org/2000/svg")

export type PageCanvas = {
    dom?: HTMLElement & SVGElement
    selPanelIdx?: number,
}

export function create(domId: string, page: º.Page, onPanelSelection: () => void, onUserModified: (_: º.Page) => void, dbg: (...msg: any[]) => void): PageCanvas {
    const page_size = º.pageSizeMm(page)
    const it: PageCanvas = {}

    const panels: Element[] = []
    const onFocusChanged = (idx?: number) => (evt: MouseEvent) => {
        evt.stopPropagation()
        it.selPanelIdx = idx
        onPanelSelection()
    }
    for (let pidx = 0; pidx < page.panels.length; pidx++) {
        const panel = page.panels[pidx]
        const rect = svg.rect({
            'class': 'panel', 'id': 'panel_' + pidx, 'data-pidx': pidx, 'tabindex': 2,
            'x': `${panel.x}mm`, 'y': `${panel.y}mm`, 'width': `${panel.w}mm`, 'height': `${panel.h}mm`,
            'onfocus': onFocusChanged(pidx),
            'onblur': onFocusChanged(),
            'onkeydown': (evt: KeyboardEvent) => {
                switch (evt.key) {
                    case 'ArrowLeft':
                    case 'ArrowRight':
                    case 'ArrowDown':
                    case 'ArrowUp':
                        evt.stopPropagation()
                        const factor = ((evt.key == 'ArrowLeft') || (evt.key == 'ArrowUp')) ? -1 : 1
                        if ((evt.key == 'ArrowLeft') || (evt.key == 'ArrowRight')) {
                            panel.x = panel.x + ((evt.shiftKey ? 10 : 1) * factor)
                            rect.setAttribute('x', panel.x + 'mm')
                        } else if ((evt.key == 'ArrowUp') || (evt.key == 'ArrowDown')) {
                            panel.y = panel.y + ((evt.shiftKey ? 10 : 1) * factor)
                            rect.setAttribute('y', panel.y + 'mm')
                        }
                        onUserModified(page)
                        break
                }
            }
        })
        panels.push(rect)
    }

    const dom_style = { 'width': `${page_size.wMm}mm`, 'height': `${page_size.hMm}mm`, 'background-color': '#fff' }
    it.dom = svg.svg({
        'id': domId, 'tabindex': 1,
        'width': `${page_size.wMm}mm`,
        'height': `${page_size.hMm}mm`,
        'style': utils.dictToArr(dom_style, (k, v) => k + ':' + v).join(';'),
    }, ...panels) as any
    return it
}
