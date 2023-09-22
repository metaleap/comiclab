import van, { ChildDom } from '../vanjs/van-1.2.1.js'
import * as utils from '../utils.js'
import * as º from '../_º.js'

const html = van.tags
const svg = van.tagsNS("http://www.w3.org/2000/svg")

export type PageCanvas = {
    page: º.Page
    domId: string
    domStyle: { [_: string]: string }
    dom?: HTMLElement & SVGElement
    onReloaded(page: º.Page): void
    onUserModified: () => void
}

export function create(domId: string, page: º.Page, style: { [_: string]: string }, onUserModified: (_: º.Page) => void, dbg: (...msg: any[]) => void): PageCanvas {
    const ret: PageCanvas = {
        domId: domId,
        page: page,
        domStyle: style,
        onUserModified: () =>
            onUserModified(ret.page),
        onReloaded: (newPage: º.Page) => {
            ret.page = newPage
            render(ret)
        },
    }
    render(ret)
    return ret
}

function render(me: PageCanvas) {
    const old_dom = me.dom
    me.dom = undefined

    const page_size = º.pageSizeMm(me.page)
    let sel_panel_idx: number | undefined = undefined

    const panels: Element[] = []
    for (let pidx = 0; pidx < me.page.panels.length; pidx++) {
        const panel = me.page.panels[pidx]
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
                        me.onUserModified()
                        break
                }
            }
        })
        panels.push(rect)
    }

    const dom = svg.svg({
        'id': me.domId, 'tabindex': 1,
        'width': `${page_size.wMm}mm`,
        'height': `${page_size.hMm}mm`,
        'style': utils.dictToArr(me.domStyle, (k, v) => k + ':' + v).join(';'),
    }, ...panels)
    if (old_dom)
        old_dom.replaceWith(dom)
    me.dom = dom as any
}
