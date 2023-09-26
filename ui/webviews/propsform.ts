import van, { ChildDom, State } from './vanjs/van-1.2.1.debug.js'
import * as utils from './utils.js'
import * as º from './_º.js'
import * as ctl_inputform from './ctl/inputform.js'
import * as ctl_multipanel from './ctl/multipanel.js'

const html = van.tags


const collDynFieldsLangSep = ':'

export type PropsForm = {
    dom: ChildDom,
    refresh: () => void,
}

export function create(domId: string, collPath: string, pagePath: string, panelIdx: number | undefined, onUserModified: (c?: º.CollProps, pg?: º.PageProps, pnl?: º.PanelProps) => void): PropsForm {
    if ((panelIdx !== undefined) && isNaN(panelIdx))
        panelIdx = undefined
    const for_proj = (collPath === '') && (pagePath === ''), for_coll = (collPath !== ''), for_page = (pagePath !== '') && (panelIdx === undefined), for_panel = (pagePath !== '') && (panelIdx !== undefined)

    let collPropsForm: ctl_inputform.InputForm = undefined as any
    let pagePropsForm: ctl_inputform.InputForm = undefined as any
    let panelPropsForm: ctl_inputform.InputForm = undefined as any

    // create collPropsForm (maybe)
    const collAuthorFieldPlaceholder = van.state('')
    const collAuthorFieldLookup = van.state({} as ctl_inputform.FieldLookup)
    const collDynFields = van.state([] as ctl_inputform.Field[])
    const collAuthorField: ctl_inputform.Field = { id: 'authorId', title: "Author", validators: [ctl_inputform.validatorLookup], lookUp: collAuthorFieldLookup, placeholder: collAuthorFieldPlaceholder }
    if (for_proj || for_coll) {
        collPropsForm = ctl_inputform.create('collprops_form', [collAuthorField], collDynFields,
            (userModifiedRec: ctl_inputform.Rec) => {
                const props: º.CollProps = { authorId: userModifiedRec['authorId'] }
                if (props.authorId === '')
                    delete props.authorId
                props.customFields = {}
                if (º.appState.config.contentAuthoring.customFields)
                    for (const dyn_field_id in º.appState.config.contentAuthoring.customFields) {
                        props.customFields[dyn_field_id] = {}
                        props.customFields[dyn_field_id][''] = userModifiedRec[dyn_field_id + collDynFieldsLangSep]
                        if (º.appState.config.contentAuthoring.customFields[dyn_field_id]) // if custom field localizable
                            for (const lang_id in º.appState.config.contentAuthoring.languages) {
                                const loc_val = userModifiedRec[dyn_field_id + collDynFieldsLangSep + lang_id]
                                if (loc_val && loc_val.length > 0)
                                    props.customFields[dyn_field_id][lang_id] = loc_val
                            }
                    }
                onUserModified(props)
            })
    }

    // create pagePropsForm (maybe)
    const pagePaperFormatFieldPlaceholder = van.state('')
    const pagePaperFormatFieldLookup = van.state({} as ctl_inputform.FieldLookup)
    const pagePaperFormatField: ctl_inputform.Field = { id: 'paperFormatId', title: "Page Format", validators: [ctl_inputform.validatorLookup], lookUp: pagePaperFormatFieldLookup, placeholder: pagePaperFormatFieldPlaceholder }
    if (!for_panel) {
        pagePropsForm = ctl_inputform.create('pageprops_form', [pagePaperFormatField], undefined,
            (userModifiedRec: ctl_inputform.Rec) => {
                const props: º.PageProps = { paperFormatId: userModifiedRec['paperFormatId'] }
                if (props.paperFormatId === '')
                    delete props.paperFormatId
                onUserModified(undefined, props)
            })
    }

    // create panelPropsForm (always)
    const panelBorderWidthPlaceholder = van.state('')
    const panelRoundnessPlaceholder = van.state('')
    const panelBorderWidthField: ctl_inputform.Field = { id: 'panelBorderWidth', title: "Panel Border Width (mm)", validators: [], num: { int: false, min: 0, max: 10, step: 0.1 }, placeholder: panelBorderWidthPlaceholder }
    const panelRoundnessField: ctl_inputform.Field = { id: 'roundness', title: "Roundness", validators: [], num: { int: false, min: 0, max: 1, step: 0.01 }, placeholder: panelRoundnessPlaceholder }
    panelPropsForm = ctl_inputform.create(domId + '_panelprops_form', [panelBorderWidthField, panelRoundnessField], undefined,
        (userModifiedRec: ctl_inputform.Rec) => {
            const props: º.PanelProps = {
                borderWidthMm: parseFloat(userModifiedRec['panelBorderWidth']),
                roundness: parseFloat(userModifiedRec['roundness']),
            }
            if (isNaN(props.borderWidthMm!))
                delete props.borderWidthMm
            if (isNaN(props.roundness!))
                delete props.roundness
            onUserModified(undefined, undefined, props)
        })

    const sections: Record<string, ChildDom> = {}
    if (collPropsForm)
        sections["Collection " + (for_coll ? "Properties" : "Defaults")] = collPropsForm.dom
    if (pagePropsForm)
        sections["Page " + (for_page ? "Properties" : "Defaults")] = pagePropsForm.dom
    if (panelPropsForm)
        sections["Panel " + (for_panel ? "Properties" : "Defaults")] = panelPropsForm.dom
    return {
        dom: ctl_multipanel.create(domId, sections),
        refresh: () => {
            // lookups and dyn-fields
            if (collPropsForm) {
                collAuthorFieldLookup.val = º.appState.config.contentAuthoring.authors ?? {}
                collDynFields.val = utils.dictToArr(º.appState.config.contentAuthoring.customFields, (k, v) => ({ 'id': k, 'localizable': v }))
                    .sort((a, b) => (a.id == 'title') ? -987654321 : (a.id.localeCompare(b.id)))
                    .map((_) => {
                        const ret = [{ 'id': _.id + collDynFieldsLangSep, 'title': _.id, validators: [] } as ctl_inputform.Field]
                        if (_.localizable)
                            for (const lang_id in º.appState.config.contentAuthoring.languages)
                                ret.push({ 'id': _.id + collDynFieldsLangSep + lang_id, 'title': `    (${º.appState.config.contentAuthoring.languages[lang_id]})`, } as ctl_inputform.Field)
                        return ret
                    }).flat()
            }
            if (pagePropsForm)
                pagePaperFormatFieldLookup.val = º.appState.config.contentAuthoring.paperFormats ? utils.dictMap(º.strPaperFormat, º.appState.config.contentAuthoring.paperFormats) : {}

            const page = (pagePath !== '') ? º.pageFromPath(pagePath) : undefined
            const coll = for_coll ? º.collFromPath(collPath) : (page ? º.pageParent(page) : undefined)

            // placeholders
            if (coll)
                updatePlaceholders(coll, for_page, [
                    { fill: (_) => { panelBorderWidthPlaceholder.val = _ }, from: (_) => _.panelProps.borderWidthMm?.toFixed(1) ?? '', },
                    { fill: (_) => { panelRoundnessPlaceholder.val = _ }, from: (_) => _.panelProps.roundness?.toFixed(2) ?? '', },
                    {
                        fill: (_) => { collAuthorFieldPlaceholder.val = _ }, from: (_) => _.collProps.authorId ?? '', display: (_) =>
                            º.appState.config.contentAuthoring.authors ? (º.appState.config.contentAuthoring.authors[_] ?? '') : ''
                    },
                    {
                        fill: (_) => { pagePaperFormatFieldPlaceholder.val = _ }, from: (_) => _.pageProps.paperFormatId ?? '', display: (_) =>
                            º.appState.config.contentAuthoring.paperFormats ? º.strPaperFormat(º.appState.config.contentAuthoring.paperFormats[_]) : ''
                    },
                ])

            // populate form input fields
            collPropsForm?.onDataChangedAtSource(curCollPropsRec(coll))
            pagePropsForm?.onDataChangedAtSource(curPagePropsRec(coll))
            panelPropsForm?.onDataChangedAtSource(curPanelPropsRec(coll, page, panelIdx))
        },
    }
}

