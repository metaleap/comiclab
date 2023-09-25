import van, { State } from './vanjs/van-1.2.1.js'
import * as º from './_º.js'
import * as utils from './utils.js'

import * as ctl_tabs from './ctl/tabs.js'
import * as ctl_inputform from './ctl/inputform.js'
import * as ctl_multipanel from './ctl/multipanel.js'


const html = van.tags


let collPath: string = ''
const authorFieldPlaceholder = van.state('')
const authorFieldLookup = van.state({} as ctl_inputform.Lookup)
const paperFormatFieldPlaceholder = van.state('')
const paperFormatFieldLookup = van.state({} as ctl_inputform.Lookup)
const panelBorderWidthPlaceholder = van.state('')
const contentDynFields = van.state([] as ctl_inputform.Field[])
const contentDynFieldsLangSep = ':'

const authorField: ctl_inputform.Field = { id: 'authorId', title: 'Author', validators: [ctl_inputform.validatorLookup], lookUp: authorFieldLookup, placeholder: authorFieldPlaceholder }
const paperFormatField: ctl_inputform.Field = { id: 'paperFormatId', title: 'Page Format', validators: [ctl_inputform.validatorLookup], lookUp: paperFormatFieldLookup, placeholder: paperFormatFieldPlaceholder }
const panelBorderWidthField: ctl_inputform.Field = { id: 'panelBorderWidth', title: 'Panel Border Width (mm)', validators: [], num: { int: false, min: 0, max: 10, step: 0.1 }, placeholder: panelBorderWidthPlaceholder }

const pageprops_form = ctl_inputform.create('pageprops_form', [paperFormatField, panelBorderWidthField], undefined,
    (userModifiedRec: ctl_inputform.Rec) => {
        setDisabled(true)
        const coll = º.collFromPath(collPath) as º.Collection
        coll.collProps.pages.paperFormatId = userModifiedRec['paperFormatId']
        if (isNaN(coll.collProps.pages.panels.borderWidthMm = parseFloat(userModifiedRec['panelBorderWidth'])))
            coll.collProps.pages.panels.borderWidthMm = undefined
        utils.vs.postMessage({ ident: 'onCollModified', payload: coll })
    })
const contentprops_form = ctl_inputform.create('contentprops_form', [authorField], contentDynFields,
    (userModifiedRec: ctl_inputform.Rec) => {
        setDisabled(true)
        const coll = º.collFromPath(collPath) as º.Collection
        coll.collProps.content.authorId = userModifiedRec['authorId']
        coll.collProps.content.customFields = {}
        if (º.appState.config.contentAuthoring.customFields)
            for (const dyn_field_id in º.appState.config.contentAuthoring.customFields) {
                coll.collProps.content.customFields[dyn_field_id] = {}
                coll.collProps.content.customFields[dyn_field_id][''] = userModifiedRec[dyn_field_id + contentDynFieldsLangSep]
                if (º.appState.config.contentAuthoring.customFields[dyn_field_id]) // if custom field localizable
                    for (const lang_id in º.appState.config.contentAuthoring.languages) {
                        const loc_val = userModifiedRec[dyn_field_id + contentDynFieldsLangSep + lang_id]
                        if (loc_val && loc_val.length > 0)
                            coll.collProps.content.customFields[dyn_field_id][lang_id] = loc_val
                    }
            }
        utils.vs.postMessage({ ident: 'onCollModified', payload: coll })
    })

let main_tabs = ctl_tabs.create('coll_editor_main', {
    "Collection Settings": ctl_multipanel.create('coll_editor_props', {
        "Content Properties": contentprops_form.dom,
        "Page Defaults": pageprops_form.dom,
    }),
    "Preview": html.div('(TODO)'),
})

export function onInit(editorReuseKeyDerivedCollPath: string, vscode: { postMessage: (_: any) => any }, extUri: string, vscCfgSettings: object, appState: º.AppState) {
    collPath = editorReuseKeyDerivedCollPath
    utils.onInit(vscode, extUri, vscCfgSettings, appState)
    onAppStateRefreshed(appState)
    van.add(document.body, main_tabs)
    window.addEventListener('message', onMessage)
}

