import van, { ChildDom } from '../vanjs/van-1.2.1.js'
import * as utils from '../utils.js'
import * as º from '../_º.js'

const html = van.tags

export type PanelWidget = {
    dom: HTMLElement,
    selPanelIdx?: number,
    refresh: (page: º.Page, panelIdx?: number) => void,
}

export function create(domId: string, onUserModifiedInWidget: (page: º.Page, pIdx?: number) => void, dbg: (...msg: any[]) => void): PanelWidget {
    const ˍ = {
        input_width: html.input({ 'type': 'number', 'min': 1, 'max': 100, 'step': '0.1' }),
        input_height: html.input({ 'type': 'number', 'min': 1, 'max': 100, 'step': '0.1' }),
        input_pos_x: html.input({ 'type': 'number', 'step': '0.1' }),
        input_pos_y: html.input({ 'type': 'number', 'step': '0.1' }),
    }
    const it: PanelWidget = {
        dom: html.div({ 'id': domId, 'class': 'page-editor-top-toolbar', 'style': 'display:none' },
            'X=',
            ˍ.input_pos_x,
            'cm — Y=',
            ˍ.input_pos_y,
            'cm — W=',
            ˍ.input_width,
            'cm — H=',
            ˍ.input_height,
        ),
        refresh: (page: º.Page, panelIdx?: number) => {
            if ((it.selPanelIdx = panelIdx) === undefined) {
                it.dom.style.display = 'none'
                return
            }
            const panel = page.panels[it.selPanelIdx]
            ˍ.input_width.value = (panel.w * 0.1).toFixed(1).padStart(4, '0')
            { ˍ.input_height.value = (panel.h * 0.1).toFixed(1).padStart(4, '0') }
            ˍ.input_pos_x.value = (panel.x * 0.1).toFixed(1).padStart(4, '0')
            ˍ.input_pos_y.value = (panel.y * 0.1).toFixed(1).padStart(4, '0')

            it.dom.style.display = 'block'
        },
    }
    return it
}
