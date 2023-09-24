import van, { ChildDom } from '../vanjs/van-1.2.1.js'
import * as utils from '../utils.js'
import * as º from '../_º.js'

const svg = van.tagsNS("http://www.w3.org/2000/svg")

export type PageCanvas = {
    dom?: HTMLElement & SVGElement
    selPanelIdx?: number,
    xMm?: number,
    yMm?: number,
    notifyModified: (page: º.Page, pIdx?: number, reRender?: boolean) => void,
    addNewPanel: () => void,
    addNewPanelGrid: (numRows: number, numCols: number) => void,
    panelSelect: (panelIdx?: number, dontRaiseEvent?: boolean) => void,
    panelReorder: (direction: º.Direction, dontDoIt?: boolean) => boolean
    panelSnapTo: (edge: º.Direction, snapDir: º.Direction, dontDoIt?: boolean) => boolean,
}

export function create(domId: string, page: º.Page, onPanelSelection: () => void, selPanelIdx: number | undefined, onUserModified: (page: º.Page, reRender?: boolean) => void): PageCanvas {
    const page_size = º.pageSizeMm(page)
    const it: PageCanvas = {
        selPanelIdx: selPanelIdx,
        panelSelect: (panelIdx?: number, dontRaiseEvent?: boolean) => {
            if (it.selPanelIdx === panelIdx)
                return
            if (it.selPanelIdx !== undefined)
                document.getElementById('panel_' + it.selPanelIdx)?.classList.remove('panel-selected')
            it.selPanelIdx = panelIdx
            if (it.selPanelIdx !== undefined) {
                const dom = document.getElementById('panel_' + it.selPanelIdx)
                dom?.classList.add('panel-selected')
                dom?.focus()
            }
            if (!dontRaiseEvent)
                onPanelSelection()
        },
        notifyModified: (page: º.Page, panelIdx?: number, reRender?: boolean) => {
            it.panelSelect(panelIdx, true)
            onUserModified(page, reRender)
        },
        addNewPanel: () => {
            const mx = parseInt((it.xMm ?? 0).toFixed(0)), my = parseInt((it.yMm ?? 0).toFixed(0))
            page.panels.push({ x: parseInt((parseInt((mx / 10).toFixed(0)) * 10).toFixed(0)), y: parseInt((parseInt((my / 10).toFixed(0)) * 10).toFixed(0)), w: 100, h: 100, round: 0 })
            it.notifyModified(page, page.panels.length - 1, true)
        },
        addNewPanelGrid: (numRows: number, numCols: number) => {
            const wcols = page_size.wMm / numCols, hrows = page_size.hMm / numRows
            for (let r = 0; r < numRows; r++)
                for (let c = 0; c < numCols; c++)
                    page.panels.push({ round: 0, w: wcols, h: hrows, x: c * wcols, y: r * hrows })
            it.notifyModified(page, undefined, true)
        },
        panelReorder: (direction: º.Direction, dontDoIt?: boolean) => {
            if (º.pageMovePanel(page, it.selPanelIdx!, direction, dontDoIt)) {
                if (!dontDoIt)
                    it.notifyModified(page, undefined, true)
                return true
            }
            return false
        },
        panelSnapTo: (edge: º.Direction, snapDir: º.Direction, dontDoIt?: boolean) => {
            const panel = page.panels[it.selPanelIdx!]
            const edge_lr = (edge === º.DirLeft) || (edge === º.DirRight)
            let newx = panel.x, newy = panel.y, neww = panel.w, newh = panel.h
            const panels = page.panels.filter((pnl, pIdx) => (pIdx !== it.selPanelIdx) && ((edge_lr ? º.panelsOverlapV : º.panelsOverlapH)(pnl, panel)))
            if (edge_lr) {
                const others = panels.map((_) => _.x + _.w).concat(panels.map((_) => _.x))
                if (edge === º.DirLeft) {
                    if (snapDir === º.DirLeft)
                        newx = findSnap(panel.x, 0, true, others)
                    else
                        newx = findSnap(panel.x, page_size.wMm, false, others)
                } else {
                    if (snapDir === º.DirLeft)
                        neww = findSnap(panel.x + panel.w, 0, true, others) - panel.x
                    else
                        neww = findSnap(panel.x + panel.w, page_size.wMm, false, others) - panel.x
                }
            } else {
                const others = panels.map((_) => _.y + _.h).concat(panels.map((_) => _.y))
                if (edge === º.DirUp) {
                    if (snapDir === º.DirUp)
                        newy = findSnap(panel.y, 0, true, others)
                    else
                        newy = findSnap(panel.y, page_size.hMm, false, others)
                } else {
                    if (snapDir === º.DirUp)
                        newh = findSnap(panel.y + panel.h, 0, true, others) - panel.y
                    else
                        newh = findSnap(panel.y + panel.h, page_size.hMm, false, others) - panel.y
                }
            }

            if (newx !== panel.x)
                neww += (panel.x - newx)
            else if (newy !== panel.y)
                newh += (panel.y - newy)
            const can_snap = ((newx !== panel.x) || (newy !== panel.y) || (neww !== panel.w) || (newh !== panel.h)) && (neww >= 10) && (newh >= 10)
            if (can_snap && !dontDoIt) {
                [panel.x, panel.y, panel.w, panel.h] = [newx, newy, neww, newh]
                it.notifyModified(page, it.selPanelIdx, true)
            }
            return can_snap
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
            'onfocus': (evt: Event) => it.panelSelect(pidx), 'onclick': (evt: Event) => evt.stopPropagation(),
            'onkeydown': (evt: KeyboardEvent) => {
                switch (evt.key) {
                    case 'Escape':
                        it.panelSelect()
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
                            it.notifyModified(page, pidx)
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
        'onfocus': (evt) => it.panelSelect(),
    }, ...panels) as any
    return it
}


function findSnap(pos: number, initial: number, prev: boolean, maybes: number[]) {
    for (const other of maybes) {
        if (prev && (other < pos) && (other > initial))
            initial = other
        else if ((!prev) && (other > pos) && (other < initial))
            initial = other
    }
    return initial
}
