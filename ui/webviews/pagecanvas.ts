import van from './vanjs/van-1.2.1.debug.js'
import * as utils from './utils.js'
import * as º from './_º.js'

const svg = van.tagsNS("http://www.w3.org/2000/svg")

export type PageCanvas = {
    dom?: HTMLElement & SVGElement
    sel?: º.ShapeRef
    mousePosMm?: { x: number, y: number }
    notifyModified: (page: º.Page, pIdx: number | undefined, bIdx: number | undefined, reRender?: boolean) => void
    addNewBalloon: () => void
    addNewPanel: () => void
    addNewPanelGrid: (numRows: number, numCols: number) => void
    select: (sel: º.ShapeRef | undefined, dontRaiseEvent?: boolean) => void
    shapeRestack: (direction: º.Direction, dontDoIt?: boolean) => boolean
    shapeSnapTo: (edge: º.Direction, snapDir: º.Direction, dontDoIt?: boolean) => boolean
    whatsAt(pos?: { x: number, y: number }): º.ShapeRef | undefined
}

export function create(domId: string, page: º.Page, onShapeSelection: () => void, sel: º.ShapeRef | undefined, onUserModified: (page: º.Page, reRender?: boolean) => void): PageCanvas {
    const page_size_mm = º.pageSizeMm(page)
    if (sel && (sel.idx >= (sel.isBalloon ? page.balloons : page.panels).length))
        sel = undefined
    const it: PageCanvas = {
        sel: sel,
        select: (sel: º.ShapeRef | undefined, dontRaiseEvent?: boolean) => {
            // even if no difference in selection, no early return here, as callers do expect the below focus() call
            if (it.sel)
                for (const shapekind of ['balloon', 'panel'])
                    document.getElementById(shapekind + '_' + it.sel.idx)?.classList.remove(shapekind + '-selected', 'shape-selected')
            if ((it.sel = sel) !== undefined)
                for (const shapekind of [it.sel.isBalloon ? 'balloon' : 'panel']) {
                    const dom = document.getElementById(shapekind + '_' + it.sel.idx)
                    dom?.classList.add(shapekind + '-selected', 'shape-selected')
                    dom?.focus()
                }
            if (!dontRaiseEvent)
                onShapeSelection()
        },
        notifyModified: (page: º.Page, panelIdx: number | undefined, balloonIdx: number | undefined, reRender?: boolean) => {
            it.select(selFrom(panelIdx, balloonIdx), true)
            onUserModified(page, reRender)
        },
        addNewBalloon: () => {
            page.balloons.push({ balloonProps: {}, x: ~~(it.mousePosMm?.x ?? 0), y: ~~(it.mousePosMm?.y ?? 0), w: 70, h: 20 })
            it.notifyModified(page, undefined, page.balloons.length - 1, true)
        },
        addNewPanel: () => {
            page.panels.push({ panelProps: {}, x: ~~(it.mousePosMm?.x ?? 0), y: ~~(it.mousePosMm?.y ?? 0), w: 145, h: 105 })
            it.notifyModified(page, page.panels.length - 1, undefined, true)
        },
        addNewPanelGrid: (numRows: number, numCols: number) => {
            const wcols = page_size_mm.w / numCols, hrows = page_size_mm.h / numRows
            for (let r = 0; r < numRows; r++)
                for (let c = 0; c < numCols; c++)
                    page.panels.push({ panelProps: {}, w: ~~wcols, h: ~~hrows, x: ~~(c * wcols), y: ~~(r * hrows) })
            it.notifyModified(page, undefined, undefined, true)
        },
        shapeRestack: (direction: º.Direction, dontDoIt?: boolean) => {
            if (º.pageReorder(page, ((it.sel?.isBalloon) ? undefined : (it.sel?.idx)), ((it.sel?.isBalloon) ? (it.sel?.idx) : undefined), direction, dontDoIt)) {
                if (!dontDoIt)
                    it.notifyModified(page, undefined, undefined, true)
                return true
            }
            return false
        },
        shapeSnapTo: (edge: º.Direction, snapDir: º.Direction, dontDoIt?: boolean) => {
            let shapes = (it.sel!.isBalloon ? page.balloons : page.panels) as º.Shape[]
            const shape = shapes[it.sel!.idx]
            const edge_lr = (edge === º.DirLeft) || (edge === º.DirRight)
            let newx = shape.x, newy = shape.y, neww = shape.w, newh = shape.h
            shapes = shapes.filter((pnl, pIdx) => (pIdx !== it.sel!.idx) && ((edge_lr ? º.shapesOverlapV : º.shapesOverlapH)(pnl, shape)))
            if (edge_lr) {
                const others = shapes.map((_) => _.x + _.w).concat(shapes.map((_) => _.x))
                if (edge === º.DirLeft) {
                    if (snapDir === º.DirLeft)
                        newx = findSnap(shape.x, 0, true, others)
                    else
                        newx = findSnap(shape.x, page_size_mm.w, false, others)
                } else {
                    if (snapDir === º.DirLeft)
                        neww = findSnap(shape.x + shape.w, 0, true, others) - shape.x
                    else
                        neww = findSnap(shape.x + shape.w, page_size_mm.w, false, others) - shape.x
                }
            } else {
                const others = shapes.map((_) => _.y + _.h).concat(shapes.map((_) => _.y))
                if (edge === º.DirUp) {
                    if (snapDir === º.DirUp)
                        newy = findSnap(shape.y, 0, true, others)
                    else
                        newy = findSnap(shape.y, page_size_mm.h, false, others)
                } else {
                    if (snapDir === º.DirUp)
                        newh = findSnap(shape.y + shape.h, 0, true, others) - shape.y
                    else
                        newh = findSnap(shape.y + shape.h, page_size_mm.h, false, others) - shape.y
                }
            }

            if (newx !== shape.x)
                neww += (shape.x - newx)
            else if (newy !== shape.y)
                newh += (shape.y - newy)
            const can_snap = ((newx !== shape.x) || (newy !== shape.y) || (neww !== shape.w) || (newh !== shape.h)) && (neww >= 10) && (newh >= 10)
            if (can_snap && !dontDoIt) {
                [shape.x, shape.y, shape.w, shape.h] = [newx, newy, neww, newh]
                it.notifyModified(page, ((it.sel!.isBalloon) ? undefined : (it.sel!.idx)), ((it.sel!.isBalloon) ? (it.sel!.idx) : undefined), true)
            }
            return can_snap
        },
        whatsAt: (pos) => {
            let ret: º.ShapeRef | undefined = undefined
            if (!pos)
                pos = it.mousePosMm
            for (let pidx = 0; pos && pidx < page.panels.length; pidx++)
                if (º.isPosInShape(page.panels[pidx], pos))
                    ret = { idx: pidx, isBalloon: false } // dont break early tho, later overlappers are to take over that spot
            for (let bidx = 0; pos && bidx < page.balloons.length; bidx++)
                if (º.isPosInShape(page.balloons[bidx], pos))
                    ret = { idx: bidx, isBalloon: true } // dito as above
            return ret
        },
    }

    const shape_rects: Element[] = []
    for (let idx = 0; idx < page.panels.length; idx++)
        shape_rects.push(renderShape(it, page, page_size_mm, page.panels[idx], idx, false))
    for (let idx = 0; idx < page.balloons.length; idx++)
        shape_rects.push(renderShape(it, page, page_size_mm, page.balloons[idx], idx, true))

    const dom_style = { 'width': `${page_size_mm.w}mm`, 'height': `${page_size_mm.h}mm`, 'background-color': '#fff' }
    it.dom = svg.svg({
        'id': domId, 'tabindex': 1, 'width': `${page_size_mm.w}mm`, 'height': `${page_size_mm.h}mm`,
        'style': utils.dictToArr(dom_style, (k, v) => k + ':' + v).join(';'),
        'onfocus': (evt) => { it.select(undefined, undefined) },
    }, ...shape_rects) as any
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

function renderShape(it: PageCanvas, page: º.Page, pageSizeMm: º.Size, shape: º.Panel | º.Balloon, idx: number, isBalloon: boolean): Element {
    let shx = shape.x, shy = shape.y, shw = shape.w, shh = shape.h
    const props: º.ShapeProps = (isBalloon ? º.balloonProps : º.panelProps)(page, idx)

    const pprops = isBalloon ? undefined : props as º.PanelProps
    if (pprops && (((pprops.outerMarginMm ?? 0) >= 0.1) || ((pprops.innerMarginMm ?? 0) >= 0.1))) {
        const mi = pprops.innerMarginMm ?? 0
        const e_top = º.fEq(shy, 0), e_left = º.fEq(shx, 0), e_right = º.fEq((shx + shw), pageSizeMm.w), e_bottom = º.fEq((shy + shh), pageSizeMm.h)
        shx += (e_left ? 0 : mi)
        shy += (e_top ? 0 : mi)
        const px2 = (shape.x + shw) - (e_right ? 0 : mi), py2 = (shape.y + shh) - (e_bottom ? 0 : mi)
        shw = px2 - shx
        shh = py2 - shy
        if (pprops.outerMarginMm !== undefined) {
            const mo = pprops.outerMarginMm!
            if (e_left)
                [shx, shw] = [shx + mo, shw - mo]
            if (e_top)
                [shy, shh] = [shy + mo, shh - mo]
            if (e_right)
                shw -= mo
            if (e_bottom)
                shh -= mo
        }
    }

    let rx = 0, ry = 0
    if ((props.roundness !== undefined) && (props.roundness >= 0.01)) {
        rx = 0.5 * Math.max(shw, shh)
        ry = rx
        if (props.roundness <= 0.99)
            [rx, ry] = [rx * props.roundness, ry * props.roundness]
    }
    const is_sel = it.sel && (idx === it.sel.idx) && (isBalloon === it.sel.isBalloon)
    const shape_kind = isBalloon ? 'balloon' : 'panel'
    const rect = svg.rect({
        'id': shape_kind + '_' + idx, 'class': 'shape ' + shape_kind + (is_sel ? (' shape-selected ' + shape_kind + '-selected') : ''),
        'stroke-width': `${props.borderWidthMm ?? 0}mm`, 'tabindex': 2,
        'x': `${shx}mm`, 'y': `${shy}mm`, 'width': `${shw}mm`, 'height': `${shh}mm`, 'rx': rx + 'mm', 'ry': ry + 'mm',
        'onfocus': (evt: Event) => { it.select({ isBalloon: isBalloon, idx: idx }) }, 'onclick': (evt: Event) => { evt.stopPropagation() },
        'onkeydown': (evt: KeyboardEvent) => {
            switch (evt.key) {
                case 'Escape':
                    it.select(undefined, undefined)
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
                        new_val = ~~(((shape as any)[prop_name[0]] as number) + ((evt.shiftKey ? 10 : 1) * factor))
                    if ((min === undefined) || new_val >= min) {
                        (shape as any)[prop_name[0]] = new_val
                        rect.setAttribute(prop_name, (shape as any)[prop_name[0]] + 'mm')
                        it.notifyModified(page, isBalloon ? undefined : idx, isBalloon ? idx : undefined)
                    }
                    break
            }
        }
    })
    return rect
}

export function selFrom(panelIdx?: number, balloonIdx?: number): º.ShapeRef | undefined {
    return ((panelIdx === undefined) && (balloonIdx === undefined)) ? undefined : { idx: panelIdx ?? balloonIdx!, isBalloon: (balloonIdx !== undefined) }
}
