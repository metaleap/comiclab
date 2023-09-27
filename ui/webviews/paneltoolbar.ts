import van from './vanjs/van-1.2.1.debug.js'
import * as utils from './utils.js'
import * as º from './_º.js'
import * as ctl_pagecanvas from './pagecanvas.js'

const html = van.tags

export type PanelToolbar = {
    canvas: ctl_pagecanvas.PageCanvas,
    dom: HTMLElement,
    curPage: () => º.Page
    toggleDeletePrompt: (visible: boolean) => void,
    deletePanel: () => void,
    refresh: () => void,
    onUserModifiedSizeOrPosViaInputs: () => any
}

export function create(domId: string, pageCanvas: ctl_pagecanvas.PageCanvas, curPage: () => º.Page, onUserModified: () => void): PanelToolbar {
    const ˍ = {
        label_panel_idx: html.b({}, 'Panel #? / ?'),
        input_width: html.input({ 'type': 'number', 'min': 1, 'max': 100, 'step': '0.1', 'onchange': () => it.onUserModifiedSizeOrPosViaInputs() }),
        input_height: html.input({ 'type': 'number', 'min': 1, 'max': 100, 'step': '0.1', 'onchange': () => it.onUserModifiedSizeOrPosViaInputs() }),
        input_pos_x: html.input({ 'type': 'number', 'step': '0.1', 'onchange': () => it.onUserModifiedSizeOrPosViaInputs() }),
        input_pos_y: html.input({ 'type': 'number', 'step': '0.1', 'onchange': () => it.onUserModifiedSizeOrPosViaInputs() }),
        input_round: html.input({ 'type': 'number', 'step': 0.01, 'min': 0, 'max': 1, 'onchange': () => it.onUserModifiedSizeOrPosViaInputs() }),
        label_delete_prompt: html.span({ 'style': 'display:none' }, 'Sure to ', html.a({ 'onclick': () => it.deletePanel() }, ' delete '), ' this panel?'),
        btn_move_first: html.button({ 'class': 'btn', 'title': `Send to back`, 'style': utils.codiconCss('fold-down'), 'data-movehow': º.DirStart, 'disabled': true, }),
        btn_move_last: html.button({ 'class': 'btn', 'title': `Bring to front`, 'style': utils.codiconCss('fold-up'), 'data-movehow': º.DirEnd, 'disabled': true, }),
        btn_move_next: html.button({ 'class': 'btn', 'title': `Bring forward`, 'style': utils.codiconCss('chevron-up'), 'data-movehow': º.DirNext, 'disabled': true, }),
        btn_move_prev: html.button({ 'class': 'btn', 'title': `Send backward`, 'style': utils.codiconCss('chevron-down'), 'data-movehow': º.DirPrev, 'disabled': true, }),
    }
    const it: PanelToolbar = {
        curPage: curPage,
        canvas: pageCanvas,
        dom: html.div({ 'id': domId, 'class': 'page-editor-top-toolbar', 'style': 'display:none' },
            html.div({ 'class': 'page-editor-top-toolbar-block page-editor-top-toolbar-block-right' },
                html.button({ 'class': 'btn', 'title': `Delete panel`, 'style': utils.codiconCss('trash'), 'onclick': () => it.toggleDeletePrompt(true) }),
                ˍ.label_delete_prompt,
            ),
            html.div({ 'class': 'page-editor-top-toolbar-block' },
                ˍ.label_panel_idx,
                ' — X,Y=', ˍ.input_pos_x, ',', ˍ.input_pos_y, 'cm — W,H=', ˍ.input_width, ',', ˍ.input_height, 'cm'
            ),
            html.div({ 'class': 'page-editor-top-toolbar-block' },
                ˍ.input_round,),
            html.div({ 'class': 'page-editor-top-toolbar-block page-editor-top-toolbar-block-right' },
                ˍ.btn_move_last, ˍ.btn_move_next, ˍ.btn_move_prev, ˍ.btn_move_first,
            ),
        ),
        deletePanel: () => {
            const page = curPage()
            page!.panels = page!.panels.filter((_: º.Panel, idx: number) => (idx !== it.canvas.selPanelIdx))
            it.canvas.select(undefined, undefined, true)
            it.refresh()
            onUserModified()
        },
        toggleDeletePrompt: (visible: boolean) => {
            ˍ.label_delete_prompt.style.display = visible ? 'inline-block' : 'none'
        },
        onUserModifiedSizeOrPosViaInputs: () => {
            it.toggleDeletePrompt(false)
            const page = curPage()
            if (it.canvas.selPanelIdx !== undefined) { // accounts for the move-to-front/send-to-back/etc `page.panels` array reorderings
                const panel = page.panels[it.canvas.selPanelIdx]
                panel.w = ~~((parseFloat(ˍ.input_width.value) * 10))
                panel.h = ~~((parseFloat(ˍ.input_height.value) * 10))
                panel.x = ~~((parseFloat(ˍ.input_pos_x.value) * 10))
                panel.y = ~~((parseFloat(ˍ.input_pos_y.value) * 10))
                if (isNaN(panel.panelProps.roundness = parseFloat(ˍ.input_round.value)))
                    panel.panelProps.roundness = undefined
            }
            onUserModified()
        },
        refresh: () => {
            it.toggleDeletePrompt(false)
            if (it.canvas.selPanelIdx === undefined) {
                it.dom.style.display = 'none'
                return
            }
            const page = curPage()
            const panel = page.panels[it.canvas.selPanelIdx]

            ˍ.label_panel_idx.textContent = `(Panel #${1 + it.canvas.selPanelIdx} / ${page.panels.length})`
            ˍ.input_round.value = (panel.panelProps.roundness ?? 0).toFixed(2)
            for (const inputs of [{ 'x': ˍ.input_pos_x, 'y': ˍ.input_pos_y, 'w': ˍ.input_width, 'h': ˍ.input_height } as { [_: string]: HTMLInputElement }])
                for (const prop_name in inputs) {
                    const input = inputs[prop_name] as HTMLInputElement
                    input.value = (panel[prop_name as 'x' | 'y' | 'w' | 'h'] * 0.1).toFixed(1).padStart(4, '0')
                }
            for (const btn of [ˍ.btn_move_first, ˍ.btn_move_last, ˍ.btn_move_next, ˍ.btn_move_prev]) {
                const dir: º.Direction = parseInt(btn.getAttribute('data-movehow') ?? '')
                btn.disabled = !it.canvas.shapeRestack(dir, true)
                btn.onclick = () =>
                    it.canvas.shapeRestack(dir)
            }

            it.dom.style.display = 'block'
        },
    }
    return it
}