function setDisabled(disabled: boolean) {
    (main_tabs as HTMLElement).style.visibility = disabled ? 'hidden' : 'visible'
}

function onAppStateRefreshed(newAppState: º.AppState) {
    if (newAppState.config)
        º.appState.config = newAppState.config
    if (newAppState.proj)
        º.appState.proj = newAppState.proj

    authorFieldLookup.val = º.appState.config.contentAuthoring.authors ?? {}
    paperFormatFieldLookup.val = º.appState.config.contentAuthoring.paperFormats ? utils.dictMap(º.strPaperFormat, º.appState.config.contentAuthoring.paperFormats) : {}
    contentDynFields.val = utils.dictToArr(º.appState.config.contentAuthoring.customFields, (k, v) => ({ 'id': k, 'localizable': v }))
        .sort((a, b) => (a.id == 'title') ? -987654321 : (a.id.localeCompare(b.id)))
        .map((_) => {
            const ret = [{ 'id': _.id + contentDynFieldsLangSep, 'title': _.id, validators: [] } as ctl_inputform.Field]
            if (_.localizable)
                for (const lang_id in º.appState.config.contentAuthoring.languages)
                    ret.push({ 'id': _.id + contentDynFieldsLangSep + lang_id, 'title': `    (${º.appState.config.contentAuthoring.languages[lang_id]})`, } as ctl_inputform.Field)
            return ret
        }).flat()
    const coll = º.collFromPath(collPath)
    if (coll) {
        refreshPlaceholders(coll, [
            { fill: panelBorderWidthPlaceholder, from: (_) => _.pages.panels.borderWidthMm?.toFixed(1) ?? '', },
            {
                fill: authorFieldPlaceholder, from: (_) => _.content.authorId ?? '', display: (_) =>
                    º.appState.config.contentAuthoring.authors ? (º.appState.config.contentAuthoring.authors[_] ?? '') : ''
            },
            {
                fill: paperFormatFieldPlaceholder, from: (_) => _.pages.paperFormatId ?? '', display: (_) =>
                    º.appState.config.contentAuthoring.paperFormats ? º.strPaperFormat(º.appState.config.contentAuthoring.paperFormats[_]) : ''
            },
        ])
        contentprops_form.onDataChangedAtSource(curContentProps(coll))
        pageprops_form.onDataChangedAtSource(curPageProps(coll))
    }
    setDisabled(false)
}

function refreshPlaceholders(coll: º.Collection, placeholders: { fill: State<string>, from: (_: º.CollProps) => string | undefined, display?: (_: string) => string }[]) {
    const parents = º.collParents(coll)
    for (const placeholder of placeholders) {
        let placeholder_val = ''
        for (const parent of parents)
            if (parent.collProps && ((placeholder_val = placeholder.from(parent.collProps) ?? '') !== ''))
                break
        const display_text = placeholder.display ? placeholder.display(placeholder_val) : placeholder_val
        placeholder.fill.val = (display_text && display_text !== '') ? display_text : placeholder_val
    }
}

function onMessage(evt: MessageEvent) {
    const msg = evt.data;
    switch (msg.ident) {
        case 'onAppStateRefreshed':
            onAppStateRefreshed(msg.payload)
            break
        default:
            utils.vs.postMessage({ 'unknown_msg': msg })
            break
    }
}

function curContentProps(coll: º.Collection) {
    const ret: ctl_inputform.Rec = { 'authorId': coll.collProps.content.authorId ?? '' }
    if (coll.collProps.content.customFields)
        for (const dyn_field_id in coll.collProps.content.customFields)
            if (coll.collProps.content.customFields[dyn_field_id])
                for (const lang_id in coll.collProps.content.customFields[dyn_field_id])
                    ret[dyn_field_id + contentDynFieldsLangSep + lang_id] = coll.collProps.content.customFields[dyn_field_id][lang_id]
    return ret
}

function curPageProps(coll: º.Collection) {
    const ret: ctl_inputform.Rec = { 'paperFormatId': coll.collProps.pages.paperFormatId ?? '', 'panelBorderWidth': coll.collProps.pages.panels.borderWidthMm?.toFixed(1) ?? '' }
    return ret
}
