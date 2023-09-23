import van, { ChildDom } from '../vanjs/van-1.2.1.js'
import * as utils from '../utils.js'
import * as º from '../_º.js'
import * as ctl_pagecanvas from './pagecanvas.js'

const html = van.tags

export type Button = {
    codicon: string,
    title: string,
    onClick: (evt: Event) => void,
}

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
    const buttons: Button[] = []
    if ((edge === º.DirPrev) || (edge === º.DirNext))
        buttons.push({ codicon: 'triangle-left', title: 'Snap leftwards', onClick: () => { } }, { codicon: 'triangle-right', title: 'Snap rightwards', onClick: () => { } })
    else
        buttons.push({ codicon: 'triangle-up', title: 'Snap upwards', onClick: () => { } }, { codicon: 'triangle-down', title: 'Snap downwards', onClick: () => { } })
    const it: PanelEdgeBar = {
        canvas: pageCanvas,
        dom: dom,
        edge: edge,
        buttons: buttons.map(_ => html.button({ 'class': 'btn ', 'title': _.title, 'style': utils.codiconCss(_.codicon), onclick: _.onClick })),
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
