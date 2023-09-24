import van, { ChildDom } from '../vanjs/van-1.2.1.js'
import * as utils from '../utils.js'
import * as º from '../_º.js'
import * as ctl_pagecanvas from './pagecanvas.js'

const html = van.tags

export type PanelEdgeBar = {
    canvas: ctl_pagecanvas.PageCanvas,
    dom: HTMLElement,
    buttons: HTMLButtonElement[],
    edge: º.Direction,
    refresh: () => void,
}

export function create(domId: string, pageCanvas: ctl_pagecanvas.PageCanvas, edge: º.Direction): PanelEdgeBar {
    const dom = html.div({ 'title': edge, 'id': domId, 'class': 'page-editor-panel-edgebar' })
    const btn_snap_left = html.button({ 'class': 'btn', 'style': utils.codiconCss('triangle-left'), 'title': 'Snap leftwards', 'onclick': () => { it.canvas.panelSnapTo(it.edge, º.DirLeft) } })
    const btn_snap_right = html.button({ 'class': 'btn', 'style': utils.codiconCss('triangle-right'), 'title': 'Snap rightwards', 'onclick': () => { it.canvas.panelSnapTo(it.edge, º.DirRight) } })
    const btn_snap_up = html.button({ 'class': 'btn', 'style': utils.codiconCss('triangle-up'), 'title': 'Snap upwards', 'onclick': () => it.canvas.panelSnapTo(it.edge, º.DirUp) })
    const btn_snap_down = html.button({ 'class': 'btn', 'style': utils.codiconCss('triangle-down'), 'title': 'Snap downwards', 'onclick': () => it.canvas.panelSnapTo(it.edge, º.DirDown) })
    const buttons = ((edge === º.DirPrev) || (edge === º.DirNext)) ? [btn_snap_left, btn_snap_right] : [btn_snap_up, btn_snap_down]
    const it: PanelEdgeBar = {
        canvas: pageCanvas,
        dom: dom,
        edge: edge,
        buttons: buttons,
        refresh() {
            console.log("edgeRefr", it.canvas.selPanelIdx)
            if (it.canvas.selPanelIdx === undefined) {
                it.dom.style.display = 'none'
                return
            }
            btn_snap_left.disabled = !it.canvas.panelSnapTo(it.edge, º.DirLeft, true)
            btn_snap_right.disabled = !it.canvas.panelSnapTo(it.edge, º.DirRight, true)
            btn_snap_up.disabled = !it.canvas.panelSnapTo(it.edge, º.DirUp, true)
            btn_snap_down.disabled = !it.canvas.panelSnapTo(it.edge, º.DirDown, true)

            it.dom.style.display = 'inline-block'
        },
    }
    van.add(it.dom, ...it.buttons)
    return it
}
