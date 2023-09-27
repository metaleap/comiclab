import van from './vanjs/van-1.2.1.debug.js'
import * as º from './_º.js'
import * as ctl_propsform from './propsform.js'
import * as ctl_pagecanvas from './pagecanvas.js'

const html = van.tags


export type PropsDialog = {
    dom: HTMLDialogElement
    refresh: () => void
}

export function show(domId: string, page: º.Page, canvas: ctl_pagecanvas.PageCanvas, onRemovingFromDom: () => void, onUserModified: (pg?: º.PageProps, pnl?: º.PanelProps, bln?: º.BalloonProps, pidx?: number, bidx?: number) => void): PropsDialog {
    const at_mouse_pos = canvas.whatsAt()
    if ((at_mouse_pos.panelIdx !== undefined) || (at_mouse_pos.balloonIdx !== undefined))
        canvas.select((at_mouse_pos.balloonIdx === undefined) ? at_mouse_pos.panelIdx : undefined, at_mouse_pos.balloonIdx)
    const props_form = ctl_propsform.create(domId, '', º.pageToPath(page), at_mouse_pos.panelIdx, at_mouse_pos.balloonIdx,
        (_?: º.CollProps, userModifiedPageProps?: º.PageProps, userModifiedPanelProps?: º.PanelProps, userModifiedBalloonProps?: º.BalloonProps) => {
            onUserModified(userModifiedPageProps, userModifiedPanelProps, userModifiedBalloonProps, at_mouse_pos.panelIdx, at_mouse_pos.balloonIdx)
        })
    const dialog = html.dialog({ 'class': 'page-editor-props-dialog' }, props_form.dom)
    dialog.onclose = () => {
        onRemovingFromDom()
        dialog.remove()
    }
    van.add(document.body, dialog)
    dialog.showModal()
    props_form.refresh()
    return {
        dom: dialog,
        refresh: () => props_form.refresh()
    }
}
