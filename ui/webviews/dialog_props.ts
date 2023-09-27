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
    let panel_idx: number | undefined = undefined, balloon_idx: number | undefined = undefined
    const props_form = ctl_propsform.create(domId, '', º.pageToPath(page), panel_idx, balloon_idx,
        (_?: º.CollProps, userModifiedPageProps?: º.PageProps, userModifiedPanelProps?: º.PanelProps, userModifiedBalloonProps?: º.BalloonProps) => {
            onUserModified(userModifiedPageProps, userModifiedPanelProps, userModifiedBalloonProps, panel_idx, balloon_idx)
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
