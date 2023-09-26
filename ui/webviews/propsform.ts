import van, { ChildDom, State } from './vanjs/van-1.2.1.debug.js'
import * as utils from './utils.js'
import * as º from './_º.js'
import * as ctl_inputform from './ctl/inputform.js'
import * as ctl_multipanel from './ctl/multipanel.js'

const html = van.tags

export type PropsForm = {
    dom: ChildDom
    panelIdx?: number
}

export function create(domId: string, collPath: string, pagePath: string, panelIdx: number | undefined, onUserModified: (c?: º.CollProps, pg?: º.PageProps, pnl?: º.PanelProps) => void) {
    const for_proj = (collPath === '') && (pagePath === ''), for_coll = (collPath !== ''), for_page = (pagePath !== '') && (panelIdx === undefined), for_panel = (pagePath !== '') && (panelIdx !== undefined)
    const it = {
        panelIdx: panelIdx,
    } as PropsForm

    let collPropsForm: ctl_inputform.InputForm = undefined as any
    let pagePropsForm: ctl_inputform.InputForm = undefined as any
    let panelPropsForm: ctl_inputform.InputForm = undefined as any

    if (for_proj || for_coll) { // then create collPropsForm
        const authorFieldPlaceholder = van.state('')
        const authorFieldLookup = van.state({} as ctl_inputform.FieldLookup)
        const contentDynFields = van.state([] as ctl_inputform.Field[])
        const contentDynFieldsLangSep = ':'
        const authorField: ctl_inputform.Field = { id: 'authorId', title: "Author", validators: [ctl_inputform.validatorLookup], lookUp: authorFieldLookup, placeholder: authorFieldPlaceholder }
        collPropsForm = ctl_inputform.create('collprops_form', [authorField], contentDynFields,
            (userModifiedRec: ctl_inputform.Rec) => {
                const collProps: º.CollProps = { authorId: userModifiedRec['authorId'] }
                if (collProps.authorId === '')
                    delete collProps.authorId
                collProps.customFields = {}
                if (º.appState.config.contentAuthoring.customFields)
                    for (const dyn_field_id in º.appState.config.contentAuthoring.customFields) {
                        collProps.customFields[dyn_field_id] = {}
                        collProps.customFields[dyn_field_id][''] = userModifiedRec[dyn_field_id + contentDynFieldsLangSep]
                        if (º.appState.config.contentAuthoring.customFields[dyn_field_id]) // if custom field localizable
                            for (const lang_id in º.appState.config.contentAuthoring.languages) {
                                const loc_val = userModifiedRec[dyn_field_id + contentDynFieldsLangSep + lang_id]
                                if (loc_val && loc_val.length > 0)
                                    collProps.customFields[dyn_field_id][lang_id] = loc_val
                            }
                    }
                onUserModified(collProps)
            })
    }
    if (!for_panel) { // then create pagePropsForm
        const paperFormatFieldPlaceholder = van.state('')
        const paperFormatFieldLookup = van.state({} as ctl_inputform.FieldLookup)
        const paperFormatField: ctl_inputform.Field = { id: 'paperFormatId', title: "Page Format", validators: [ctl_inputform.validatorLookup], lookUp: paperFormatFieldLookup, placeholder: paperFormatFieldPlaceholder }
        pagePropsForm = ctl_inputform.create('pageprops_form', [paperFormatField], undefined,
            (userModifiedRec: ctl_inputform.Rec) => {
                const coll = º.collFromPath(collPath) as º.Collection
                coll.pageProps.paperFormatId = userModifiedRec['paperFormatId']
                utils.vs.postMessage({ ident: 'onCollModified', payload: coll })
            })
    }
    { // always create panelPropsForm
        const panelBorderWidthPlaceholder = van.state('')
        const panelRoundnessPlaceholder = van.state('')
        const panelBorderWidthField: ctl_inputform.Field = { id: 'panelBorderWidth', title: "Panel Border Width (mm)", validators: [], num: { int: false, min: 0, max: 10, step: 0.1 }, placeholder: panelBorderWidthPlaceholder }
        const panelRoundnessField: ctl_inputform.Field = { id: 'roundness', title: "Roundness", validators: [], num: { int: false, min: 0, max: 1, step: 0.01 }, placeholder: panelRoundnessPlaceholder }
        panelPropsForm = ctl_inputform.create(domId + '_panelprops_form', [panelBorderWidthField, panelRoundnessField], undefined,
            (userModifiedRec: ctl_inputform.Rec) => {
                const coll = º.collFromPath(collPath) as º.Collection
                if (isNaN(coll.panelProps.borderWidthMm = parseFloat(userModifiedRec['panelBorderWidth'])))
                    delete coll.panelProps.borderWidthMm
                if (isNaN(coll.panelProps.roundness = parseFloat(userModifiedRec['roundness'])))
                    delete coll.panelProps.roundness
                utils.vs.postMessage({ ident: 'onCollModified', payload: coll })
            })
    }

    const sections: Record<string, ChildDom> = {}
    if (collPropsForm)
        sections["Collection " + (for_coll ? "Properties" : "Defaults")] = collPropsForm.dom
    if (pagePropsForm)
        sections["Page " + (for_page ? "Properties" : "Defaults")] = pagePropsForm.dom
    if (panelPropsForm)
        sections["Panel " + (for_panel ? "Properties" : "Defaults")] = panelPropsForm.dom
    it.dom = ctl_multipanel.create(domId, sections)
    return it
}
