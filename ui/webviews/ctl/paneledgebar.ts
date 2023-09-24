import van, { ChildDom } from '../vanjs/van-1.2.1.js'
import * as utils from '../utils.js'
import * as º from '../_º.js'
import * as ctl_pagecanvas from './pagecanvas.js'

const html = van.tags

export type PanelEdgeBar = {
    canvas: ctl_pagecanvas.PageCanvas,
    dom: HTMLElement,
    buttons: HTMLButtonElement[],
    page?: º.Page,
    selPanelIdx?: number,
    edge: º.Direction,
    refresh: (page: º.Page, panelIdx?: number) => void,
}

export function create(domId: string, pageCanvas: ctl_pagecanvas.PageCanvas, edge: º.Direction): PanelEdgeBar {
    const dom = html.div({ 'title': edge, 'id': domId, 'class': 'page-editor-panel-edgebar' })
    const button = (_: any) =>
        html.button({ 'class': 'btn ', 'title': _.title, 'style': utils.codiconCss(_.codicon), onclick: _.onClick })
    const btn_snap_left = button({ codicon: 'triangle-left', title: 'Snap leftwards', onClick: () => it.canvas.panelSnapTo(it.edge, º.DirLeft) })
    const btn_snap_right = button({ codicon: 'triangle-right', title: 'Snap rightwards', onClick: () => it.canvas.panelSnapTo(it.edge, º.DirRight) })
    const btn_snap_up = button({ codicon: 'triangle-up', title: 'Snap upwards', onClick: () => it.canvas.panelSnapTo(it.edge, º.DirUp) })
    const btn_snap_down = button({ codicon: 'triangle-down', title: 'Snap downwards', onClick: () => it.canvas.panelSnapTo(it.edge, º.DirDown) })
    const buttons = ((edge === º.DirPrev) || (edge === º.DirNext)) ? [btn_snap_left, btn_snap_right] : [btn_snap_up, btn_snap_down]
    const it: PanelEdgeBar = {
        canvas: pageCanvas,
        dom: dom,
        edge: edge,
        buttons: buttons,
        refresh(page: º.Page, panelIdx?: number) {
            it.page = page
            if ((it.selPanelIdx = panelIdx) === undefined) {
                it.dom.style.display = 'none'
                return
            }

            let x: number, y: number
            if (it.edge === º.DirLeft) {
            }

            it.dom.style.display = 'inline-block'
        },
    }
    van.add(it.dom, ...it.buttons)
    return it
}
