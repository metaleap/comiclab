import van, { ChildDom } from '../vanjs/van-1.2.1.js'
import * as utils from '../utils.js'
import * as º from '../_º.js'
import * as ctl_inputform from './inputform.js'
import * as coll_editor from '../coll_editor.js'

const html = van.tags

export type PropsDesc = ctl_inputform.Field[]

export function show(domId: string, page: º.Page, targetDom: HTMLElement) {
    if (!(targetDom && targetDom.tagName && targetDom.id && targetDom.classList))
        return
    const panel_idx = parseInt(targetDom.getAttribute('data-panelIdx') ?? '')
    const dialog = html.dialog({ 'class': 'page-editor-props-dialog' },
        coll_editor.initAndCreateForPageOrPanel(domId, page, isNaN(panel_idx) ? undefined : panel_idx))
    dialog.onclose = (evt) => dialog.remove()
    van.add(document.body, dialog)
    dialog.showModal()
}
