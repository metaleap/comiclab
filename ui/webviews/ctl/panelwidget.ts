import van, { ChildDom } from '../vanjs/van-1.2.1.js'
import * as utils from '../utils.js'
import * as º from '../_º.js'

const html = van.tags

export type PanelWidget = {
    dom: HTMLElement,
    page?: º.Page,
    selPanelIdx?: number,
    refresh: (page: º.Page, panelIdx?: number) => void,
    onUserModifiedInsideWidget: (evt: Event, page: º.Page) => any
}

export function create(domId: string, onUserModified: (page: º.Page, pIdx: number) => void, dbg: (...msg: any[]) => void): PanelWidget {
    const ˍ = {
        input_width: html.input({ 'type': 'number', 'min': 1, 'max': 100, 'step': '0.1' }),
        input_height: html.input({ 'type': 'number', 'min': 1, 'max': 100, 'step': '0.1' }),
        input_pos_x: html.input({ 'type': 'number', 'step': '0.1' }),
        input_pos_y: html.input({ 'type': 'number', 'step': '0.1' }),
    }
    const it: PanelWidget = {
        dom: html.div({ 'id': domId, 'class': 'page-editor-top-toolbar', 'style': 'display:none' },
            'X=', ˍ.input_pos_x, 'cm — Y=', ˍ.input_pos_y, 'cm — W=', ˍ.input_width, 'cm — H=', ˍ.input_height, 'cm',
        ),
        onUserModifiedInsideWidget(evt: Event, page: º.Page) {
            const panel = page.panels[it.selPanelIdx!]
            panel.w = parseInt((parseFloat(ˍ.input_width.value) * 10).toFixed(0))
            panel.h = parseInt((parseFloat(ˍ.input_height.value) * 10).toFixed(0))
            panel.x = parseInt((parseFloat(ˍ.input_pos_x.value) * 10).toFixed(0))
            panel.y = parseInt((parseFloat(ˍ.input_pos_y.value) * 10).toFixed(0))
            onUserModified(page, it.selPanelIdx!)
        },
        refresh(page: º.Page, panelIdx?: number) {
            it.page = page
            if ((it.selPanelIdx = panelIdx) === undefined) {
                it.dom.style.display = 'none'
                return
            }
            const panel = page.panels[it.selPanelIdx]
            ˍ.input_width.value = (panel.w * 0.1).toFixed(1).padStart(4, '0')
            { ˍ.input_height.value = (panel.h * 0.1).toFixed(1).padStart(4, '0') }
            ˍ.input_pos_x.value = (panel.x * 0.1).toFixed(1).padStart(4, '0')
            ˍ.input_pos_y.value = (panel.y * 0.1).toFixed(1).padStart(4, '0')
            for (const input of [ˍ.input_height, ˍ.input_pos_x, ˍ.input_pos_y, ˍ.input_width])
                input.onchange = (evt) => it.onUserModifiedInsideWidget(evt, page)

            it.dom.style.display = 'block'
        },
    }
    return it
}
