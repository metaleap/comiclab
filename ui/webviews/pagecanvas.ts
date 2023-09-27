import van from './vanjs/van-1.2.1.debug.js'
import * as utils from './utils.js'
import * as º from './_º.js'

const svg = van.tagsNS("http://www.w3.org/2000/svg")

export type PageCanvas = {
    dom?: HTMLElement & SVGElement
    selPanelIdx?: number
    mousePosMm?: { x: number, y: number }
    notifyModified: (page: º.Page, pIdx?: number, reRender?: boolean) => void
    addNewPanel: () => void
    addNewPanelGrid: (numRows: number, numCols: number) => void
    select: (panelIdx?: number, balloonIdx?: number, dontRaiseEvent?: boolean) => void
    panelReorder: (direction: º.Direction, dontDoIt?: boolean) => boolean
    panelSnapTo: (edge: º.Direction, snapDir: º.Direction, dontDoIt?: boolean) => boolean
    whatsAt(pos?: { x: number, y: number }): { panelIdx?: number, balloonIdx?: number }
}

export function create(domId: string, page: º.Page, onPanelSelection: () => void, selPanelIdx: number | undefined, onUserModified: (page: º.Page, reRender?: boolean) => void): PageCanvas {
    const page_size_mm = º.pageSizeMm(page)
    if ((selPanelIdx !== undefined) && (selPanelIdx >= page.panels.length))
        selPanelIdx = undefined
    const it: PageCanvas = {
        selPanelIdx: selPanelIdx,
        select: (panelIdx?: number, balloonIdx?: number, dontRaiseEvent?: boolean) => {
            // even if no change in selPanelIdx, do not return early since we do want the below focus() call
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
            it.select(panelIdx, undefined, true)
            onUserModified(page, reRender)
        },
        addNewPanel: () => {
            page.panels.push({ panelProps: {}, x: ~~(it.mousePosMm?.x ?? 0), y: ~~(it.mousePosMm?.y ?? 0), w: 100, h: 100 })
            it.notifyModified(page, page.panels.length - 1, true)
        },
        addNewPanelGrid: (numRows: number, numCols: number) => {
            const wcols = page_size_mm.w / numCols, hrows = page_size_mm.h / numRows
            for (let r = 0; r < numRows; r++)
                for (let c = 0; c < numCols; c++)
                    page.panels.push({ panelProps: {}, w: ~~wcols, h: ~~hrows, x: ~~(c * wcols), y: ~~(r * hrows) })
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
                        newx = findSnap(panel.x, page_size_mm.w, false, others)
                } else {
                    if (snapDir === º.DirLeft)
                        neww = findSnap(panel.x + panel.w, 0, true, others) - panel.x
                    else
                        neww = findSnap(panel.x + panel.w, page_size_mm.w, false, others) - panel.x
                }
            } else {
                const others = panels.map((_) => _.y + _.h).concat(panels.map((_) => _.y))
                if (edge === º.DirUp) {
                    if (snapDir === º.DirUp)
                        newy = findSnap(panel.y, 0, true, others)
                    else
                        newy = findSnap(panel.y, page_size_mm.h, false, others)
                } else {
                    if (snapDir === º.DirUp)
                        newh = findSnap(panel.y + panel.h, 0, true, others) - panel.y
                    else
                        newh = findSnap(panel.y + panel.h, page_size_mm.h, false, others) - panel.y
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
        whatsAt: (pos) => {
            const ret: { panelIdx?: number, balloonIdx?: number } = {}
            if (!pos)
                pos = it.mousePosMm
            for (let pidx = 0; pos && pidx < page.panels.length; pidx++)
                if (º.isPosInShape(page.panels[pidx], pos))
                    ret.panelIdx = pidx // dont break early tho, later overlappers are to take over that spot
            for (let bidx = 0; pos && bidx < page.balloons.length; bidx++)
                if (º.isPosInShape(page.balloons[bidx], pos))
                    ret.balloonIdx = bidx // dito as above
            return ret
        },
    }

    const panels: Element[] = []
    for (let pidx = 0; pidx < page.panels.length; pidx++) {
        const panel = page.panels[pidx]
        let px = panel.x, py = panel.y, pw = panel.w, ph = panel.h
        const props = º.panelProps(page, pidx)

        if (((props.outerMarginMm !== undefined) && (props.outerMarginMm >= 0.1)) || ((props.innerMarginMm !== undefined) && (props.innerMarginMm >= 0.1))) {
            const mi = props.innerMarginMm ?? 0
            const e_top = º.fEq(py, 0), e_left = º.fEq(px, 0), e_right = º.fEq((px + pw), page_size_mm.w), e_bottom = º.fEq((py + ph), page_size_mm.h)
            px += (e_left ? 0 : mi)
            py += (e_top ? 0 : mi)
            const px2 = (panel.x + pw) - (e_right ? 0 : mi), py2 = (panel.y + ph) - (e_bottom ? 0 : mi)
            pw = px2 - px
            ph = py2 - py
            if (props.outerMarginMm !== undefined) {
                const mo = props.outerMarginMm!
                if (e_left)
                    [px, pw] = [px + mo, pw - mo]
                if (e_top)
                    [py, ph] = [py + mo, ph - mo]
                if (e_right)
                    pw -= mo
                if (e_bottom)
                    ph -= mo
            }
        }

        let rx = 0, ry = 0
        if ((props.roundness !== undefined) && (props.roundness >= 0.01)) {
            rx = 0.5 * Math.max(pw, ph)
            ry = rx
            if (props.roundness <= 0.99)
                [rx, ry] = [rx * props.roundness, ry * props.roundness]
        }
        const panelBorderWidthMm = props.borderWidthMm ?? 0
        const rect = svg.rect({
            'id': 'panel_' + pidx, 'class': 'panel' + ((pidx === selPanelIdx) ? ' panel-selected' : ''),
            'stroke-width': `${panelBorderWidthMm}mm`, 'tabindex': 2, 'data-panelIdx': pidx,
            'x': `${px}mm`, 'y': `${py}mm`, 'width': `${pw}mm`, 'height': `${ph}mm`, 'rx': rx + 'mm', 'ry': ry + 'mm',
            'onfocus': (evt: Event) => it.select(pidx), 'onclick': (evt: Event) => evt.stopPropagation(),
            'onkeydown': (evt: KeyboardEvent) => {
                switch (evt.key) {
                    case 'Escape':
                        it.select()
                        it.dom?.focus()
                        break
                    case 'ArrowLeft':
                    case 'ArrowRight':
                    case 'ArrowDown':
                    case 'ArrowUp':
                        evt.stopPropagation()
                        const factor = ((evt.key === 'ArrowLeft') || (evt.key === 'ArrowUp')) ? -1 : 1,
                            min = evt.altKey ? 10 : undefined,
                            prop_name = ((evt.key === 'ArrowLeft') || (evt.key === 'ArrowRight'))
                                ? (evt.altKey ? 'width' : 'x')
                                : (evt.altKey ? 'height' : 'y'),
                            new_val = ~~(((panel as any)[prop_name[0]] as number) + ((evt.shiftKey ? 10 : 1) * factor))
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

    const dom_style = { 'width': `${page_size_mm.w}mm`, 'height': `${page_size_mm.h}mm`, 'background-color': '#fff' }
    it.dom = svg.svg({
        'id': domId, 'tabindex': 1, 'width': `${page_size_mm.w}mm`, 'height': `${page_size_mm.h}mm`,
        'style': utils.dictToArr(dom_style, (k, v) => k + ':' + v).join(';'),
        'onfocus': (evt) => it.select(),
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
