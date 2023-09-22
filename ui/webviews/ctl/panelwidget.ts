import van, { ChildDom } from '../vanjs/van-1.2.1.js'
import * as utils from '../utils.js'
import * as º from '../_º.js'

const html = van.tags

export type PanelWidget = {
    dom: HTMLElement,
    selPanelIdx?: number,
    onUserModifiedOutsideWidget: (page: º.Page, pIdx?: number) => void,
    onPanelSelected: (page: º.Page, pIdx?: number) => void,
}

export function create(domId: string, onUserModifiedInWidget: (page: º.Page, pIdx?: number) => void, dbg: (...msg: any[]) => void): PanelWidget {
    const dummy = html.span("(Panel Widget)")
    const it: PanelWidget = {
        dom: html.div({ 'id': domId, 'class': 'page-editor-top-toolbar', 'style': 'display:none' },
            dummy),
        onPanelSelected(page: º.Page, panelIdx?: number) {
            if ((it.selPanelIdx = panelIdx) === undefined) {
                it.dom.style.display = 'none'
                return
            }
            const panel = page.panels[it.selPanelIdx]
            dummy.innerText = `'SEL: ${page.name}' panel #${it.selPanelIdx + 1} @ ${JSON.stringify(panel)}`
            it.dom.style.display = 'block'
        },
        onUserModifiedOutsideWidget: (page: º.Page, pIdx?: number) => {
            if (it.selPanelIdx === undefined || it.selPanelIdx !== pIdx)
                return
            const panel = page.panels[it.selPanelIdx]
            dummy.innerText = `'MOD: ${page.name}' panel #${(it.selPanelIdx) + 1} @ ${JSON.stringify(panel)}`
        }
    }
    return it
}
