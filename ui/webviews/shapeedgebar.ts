import van from './vanjs/van-1.2.1.debug.js'
import * as utils from './utils.js'
import * as º from './_º.js'
import * as ctl_pagecanvas from './pagecanvas.js'

const html = van.tags

export type ShapeEdgeBar = {
    canvas: ctl_pagecanvas.PageCanvas,
    dom: HTMLElement,
    buttons: HTMLButtonElement[],
    edge: º.Direction,
    refresh: () => void,
    snapShapeTo: (evt: Event, edge: º.Direction, snapDir: º.Direction) => void,
}

export function create(domId: string, pageCanvas: ctl_pagecanvas.PageCanvas, edge: º.Direction): ShapeEdgeBar {
    const dom = html.div({ 'id': domId, 'class': 'page-editor-shape-edgebar' })
    const btn_snap_left = html.button({ 'class': 'btn', 'style': utils.codiconCss('triangle-left'), 'title': 'Snap leftwards', 'onclick': (evt: Event) => it.snapShapeTo(evt, it.edge, º.DirLeft) })
    const btn_snap_right = html.button({ 'class': 'btn', 'style': utils.codiconCss('triangle-right'), 'title': 'Snap rightwards', 'onclick': (evt: Event) => it.snapShapeTo(evt, it.edge, º.DirRight) })
    const btn_snap_up = html.button({ 'class': 'btn', 'style': utils.codiconCss('triangle-up'), 'title': 'Snap upwards', 'onclick': (evt: Event) => it.snapShapeTo(evt, it.edge, º.DirUp) })
    const btn_snap_down = html.button({ 'class': 'btn', 'style': utils.codiconCss('triangle-down'), 'title': 'Snap downwards', 'onclick': (evt: Event) => it.snapShapeTo(evt, it.edge, º.DirDown) })
    const buttons = ((edge === º.DirPrev) || (edge === º.DirNext)) ? [btn_snap_left, btn_snap_right] : [btn_snap_up, btn_snap_down]
    const it: ShapeEdgeBar = {
        canvas: pageCanvas,
        dom: dom,
        edge: edge,
        buttons: buttons,
        refresh() {
            if (!it.canvas.sel) {
                it.dom.style.display = 'none'
                return
            }
            btn_snap_left.disabled = !it.canvas.shapeSnapTo(it.edge, º.DirLeft, true)
            btn_snap_right.disabled = !it.canvas.shapeSnapTo(it.edge, º.DirRight, true)
            btn_snap_up.disabled = !it.canvas.shapeSnapTo(it.edge, º.DirUp, true)
            btn_snap_down.disabled = !it.canvas.shapeSnapTo(it.edge, º.DirDown, true)

            it.dom.style.display = 'inline-block'
        },
        snapShapeTo: (evt: Event, edge: º.Direction, snapDir: º.Direction) => {
            it.canvas.shapeSnapTo(edge, snapDir)
        }
    }
    van.add(it.dom, ...it.buttons)
    return it
}
