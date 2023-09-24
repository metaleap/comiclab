import van, { ChildDom } from '../vanjs/van-1.2.1.js'
import * as utils from '../utils.js'
import * as º from '../_º.js'
import * as ctl_pagecanvas from './pagecanvas.js'

const html = van.tags

export type PanelToolbar = {
    canvas: ctl_pagecanvas.PageCanvas,
    dom: HTMLElement,
    page?: º.Page,
    selPanelIdx?: number,
    toggleDeletePrompt: (visible: boolean) => void,
    deletePanel: () => void,
    refresh: (page: º.Page, panelIdx?: number) => void,
    onUserModifiedSizeOrPosViaInputs: (evt: Event, page: º.Page) => any
}

export function create(domId: string, pageCanvas: ctl_pagecanvas.PageCanvas, onUserModified: (page: º.Page, pIdx?: number) => void, dbg: (...msg: any[]) => void): PanelToolbar {
    const ˍ = {
        label_panel_idx: html.b({}, 'Panel #? / ?'),
        input_width: html.input({ 'type': 'number', 'min': 1, 'max': 100, 'step': '0.1' }),
        input_height: html.input({ 'type': 'number', 'min': 1, 'max': 100, 'step': '0.1' }),
        input_pos_x: html.input({ 'type': 'number', 'step': '0.1' }),
        input_pos_y: html.input({ 'type': 'number', 'step': '0.1' }),
        input_round: html.input({ 'type': 'number', 'step': 0.01, min: 0, max: 1 }),
        label_delete_prompt: html.span({ 'style': 'display:none' }, 'Sure to ', html.a({ 'onclick': () => it.deletePanel() }, ' delete '), ' this panel?'),
        btn_move_first: html.button({ 'class': 'btn', 'title': `Send to back`, 'style': utils.codiconCss('fold-down'), 'data-movehow': º.DirStart, 'disabled': true, }),
        btn_move_last: html.button({ 'class': 'btn', 'title': `Bring to front`, 'style': utils.codiconCss('fold-up'), 'data-movehow': º.DirEnd, 'disabled': true, }),
        btn_move_next: html.button({ 'class': 'btn', 'title': `Bring forward`, 'style': utils.codiconCss('chevron-up'), 'data-movehow': º.DirNext, 'disabled': true, }),
        btn_move_prev: html.button({ 'class': 'btn', 'title': `Send backward`, 'style': utils.codiconCss('chevron-down'), 'data-movehow': º.DirPrev, 'disabled': true, }),
    }
    const it: PanelToolbar = {
        canvas: pageCanvas,
        dom: html.div({ 'id': domId, 'class': 'page-editor-top-toolbar', 'style': 'display:none' },
            html.div({ 'class': 'page-editor-top-toolbar-block page-editor-top-toolbar-block-right' },
                html.button({ 'class': 'btn', 'title': `Delete panel`, 'style': utils.codiconCss('trash'), 'onclick': () => it.toggleDeletePrompt(true) }),
                ˍ.label_delete_prompt,
            ),
            html.div({ 'class': 'page-editor-top-toolbar-block' },
                ˍ.label_panel_idx,
                ' — X,Y=', ˍ.input_pos_x, ',', ˍ.input_pos_y, ' — W,H=', ˍ.input_width, ',', ˍ.input_height, ' — roundness=', ˍ.input_round,
            ),
            html.div({ 'class': 'page-editor-top-toolbar-block' },
                ˍ.btn_move_last, ˍ.btn_move_next, ˍ.btn_move_prev, ˍ.btn_move_first,
            ),
        ),
        deletePanel: () => {
            it.page!.panels = it.page!.panels.filter((_: º.Panel, idx: number) => (idx !== it.selPanelIdx))
            it.refresh(it.page!)
            onUserModified(it.page!)
        },
        toggleDeletePrompt(visible: boolean) {
            ˍ.label_delete_prompt.style.display = visible ? 'inline-block' : 'none'
        },
        onUserModifiedSizeOrPosViaInputs(evt: Event, page: º.Page) {
            it.toggleDeletePrompt(false)
            if (it.selPanelIdx !== undefined) { // accounts for the move-to-front/send-to-back/etc `page.panels` array reorderings
                const panel = page.panels[it.selPanelIdx]
                panel.w = parseInt((parseFloat(ˍ.input_width.value) * 10).toFixed(0))
                panel.h = parseInt((parseFloat(ˍ.input_height.value) * 10).toFixed(0))
                panel.x = parseInt((parseFloat(ˍ.input_pos_x.value) * 10).toFixed(0))
                panel.y = parseInt((parseFloat(ˍ.input_pos_y.value) * 10).toFixed(0))
                panel.round = parseFloat(ˍ.input_round.value)
            }
            onUserModified(page, it.selPanelIdx)
        },
        refresh(page: º.Page, panelIdx?: number) {
            it.toggleDeletePrompt(false)
            it.page = page
            if ((it.selPanelIdx = panelIdx) === undefined) {
                it.dom.style.display = 'none'
                return
            }
            const panel = page.panels[it.selPanelIdx]
            {
                ˍ.label_panel_idx.textContent = `(Panel #${1 + it.selPanelIdx} / ${page.panels.length})`
                ˍ.input_round.value = panel.round.toFixed(2)
            }
            for (const inputs of [{ 'x': ˍ.input_pos_x, 'y': ˍ.input_pos_y, 'w': ˍ.input_width, 'h': ˍ.input_height } as { [_: string]: HTMLInputElement }])
                for (const prop_name in inputs) {
                    const input = inputs[prop_name] as HTMLInputElement
                    input.value = (panel[prop_name as 'x' | 'y' | 'w' | 'h'] * 0.1).toFixed(1).padStart(4, '0')
                    input.onchange = (evt) =>
                        it.onUserModifiedSizeOrPosViaInputs(evt, page)
                }
            for (const btn of [ˍ.btn_move_first, ˍ.btn_move_last, ˍ.btn_move_next, ˍ.btn_move_prev]) {
                const dir: º.Direction = parseInt(btn.getAttribute('data-movehow') ?? '')
                btn.disabled = !it.canvas.panelReorder(dir, true)
                btn.onclick = (evt) =>
                    it.canvas.panelReorder(dir)
            }

            it.dom.style.display = 'block'
        },
    }
    return it
}
