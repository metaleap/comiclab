import van from './vanjs/van-1.2.1.debug.js'
import * as º from './_º.js'
import * as ctl_propsform from './propsform.js'

const html = van.tags


export type PropsDialog = {
    dom: HTMLDialogElement
    refresh: () => void
}

export function show(domId: string, page: º.Page, targetDom: HTMLElement, onRemovingFromDom: () => void, onUserModified: (pg?: º.PageProps, pnl?: º.PanelProps) => void): PropsDialog {
    if (!(targetDom && targetDom.tagName && targetDom.id && targetDom.classList))
        throw targetDom
    const panel_idx = parseInt(targetDom.getAttribute('data-panelIdx') ?? '')

    const props_form = ctl_propsform.create(domId, '', º.pageToPath(page), panel_idx,
        (userModifiedCollProps?: º.CollProps, userModifiedPageProps?: º.PageProps, userModifiedPanelProps?: º.PanelProps) => {
            console.log("umpgp", userModifiedPageProps, "umpnp", userModifiedPanelProps)
            onUserModified(userModifiedPageProps, userModifiedPanelProps)
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