function updatePlaceholders(coll: º.Collection, inclColl: boolean, placeholders: { fill: (_: string) => void, from: (_: º.ProjOrColl) => string | undefined, display?: (_: string) => string }[]) {
    const parents = (inclColl ? [coll] : []).concat(º.collParents(coll))
    for (const placeholder of placeholders) {
        let placeholder_val = ''
        for (const parent of parents)
            if ((placeholder_val = placeholder.from(parent) ?? '') !== '')
                break
        if (placeholder_val === '')
            placeholder_val = placeholder.from(º.appState.proj) ?? ''
        const display_text = placeholder.display ? placeholder.display(placeholder_val) : placeholder_val
        placeholder.fill((display_text && display_text !== '') ? display_text : placeholder_val)
    }
}

function curCollPropsRec(coll?: º.Collection): ctl_inputform.Rec {
    const props = coll ? coll.collProps : º.appState.proj.collProps
    const ret: ctl_inputform.Rec = { 'authorId': props.authorId ?? '' }
    if (props.customFields)
        for (const dyn_field_id in props.customFields)
            if (props.customFields[dyn_field_id])
                for (const lang_id in props.customFields[dyn_field_id])
                    ret[dyn_field_id + collDynFieldsLangSep + lang_id] = props.customFields[dyn_field_id][lang_id]
    return ret
}

function curPagePropsRec(coll?: º.Collection, page?: º.Page): ctl_inputform.Rec {
    const props = ((page) ? page.pageProps : (coll ? coll.pageProps : º.appState.proj.pageProps))
    return { 'paperFormatId': props.paperFormatId ?? '' }
}

function curPanelPropsRec(coll?: º.Collection, page?: º.Page, panelIdx?: number): ctl_inputform.Rec {
    const props = ((page) ? ((panelIdx === undefined) ? page.panelProps : page.panels[panelIdx].panelProps)
        : (coll ? coll.panelProps : º.appState.proj.panelProps))
    return {
        'panelBorderWidth': props.borderWidthMm?.toFixed(1) ?? '',
        'roundness': props.roundness?.toFixed(2) ?? '',
    }
}
