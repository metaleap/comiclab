import van, { ChildDom } from '../vanjs/van-1.2.1.js'
import * as utils from '../utils.js'
import * as º from '../_º.js'

const svg = van.tagsNS("http://www.w3.org/2000/svg")

export type PageCanvas = {
    dom?: HTMLElement & SVGElement
    selPanelIdx?: number,
    xMm?: number,
    yMm?: number,
    addNewPanel: () => void,
    addNewPanelGrid: (numRows: number, numCols: number) => void,
    panelSelect: (evt?: Event, panelIdx?: number) => void,
    panelReorder: (panelIdx: number, direction: º.MoveDirection, dontDoIt?: boolean) => boolean
    panelSnapTo: (panelIdx: number, direction: º.MoveDirection, dontDoIt?: boolean) => boolean,
}

export function create(domId: string, page: º.Page, onPanelSelection: () => void, selPanelIdx: number | undefined, onUserModified: (page: º.Page, pIdx?: number, reRender?: boolean) => void, dbg: (...msg: any[]) => void): PageCanvas {
    const page_size = º.pageSizeMm(page)
    const it: PageCanvas = {
        selPanelIdx: selPanelIdx,
        panelReorder: (panelIdx: number, direction: º.MoveDirection, dontDoIt?: boolean) => {
            if (º.pageMovePanel(page, panelIdx, direction, dontDoIt)) {
                if (!dontDoIt)
                    onUserModified(page, undefined, true)
                return true
            }
            return false
        },
        panelSelect(evt: Event, panelIdx?: number) {
            if (it.selPanelIdx !== undefined)
                document.getElementById('panel_' + it.selPanelIdx)?.classList.remove('panel-selected')
            it.selPanelIdx = panelIdx
            if (it.selPanelIdx !== undefined) {
                const dom = document.getElementById('panel_' + it.selPanelIdx)
                dom?.classList.add('panel-selected')
                dom?.focus()
            }
            onPanelSelection()
        },
        addNewPanel: () => {
            const mx = parseInt((it.xMm ?? 0).toFixed(0)), my = parseInt((it.yMm ?? 0).toFixed(0))
            page.panels.push({ x: mx, y: my, w: 100, h: 100, round: 0 })
            onUserModified(page, page.panels.length - 1, true)
        },
        addNewPanelGrid: (numRows: number, numCols: number) => {
            const wcols = page_size.wMm / numCols, hrows = page_size.hMm / numRows
            for (let r = 0; r < numRows; r++)
                for (let c = 0; c < numCols; c++)
                    page.panels.push({ round: 0, w: wcols, h: hrows, x: c * wcols, y: r * hrows })
            onUserModified(page, undefined, true)
        },
        panelSnapTo: (panelIdx: number, direction: º.MoveDirection, dontDoIt?: boolean) => {

            return false
        },
    }

    const panels: Element[] = []
    for (let pidx = 0; pidx < page.panels.length; pidx++) {
        const panel = page.panels[pidx]
        let rx = 0, ry = 0
        if (panel.round >= 0.01) {
            rx = 0.5 * Math.max(panel.w, panel.h)
            ry = rx
            if (panel.round <= 0.99)
                [rx, ry] = [rx * panel.round, ry * panel.round]
        }
        const rect = svg.rect({
            'class': 'panel' + ((pidx === selPanelIdx) ? ' panel-selected' : ''), 'id': 'panel_' + pidx, 'data-pidx': pidx, 'tabindex': 2,
            'x': `${panel.x}mm`, 'y': `${panel.y}mm`, 'width': `${panel.w}mm`, 'height': `${panel.h}mm`, 'rx': rx + 'mm', 'ry': ry + 'mm',
            'onfocus': (evt: Event) => it.panelSelect(evt, pidx), 'onclick': (evt: Event) => evt.stopPropagation(),
            'onkeydown': (evt: KeyboardEvent) => {
                switch (evt.key) {
                    case 'Escape':
                        it.panelSelect(evt)
                        it.dom?.focus()
                        break
                    case 'ArrowLeft':
                    case 'ArrowRight':
                    case 'ArrowDown':
                    case 'ArrowUp':
                        evt.stopPropagation()
                        const factor = ((evt.key == 'ArrowLeft') || (evt.key == 'ArrowUp')) ? -1 : 1,
                            min = evt.altKey ? 10 : undefined,
                            prop_name = ((evt.key == 'ArrowLeft') || (evt.key == 'ArrowRight'))
                                ? (evt.altKey ? 'width' : 'x')
                                : (evt.altKey ? 'height' : 'y'),
                            new_val = parseInt(((panel as any)[prop_name[0]] + ((evt.shiftKey ? 10 : 1) * factor)).toFixed(0))
                        if ((min === undefined) || new_val >= min) {
                            (panel as any)[prop_name[0]] = new_val
                            rect.setAttribute(prop_name, (panel as any)[prop_name[0]] + 'mm')
                            onUserModified(page, pidx)
                        }
                        break
                }
            }
        })
        panels.push(rect)
    }

    const dom_style = { 'width': `${page_size.wMm}mm`, 'height': `${page_size.hMm}mm`, 'background-color': '#fff' }
    it.dom = svg.svg({
        'id': domId, 'tabindex': 1, 'width': `${page_size.wMm}mm`, 'height': `${page_size.hMm}mm`,
        'style': utils.dictToArr(dom_style, (k, v) => k + ':' + v).join(';'),
        'onfocus': (evt) => it.panelSelect(evt),
    }, ...panels) as any
    return it
}
