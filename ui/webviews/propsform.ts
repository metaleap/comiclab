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

export function create(domId: string, collPath: string, pagePath: string, sel: º.ShapeRef | undefined, onUserModified: (c?: º.CollProps, pg?: º.PageProps, pnl?: º.PanelProps, bln?: º.BalloonProps) => void): PropsForm {
    const for_proj = (collPath === '') && (pagePath === ''),
        for_coll = (collPath !== ''),
        for_page = (pagePath !== '') && !sel,
        for_balloon = (pagePath !== '') && (sel ? true : false) && sel!.isBalloon,
        for_panel = (pagePath !== '') && (sel ? true : false) && !(sel!.isBalloon)

    let collPropsForm: ctl_inputform.InputForm = undefined as any
    let pagePropsForm: ctl_inputform.InputForm = undefined as any
    let panelPropsForm: ctl_inputform.InputForm = undefined as any
    let balloonPropsForm: ctl_inputform.InputForm = undefined as any

    // create collPropsForm (maybe)
    const collAuthorFieldPlaceholder = van.state('')
    const collAuthorFieldLookup = van.state({} as ctl_inputform.FieldLookup)
    const collDynFields = van.state([] as ctl_inputform.Field[])
    if (for_proj || for_coll) {
        const collAuthorField: ctl_inputform.Field = { id: 'authorId', title: "Author", validators: [ctl_inputform.validatorLookup], lookUp: collAuthorFieldLookup, placeholder: collAuthorFieldPlaceholder }
        collPropsForm = ctl_inputform.create('collprops_form', [collAuthorField], collDynFields,
            (userModifiedRec: ctl_inputform.Rec) => {
                const collProps: º.CollProps = { authorId: userModifiedRec['authorId'] }
                if (collProps.authorId === '')
                    delete collProps.authorId
                collProps.customFields = {}
                if (º.appState.config.contentAuthoring.customFields && for_coll)
                    for (const dyn_field_id in º.appState.config.contentAuthoring.customFields) {
                        collProps.customFields[dyn_field_id] = {}
                        collProps.customFields[dyn_field_id][''] = userModifiedRec[dyn_field_id + collDynFieldsLangSep]
                        if (º.appState.config.contentAuthoring.customFields[dyn_field_id]) // if custom field localizable
                            for (const lang_id in º.appState.config.contentAuthoring.languages) {
                                const loc_val = userModifiedRec[dyn_field_id + collDynFieldsLangSep + lang_id]
                                if (loc_val && loc_val.length > 0)
                                    collProps.customFields[dyn_field_id][lang_id] = loc_val
                            }
                    }
                onUserModified(collProps)
            })
    }

    // create pagePropsForm (maybe)
    const pagePaperFormatFieldPlaceholder = van.state('')
    const pagePaperFormatFieldLookup = van.state({} as ctl_inputform.FieldLookup)
    if (!(for_panel || for_balloon)) {
        const pagePaperFormatField: ctl_inputform.Field = { id: 'paperFormatId', title: "Page format", validators: [ctl_inputform.validatorLookup], lookUp: pagePaperFormatFieldLookup, placeholder: pagePaperFormatFieldPlaceholder }
        pagePropsForm = ctl_inputform.create('pageprops_form', [pagePaperFormatField], undefined,
            (userModifiedRec: ctl_inputform.Rec) => {
                const pageProps: º.PageProps = { paperFormatId: userModifiedRec['paperFormatId'] }
                if (pageProps.paperFormatId === '')
                    delete pageProps.paperFormatId
                onUserModified(undefined, pageProps)
            })
    }

    // create panelPropsForm (maybe)
    const panelBorderWidthPlaceholder = van.state('')
    const panelInnerMarginPlaceholder = van.state('')
    const panelOuterMarginPlaceholder = van.state('')
    const panelRoundnessPlaceholder = van.state('')
    if (!for_balloon) {
        const panelBorderWidthField: ctl_inputform.Field = { id: 'borderWidthMm', title: "Border width (mm)", validators: [], num: { int: false, min: 0, max: 10, step: 0.1 }, placeholder: panelBorderWidthPlaceholder }
        const panelInnerMarginField: ctl_inputform.Field = { id: 'innerMarginMm', title: "Inter-panel margin (mm)", validators: [], num: { int: false, min: 0, max: 100, step: 0.1 }, placeholder: panelInnerMarginPlaceholder }
        const panelOuterMarginField: ctl_inputform.Field = { id: 'outerMarginMm', title: "Page-edge margin (mm)", validators: [], num: { int: false, min: 0, max: 100, step: 0.1 }, placeholder: panelOuterMarginPlaceholder }
        const panelRoundnessField: ctl_inputform.Field = { id: 'roundness', title: "Roundness", validators: [], num: { int: false, min: 0, max: 1, step: 0.01 }, placeholder: panelRoundnessPlaceholder }
        panelPropsForm = ctl_inputform.create(domId + '_panelprops_form', [panelBorderWidthField, panelRoundnessField, panelInnerMarginField, panelOuterMarginField], undefined,
            (userModifiedRec: ctl_inputform.Rec) => {
                const panelProps: º.PanelProps = {}
                for (const num_prop_name of ['innerMarginMm', 'outerMarginMm', 'borderWidthMm', 'roundness']) {
                    const v = parseFloat(userModifiedRec[num_prop_name])
                    if ((v !== undefined) && !isNaN(v))
                        (panelProps as any)[num_prop_name] = v
                }
                onUserModified(undefined, undefined, panelProps)
            })
    }

    // create balloonPropsForm (maybe)
    const balloonBorderWidthPlaceholder = van.state('')
    const balloonRoundnessPlaceholder = van.state('')
    const balloonTailSizePlaceholder = van.state('')
    const balloonTailCurvingPlaceholder = van.state('')
    if (!for_panel) {
        const balloonBorderWidthField: ctl_inputform.Field = { id: 'borderWidthMm', title: "Border width (mm)", validators: [], num: { int: false, min: 0, max: 10, step: 0.1 }, placeholder: balloonBorderWidthPlaceholder }
        const balloonRoundnessField: ctl_inputform.Field = { id: 'roundness', title: "Roundness", validators: [], num: { int: false, min: 0, max: 1, step: 0.01 }, placeholder: balloonRoundnessPlaceholder }
        const balloonTailSizeField: ctl_inputform.Field = { id: 'tailSizeMm', title: 'Tail thickness', validators: [], num: { int: false, min: 0, max: 123, step: 0.1 }, placeholder: balloonTailSizePlaceholder }
        const balloonTailCurvingField: ctl_inputform.Field = { id: 'tailCurving', title: 'Tail curving', validators: [], num: { int: false, min: 0, max: 1, step: 0.01 }, placeholder: balloonTailCurvingPlaceholder }
        balloonPropsForm = ctl_inputform.create(domId + '_balloonprops_form', [balloonBorderWidthField, balloonRoundnessField, balloonTailSizeField, balloonTailCurvingField], undefined,
            (userModifiedRec: ctl_inputform.Rec) => {
                const balloonProps: º.BalloonProps = {}
                for (const num_prop_name of ['borderWidthMm', 'roundness', 'tailSizeMm', 'tailCurving']) {
                    const v = parseFloat(userModifiedRec[num_prop_name])
                    if ((v !== undefined) && !isNaN(v))
                        (balloonProps as any)[num_prop_name] = v
                }
                onUserModified(undefined, undefined, undefined, balloonProps)
            })
    }

    const sections: Record<string, ChildDom> = {}
    if (collPropsForm)
        sections["Collection " + (for_coll ? "properties" : "defaults")] = collPropsForm.dom
    if (pagePropsForm)
        sections["Page " + (for_page ? "properties" : "defaults")] = pagePropsForm.dom
    if (panelPropsForm)
        sections["Panel " + (for_panel ? "properties" : "defaults")] = panelPropsForm.dom
    if (balloonPropsForm)
        sections["Balloon " + (for_balloon ? "properties" : "defaults")] = balloonPropsForm.dom
    return {
        dom: ctl_multipanel.create(domId, sections),
        refresh: () => {
            // lookups and dyn-fields
            if (collPropsForm) {
                collAuthorFieldLookup.val = º.appState.config.contentAuthoring.authors ?? {}
                if (for_coll)
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
            updatePlaceholders(coll, page, for_panel || for_balloon, [
                {
                    fill: (_) => { balloonBorderWidthPlaceholder.val = _ }, from: (_) => (_.balloonProps?.borderWidthMm?.toFixed(1) ?? ''), finalDefault: '0',
                },
                {
                    fill: (_) => { panelBorderWidthPlaceholder.val = _ }, from: (_) => (_.panelProps?.borderWidthMm?.toFixed(1) ?? ''), finalDefault: '0',
                },
                {
                    fill: (_) => { panelInnerMarginPlaceholder.val = _ }, from: (_) => (_.panelProps?.innerMarginMm?.toFixed(1) ?? ''), finalDefault: '0',
                },
                {
                    fill: (_) => { panelOuterMarginPlaceholder.val = _ }, from: (_) => (_.panelProps?.outerMarginMm?.toFixed(1) ?? ''), finalDefault: '0',
                },
                {
                    fill: (_) => { panelRoundnessPlaceholder.val = _ }, from: (_) => (_.panelProps?.roundness?.toFixed(2) ?? ''), finalDefault: '0',
                },
                {
                    fill: (_) => { balloonRoundnessPlaceholder.val = _ }, from: (_) => (_.balloonProps?.roundness?.toFixed(2) ?? ''), finalDefault: '0',
                },
                {
                    fill: (_) => { balloonTailSizePlaceholder.val = _ }, from: (_) => (_.balloonProps?.tailSizeMm?.toFixed(1) ?? ''), finalDefault: '0',
                },
                {
                    fill: (_) => { balloonTailCurvingPlaceholder.val = _ }, from: (_) => (_.balloonProps?.tailCurving?.toFixed(2) ?? ''), finalDefault: '0',
                },
                {
                    fill: (_) => { collAuthorFieldPlaceholder.val = _ }, from: (_) => (_.collProps?.authorId ?? ''),
                    display: (_) => (º.appState.config.contentAuthoring.authors ? (º.appState.config.contentAuthoring.authors[_] ?? '') : ''),
                },
                {
                    fill: (_) => { pagePaperFormatFieldPlaceholder.val = _ }, from: (_) => (_.pageProps?.paperFormatId ?? ''),
                    display: (_) => (º.appState.config.contentAuthoring.paperFormats ? º.strPaperFormat(º.appState.config.contentAuthoring.paperFormats[_]) : ''),
                },
            ])

            // populate form input fields
            collPropsForm?.onDataChangedAtSource(curCollPropsRec(coll))
            pagePropsForm?.onDataChangedAtSource(curPagePropsRec(coll, page))
            panelPropsForm?.onDataChangedAtSource(curPanelPropsRec(coll, page, (sel?.isBalloon) ? undefined : sel?.idx))
            balloonPropsForm?.onDataChangedAtSource(curBalloonPropsRec(coll, page, (sel?.isBalloon) ? sel.idx : undefined))
        },
    }
}

function updatePlaceholders(coll: º.Collection | undefined, page: º.Page | undefined, forPanelOrBalloon: boolean, placeholders: { fill: (_: string) => void, from: (_: º.ProjOrCollOrPage) => string | undefined, display?: (_: string) => string, finalDefault?: string }[]) {
    const parents = coll ? ((page ? [coll] : []).concat(º.collParents(coll))) : []
    for (const placeholder of placeholders) {
        let placeholder_val = (forPanelOrBalloon && page) ? (placeholder.from(page) ?? '') : ''
        if (placeholder_val === '')
            for (const parent of parents)
                if ((placeholder_val = placeholder.from(parent) ?? '') !== '')
                    break
        if ((placeholder_val === '') && coll)
            placeholder_val = placeholder.from(º.appState.proj) ?? ''
        if ((placeholder_val === '') && placeholder.finalDefault)
            placeholder_val = placeholder.finalDefault
        const display_text = placeholder.display ? placeholder.display(placeholder_val) : placeholder_val
        placeholder.fill((display_text && display_text !== '') ? display_text : placeholder_val)
    }
}

function curCollPropsRec(coll?: º.Collection): ctl_inputform.Rec {
    const props = coll ? coll.collProps : º.appState.proj.collProps
    const ret: ctl_inputform.Rec = { 'authorId': props.authorId ?? '' }
    if (props.customFields && coll)
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
        'borderWidthMm': props.borderWidthMm?.toFixed(1) ?? '',
        'innerMarginMm': props.innerMarginMm?.toFixed(1) ?? '',
        'outerMarginMm': props.outerMarginMm?.toFixed(1) ?? '',
        'roundness': props.roundness?.toFixed(2) ?? '',
    }
}

function curBalloonPropsRec(coll?: º.Collection, page?: º.Page, balloonIdx?: number): ctl_inputform.Rec {
    const props = ((page) ? ((balloonIdx === undefined) ? page.balloonProps : page.balloons[balloonIdx].balloonProps)
        : (coll ? coll.balloonProps : º.appState.proj.balloonProps))
    return {
        'borderWidthMm': props.borderWidthMm?.toFixed(1) ?? '',
        'roundness': props.roundness?.toFixed(2) ?? '',
        'tailSizeMm': props.tailSizeMm?.toFixed(1) ?? '',
        'tailCurving': props.tailCurving?.toFixed(2) ?? '',
    }
}
