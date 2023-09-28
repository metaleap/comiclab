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
            const shape: º.Shape = (it.sel!.isBalloon ? page.balloons : page.panels)[it.sel!.idx]
            const edge_lr = (edge === º.DirLeft) || (edge === º.DirRight)
            let newx = shape.x, newy = shape.y, neww = shape.w, newh = shape.h
            const others = ([] as º.Shape[]).concat(page.panels, page.balloons)
                .filter((_) => (_ !== shape) && ((edge_lr ? º.shapesOverlapV : º.shapesOverlapH)(_, shape)))
                .flatMap((sh: º.Shape) => {
                    if ((it.sel!.isBalloon) && ((sh as º.Panel).panelProps))
                        sh = adjustedToMargins(page, sh as º.Panel)
                    return edge_lr ? [sh.x, sh.x + sh.w] : [sh.y, sh.y + sh.h]
                })
            if (edge_lr) {
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
        shape_rects.push(...renderShape(it, page, idx, false))
    for (let idx = 0; idx < page.balloons.length; idx++)
        shape_rects.push(...renderShape(it, page, idx, true))

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

function renderShape(it: PageCanvas, page: º.Page, idx: number, isBalloon: boolean): Element[] {
    const shape: º.Shape = (isBalloon ? page.balloons : page.panels)[idx]
    let sh: º.Shape = isBalloon ? { x: shape.x, y: shape.y, w: shape.w, h: shape.h } : adjustedToMargins(page, shape as º.Panel)

    let rx = 0, ry = 0
    const props: º.ShapeProps = (isBalloon ? º.balloonProps : º.panelProps)(page, idx)
    if ((props.roundness !== undefined) && (props.roundness >= 0.01)) {
        rx = 0.5 * Math.max(sh.w, sh.h)
        ry = rx
        if (props.roundness <= 0.99)
            [rx, ry] = [rx * props.roundness, ry * props.roundness]
    }
    const is_sel = it.sel && (idx === it.sel.idx) && (isBalloon === it.sel.isBalloon)
    const shape_kind = isBalloon ? 'balloon' : 'panel'
    let tail: Element | undefined = undefined
    if (isBalloon && (shape as º.Balloon).tailPoint && (props as º.BalloonProps).tailSizeMm) {
        const mm = 3.543307 // as per SVG spec, "user units" per millimeter
        const dst = { x: (shape as º.Balloon).tailPoint!.x * mm, y: (shape as º.Balloon).tailPoint!.y * mm }
        const tail_size = (props as º.BalloonProps).tailSizeMm ?? 0
        const box = { x: Math.min(sh.x, dst.x), y: Math.min(dst.y, sh.y), w: Math.max(sh.w, dst.x - sh.x), h: Math.max(sh.h, dst.y - sh.y) }
        const mid = { x: (sh.x + (sh.w / 2)) * mm, y: (sh.y + (sh.h / 2)) * mm }
        const fx = ((dst.x > mid.x) ? 1 : -1) * ((props as º.BalloonProps).tailCurving ?? 0), fy = ((dst.y > mid.y) ? -1 : 1) * ((props as º.BalloonProps).tailCurving ?? 0)
        const ctl1 = { x: (mid.x + (fx * box.w)) - tail_size, y: (mid.y + (fy * box.h)) - tail_size }
        const ctl2 = { x: (mid.x + (fx * box.w)) + tail_size, y: (mid.y + (fy * box.h)) + tail_size }
        tail = svg.path({
            'fill': 'gold', 'stroke-width': '1mm', 'stroke': 'blue', 'd': `
                M ${mid.x} ${mid.y}
                Q ${ctl1.x} ${ctl1.y} ${dst.x} ${dst.y}
                Q ${ctl2.x} ${ctl2.y} ${mid.x} ${mid.y}
                M ${mid.x} ${mid.y}
            `})
    }
    const rect = svg.rect({
        'id': shape_kind + '_' + idx, 'class': 'shape ' + shape_kind + (is_sel ? (' shape-selected ' + shape_kind + '-selected') : ''),
        'stroke-width': `${props.borderWidthMm ?? 0}mm`, 'tabindex': 2,
        'x': `${sh.x}mm`, 'y': `${sh.y}mm`, 'width': `${sh.w}mm`, 'height': `${sh.h}mm`, 'rx': rx + 'mm', 'ry': ry + 'mm',
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
    return tail ? [tail, rect] : [rect]
}

function adjustedToMargins(page: º.Page, panel: º.Panel) {
    const page_size_mm = º.pageSizeMm(page)
    const props: º.PanelProps = º.panelProps(page, undefined, panel)
    const ret: º.Shape = { x: panel.x, y: panel.y, w: panel.w, h: panel.h }
    if (props && (((props.outerMarginMm ?? 0) >= 0.1) || ((props.innerMarginMm ?? 0) >= 0.1))) {
        const mi = props.innerMarginMm ?? 0
        const e_top = º.fEq(ret.y, 0), e_left = º.fEq(ret.x, 0), e_right = º.fEq((ret.x + ret.w), page_size_mm.w), e_bottom = º.fEq((ret.y + ret.h), page_size_mm.h)
        ret.x += (e_left ? 0 : mi)
        ret.y += (e_top ? 0 : mi)
        const px2 = (panel.x + ret.w) - (e_right ? 0 : mi), py2 = (panel.y + ret.h) - (e_bottom ? 0 : mi)
        ret.w = px2 - ret.x
        ret.h = py2 - ret.y
        if (props.outerMarginMm !== undefined) {
            const mo = props.outerMarginMm!
            if (e_left)
                [ret.x, ret.w] = [ret.x + mo, ret.w - mo]
            if (e_top)
                [ret.y, ret.h] = [ret.y + mo, ret.h - mo]
            if (e_right)
                ret.w -= mo
            if (e_bottom)
                ret.h -= mo
        }
    }
    return ret
}

export function selFrom(panelIdx?: number, balloonIdx?: number): º.ShapeRef | undefined {
    return ((panelIdx === undefined) && (balloonIdx === undefined)) ? undefined : { idx: panelIdx ?? balloonIdx!, isBalloon: (balloonIdx !== undefined) }
}
