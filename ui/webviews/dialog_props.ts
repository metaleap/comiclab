import van from './vanjs/van-1.2.1.debug.js'
import * as º from './_º.js'
import * as utils from './utils.js'
import * as ctl_propsform from './propsform.js'
import * as ctl_pagecanvas from './pagecanvas.js'

const html = van.tags


export type PropsDialog = {
    dom: HTMLDialogElement
    refresh: () => void
}

export function show(domId: string, page: º.Page, canvas: ctl_pagecanvas.PageCanvas, onRemovingFromDom: () => void, onUserModified: (pg?: º.PageProps, pnl?: º.PanelProps, bln?: º.BalloonProps, sel?: º.ShapeRef) => void): PropsDialog {
    const at_mouse_pos = canvas.whatsAt()
    canvas.select(at_mouse_pos)
    const props_form = ctl_propsform.create(domId, '', º.pageToPath(page), at_mouse_pos,
        (_?: º.CollProps, userModifiedPageProps?: º.PageProps, userModifiedPanelProps?: º.PanelProps, userModifiedBalloonProps?: º.BalloonProps) => {
            onUserModified(userModifiedPageProps, userModifiedPanelProps, userModifiedBalloonProps, at_mouse_pos)
        })
    const dialog = html.dialog({ 'class': 'page-editor-props-dialog' },
        props_form.dom,
        html.div({ 'class': 'page-editor-props-dialog-buttons' },
            html.button({ 'class': 'btn', 'style': utils.codiconCss('triangle-left'), 'onclick': () => { dialog.style.left = '-50%' } }),
            html.button({ 'class': 'btn', 'style': utils.codiconCss('circle-filled'), 'onclick': () => { dialog.style.left = '0' } }),
            html.button({ 'class': 'btn', 'style': utils.codiconCss('triangle-right'), 'onclick': () => { dialog.style.left = '50%' } }),
        ))
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
