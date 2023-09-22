import van, { ChildDom } from '../vanjs/van-1.2.1.js'
import * as utils from '../utils.js'
import * as º from '../_º.js'

const html = van.tags
const svg = van.tagsNS("http://www.w3.org/2000/svg")

export type PageCanvas = {
    dom: HTMLElement & SVGElement
    onReloaded(page: º.Page): void
}

export function create(domId: string, page: º.Page, style: { [_: string]: string }, onUserModified: (_: º.Page) => void, dbg: (...msg: any[]) => void): PageCanvas {
    const ret = {} as PageCanvas
    const page_size = º.pageSizeMm(page)
    let sel_panel_idx: number | undefined = undefined

    const panels: SVGElement[] = []
    for (let pidx = 0; pidx < page.panels.length; pidx++) {
        const panel = page.panels[pidx]
        const rect = svg.rect({
            'class': 'panel', 'id': 'panel_' + pidx, 'data-pidx': pidx, 'tabindex': 2,
            'x': `${panel.x}mm`, 'y': `${panel.y}mm`, 'width': `${panel.w}mm`, 'height': `${panel.h}mm`,
            'onfocus': (evt: MouseEvent) => {
                evt.stopPropagation()
                sel_panel_idx = pidx
            },
            'onblur': (evt: MouseEvent) => {
                evt.stopPropagation()
                sel_panel_idx = undefined
            },
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
        }) as any
        panels.push(rect)
    }

    ret.dom = svg.svg({
        'id': domId, 'tabindex': 1,
        'width': `${page_size.wMm}mm`,
        'height': `${page_size.hMm}mm`,
        'style': utils.dictToArr(style, (k, v) => k + ':' + v).join(';'),
    }, ...panels) as any
    ret.onReloaded = (newPage: º.Page) => {
        page = newPage
    }
    return ret
}
