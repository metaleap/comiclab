import van from './vanjs/van-1.2.1.debug.js'
import * as utils from './utils.js'
import * as º from './_º.js'
import * as ctl_pagecanvas from './pagecanvas.js'

const html = van.tags

export type ShapeToolbar = {
    canvas: ctl_pagecanvas.PageCanvas,
    dom: HTMLElement,
    curPage: () => º.Page
    toggleDeletePrompt: (visible: boolean) => void,
    deleteShape: () => void,
    refresh: () => void,
    onUserModifiedSizeOrPosViaInputs: () => any
}

export function create(domId: string, pageCanvas: ctl_pagecanvas.PageCanvas, curPage: () => º.Page, onUserModified: (_: boolean) => void): ShapeToolbar {
    const ˍ = {
        label_shape_idx: html.b({}, 'Shape #? / ?'),
        input_width: html.input({ 'type': 'number', 'min': 1, 'max': 100, 'step': '0.1', 'onchange': () => it.onUserModifiedSizeOrPosViaInputs() }),
        input_height: html.input({ 'type': 'number', 'min': 1, 'max': 100, 'step': '0.1', 'onchange': () => it.onUserModifiedSizeOrPosViaInputs() }),
        input_pos_x: html.input({ 'type': 'number', 'step': '0.1', 'onchange': () => it.onUserModifiedSizeOrPosViaInputs() }),
        input_pos_y: html.input({ 'type': 'number', 'step': '0.1', 'onchange': () => it.onUserModifiedSizeOrPosViaInputs() }),
        input_tail_x: html.input({ 'type': 'number', 'step': '0.1', 'onchange': () => it.onUserModifiedSizeOrPosViaInputs() }),
        input_tail_y: html.input({ 'type': 'number', 'step': '0.1', 'onchange': () => it.onUserModifiedSizeOrPosViaInputs() }),
        label_delete_prompt: html.span({ 'style': 'display:none' }, 'Sure to ', html.a({ 'onclick': () => it.deleteShape() }, ' delete '), ' this shape?'),
        btn_move_first: html.button({ 'class': 'btn', 'title': `Send to back`, 'style': utils.codiconCss('fold-down'), 'data-movehow': º.DirStart, 'disabled': true, }),
        btn_move_last: html.button({ 'class': 'btn', 'title': `Bring to front`, 'style': utils.codiconCss('fold-up'), 'data-movehow': º.DirEnd, 'disabled': true, }),
        btn_move_next: html.button({ 'class': 'btn', 'title': `Bring forward`, 'style': utils.codiconCss('chevron-up'), 'data-movehow': º.DirNext, 'disabled': true, }),
        btn_move_prev: html.button({ 'class': 'btn', 'title': `Send backward`, 'style': utils.codiconCss('chevron-down'), 'data-movehow': º.DirPrev, 'disabled': true, }),
    }
    let label_inputs_tail: HTMLElement
    const it: ShapeToolbar = {
        curPage: curPage,
        canvas: pageCanvas,
        dom: html.div({ 'id': domId, 'class': 'page-editor-top-toolbar', 'style': 'display:none' },
            html.div({ 'class': 'page-editor-top-toolbar-block page-editor-top-toolbar-block-right' },
                html.button({ 'class': 'btn', 'title': `Delete selected shape`, 'style': utils.codiconCss('trash'), 'onclick': () => it.toggleDeletePrompt(true) }),
                ˍ.label_delete_prompt,
            ),
            html.div({ 'class': 'page-editor-top-toolbar-block' },
                ˍ.label_shape_idx,
                ' ', html.span(' — X,Y='), ˍ.input_pos_x, html.span(','), ˍ.input_pos_y, html.span('cm — W,H='), ˍ.input_width, html.span(','), ˍ.input_height, html.span('cm'),
                label_inputs_tail = html.span({ 'style': 'display:none' }, ' ', html.span(' — tail X,Y='), ˍ.input_tail_x, html.span(','), ˍ.input_tail_y, html.span('cm')),
            ),
            html.div({ 'class': 'page-editor-top-toolbar-block page-editor-top-toolbar-block-right' },
                ˍ.btn_move_last, ˍ.btn_move_next, ˍ.btn_move_prev, ˍ.btn_move_first,
            ),
        ),
        deleteShape: () => {
            const page = curPage()
            if (it.canvas.sel!.isBalloon)
                page!.balloons = page!.balloons.filter((_: º.Balloon, idx: number) => (idx !== it.canvas.sel!.idx))
            else
                page!.panels = page!.panels.filter((_: º.Panel, idx: number) => (idx !== it.canvas.sel!.idx))
            it.canvas.select(undefined, true)
            it.refresh()
            onUserModified(false)
        },
        toggleDeletePrompt: (visible: boolean) => {
            ˍ.label_delete_prompt.style.display = visible ? 'inline-block' : 'none'
        },
        onUserModifiedSizeOrPosViaInputs: () => {
            it.toggleDeletePrompt(false)
            const page = curPage()
            if (it.canvas.sel) { // not so right after move-to-front/send-to-back/etc actions
                const shape: º.Shape = (it.canvas.sel.isBalloon ? page.balloons : page.panels)[it.canvas.sel.idx]
                shape.w = ~~((parseFloat(ˍ.input_width.value) * 10))
                shape.h = ~~((parseFloat(ˍ.input_height.value) * 10))
                shape.x = ~~((parseFloat(ˍ.input_pos_x.value) * 10))
                shape.y = ~~((parseFloat(ˍ.input_pos_y.value) * 10))
                if (it.canvas.sel.isBalloon) {
                    (shape as º.Balloon).tailPoint = ((ˍ.input_tail_x.value === '') && (ˍ.input_tail_y.value === '')) ? undefined
                        : { x: ~~((parseFloat(ˍ.input_tail_x.value) * 10)), y: ~~((parseFloat(ˍ.input_tail_y.value) * 10)) }
                }
            }
            onUserModified(true)
        },
        refresh: () => {
            it.toggleDeletePrompt(false)
            if (!it.canvas.sel) {
                it.dom.style.display = 'none'
                return
            }
            const page = curPage()
            const shapes: º.Shape[] = it.canvas.sel.isBalloon ? page.balloons : page.panels
            const shape: º.Shape = shapes[it.canvas.sel.idx]

            ˍ.label_shape_idx.textContent = `${it.canvas.sel.isBalloon ? 'Balloon' : 'Panel'} #${1 + it.canvas.sel.idx} / ${shapes.length} `
            for (const inputs of [{ 'x': ˍ.input_pos_x, 'y': ˍ.input_pos_y, 'w': ˍ.input_width, 'h': ˍ.input_height } as { [_: string]: HTMLInputElement }])
                for (const prop_name in inputs)
                    (inputs[prop_name] as HTMLInputElement).value = (shape[prop_name as 'x' | 'y' | 'w' | 'h'] * 0.1).toFixed(1).padStart(4, '0')
            label_inputs_tail.style.display = it.canvas.sel.isBalloon ? 'inline' : 'none'
            if (it.canvas.sel.isBalloon) {
                ˍ.input_tail_x.value = ((((shape as º.Balloon).tailPoint?.x ?? 0) * 0.1).toFixed(1).padStart(4, '0') ?? '')
                ˍ.input_tail_y.value = ((((shape as º.Balloon).tailPoint?.y ?? 0) * 0.1).toFixed(1).padStart(4, '0') ?? '')
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
