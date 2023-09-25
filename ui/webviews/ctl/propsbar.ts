import van, { ChildDom } from '../vanjs/van-1.2.1.js'
import * as utils from '../utils.js'
import * as º from '../_º.js'
import * as ctl_inputform from './inputform.js'

const html = van.tags

export type PropsDesc = ctl_inputform.Field[]

export function create(domId: string, evt: MouseEvent, propsDesc: PropsDesc, props: (_?: any) => any): HTMLDialogElement {
    const form = ctl_inputform.create(domId, propsDesc, undefined,
        (userModifiedRec) => {
            const new_props: any = {}
            for (const field of propsDesc)
                new_props[field.id] = userModifiedRec[field.id]
            props(new_props)
        })
    const cur_props = props()
    const rec = {} as ctl_inputform.Rec
    for (const field of propsDesc)
        rec[field.id] = cur_props[field.id]
    form.onDataChangedAtSource(rec)
    return html.dialog({ 'class': 'page-editor-props-bar', 'style': `left: ${evt.clientX}px; top: ${evt.clientY}px;` },
        form.dom)
}
