import van, { ChildDom } from '../vanjs/van-1.2.1.js'
import * as utils from '../utils.js'
import * as º from '../_º.js'

const html = van.tags

export type PanelWidget = {
    dom: HTMLElement,
    onPanelSelected: (page: º.Page, idx?: number) => void,
}

export function create(domId: string, onUserModified: (_: º.Page) => void, dbg: (...msg: any[]) => void): PanelWidget {
    const dummy = html.span("(Panel Widget)")
    const dom = html.div({ 'id': domId, 'class': 'page-editor-panel-widget', 'style': 'display:none' },
        dummy)
    return {
        dom: dom,
        onPanelSelected(page: º.Page, panelIdx?: number) {
            if (panelIdx === undefined) {
                dom.style.display = 'none'
                return
            }

            dom.style.display = 'inline-block'
            dummy.innerText = `'${page.name}' panel #${panelIdx + 1}`
        }
    }
}
