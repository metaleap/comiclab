import van, { ChildDom } from '../vanjs/van-1.2.1.debug.js'
import * as º from '../_º.js'
import * as coll_editor from '../coll_editor.js'

const html = van.tags

export function show(domId: string, page: º.Page, targetDom: HTMLElement) {
    if (!(targetDom && targetDom.tagName && targetDom.id && targetDom.classList))
        return
    const panel_idx = parseInt(targetDom.getAttribute('data-panelIdx') ?? '')
    const forms = coll_editor.initAndCreateForPageOrPanel(domId, page, isNaN(panel_idx) ? undefined : panel_idx)
    const dialog = html.dialog({ 'class': 'page-editor-props-dialog' }, forms.dom)
    dialog.onclose = (evt) => {
        dialog.remove()
        forms.onRemovedFromPage()
    }
    van.add(document.body, dialog)
    dialog.showModal()
    forms.onAddedToPage()
}
