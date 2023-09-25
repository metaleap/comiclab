import van, { ChildDom } from '../vanjs/van-1.2.1.js'
import * as utils from '../utils.js'
import * as º from '../_º.js'
import * as ctl_inputform from './inputform.js'
import * as coll_editor from '../coll_editor.js'

const html = van.tags

export type PropsDesc = ctl_inputform.Field[]

export function create(domId: string, page: º.Page, panelIdx?: number): HTMLDialogElement {
    return html.dialog({ 'class': 'page-editor-props-dialog' },
        coll_editor.createForPageOrPanel(domId, page, panelIdx))
}
