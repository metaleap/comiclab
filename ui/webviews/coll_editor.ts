import van from './vanjs/van-1.2.0.js'
import * as º from './_º.js'
import * as utils from './utils.js'

import * as ctl_tabs from './ctl/tabs.js'
import * as ctl_inputform from './ctl/inputform.js'
import * as ctl_multipanel from './ctl/multipanel.js'


const html = van.tags


let collPath: string = ''
const authorFieldPlaceHolder = van.state('')
const authorFieldLookup = van.state({} as ctl_inputform.Lookup)
const pageFormatFieldPlaceHolder = van.state('')
const pageFormatFieldLookup = van.state({} as ctl_inputform.Lookup)
const contentDynFields = van.state([] as ctl_inputform.Field[])
const contentDynFieldsLangSep = ':'

const authorField: ctl_inputform.Field = { id: 'authorId', title: 'Author', validators: [ctl_inputform.validatorLookup], lookUp: authorFieldLookup, placeHolder: authorFieldPlaceHolder }
const pageFormatField: ctl_inputform.Field = { id: 'pageFormatId', title: 'Page Format', validators: [ctl_inputform.validatorLookup], lookUp: pageFormatFieldLookup, placeHolder: pageFormatFieldPlaceHolder }


const main_form = ctl_inputform.create('coll_editor_form', [authorField, pageFormatField], contentDynFields,
    (userModifiedRec) => {
        setDisabled(true)
        const coll = º.collFromPath(collPath) as º.Collection
        coll.props.authorId = userModifiedRec['authorId']
        coll.props.pageFormatId = userModifiedRec['pageFormatId']
        coll.props.contentFields = {}
        if (º.appState.config.contentAuthoring.contentFields)
            for (const dyn_field_id in º.appState.config.contentAuthoring.contentFields) {
                coll.props.contentFields[dyn_field_id] = {}
                coll.props.contentFields[dyn_field_id][''] = userModifiedRec[dyn_field_id + contentDynFieldsLangSep]
                if (º.appState.config.contentAuthoring.contentFields[dyn_field_id]) // if custom field localizable
                    for (const lang_id in º.appState.config.contentAuthoring.languages) {
                        const loc_val = userModifiedRec[dyn_field_id + contentDynFieldsLangSep + lang_id]
                        if (loc_val && loc_val.length > 0)
                            coll.props.contentFields[dyn_field_id][lang_id] = loc_val
                    }
            }
        utils.vs.postMessage({ ident: 'onCollModified', payload: coll })
    })

let main_tabs = ctl_tabs.create('coll_editor_main', {
    "Collection Settings": ctl_multipanel.create('coll_editor_props', {
        'Properties': main_form.ctl,
    }),
    "Preview": html.div('(TODO)'),
})

export function onInit(editorReuseKeyDerivedCollPath: string, vscode: { postMessage: (_: any) => any }, extUri: string) {
    collPath = editorReuseKeyDerivedCollPath
    utils.onInit(vscode, extUri)
    window.addEventListener('message', onMessage)
    van.add(document.body, main_tabs)
}

function setDisabled(disabled: boolean) {
    (main_tabs as HTMLElement).style.visibility = disabled ? 'hidden' : 'visible'
}

function onMessage(evt: MessageEvent) {
    const msg = evt.data;
    switch (msg.ident) {
        case 'onAppStateRefreshed':
            if (msg.payload.config)
                º.appState.config = msg.payload.config
            if (msg.payload.proj)
                º.appState.proj = msg.payload.proj

            authorFieldLookup.val = º.appState.config.contentAuthoring.authors ?? {}
            pageFormatFieldLookup.val = º.appState.config.contentAuthoring.paperFormats ? utils.dictMap(º.strPaperFormat, º.appState.config.contentAuthoring.paperFormats) : {}
            contentDynFields.val = utils.dictToArr(º.appState.config.contentAuthoring.contentFields, (k, v) => ({ 'id': k, 'localizable': v }))
                .sort((a, b) => (a.id == 'title') ? -123456789 : (a.id.localeCompare(b.id)))
                .map((_) => {
                    const ret = [{ 'id': _.id + contentDynFieldsLangSep, 'title': _.id, validators: [] } as ctl_inputform.Field]
                    if (_.id.includes('year'))
                        ret[0].validators = [ctl_inputform.validatorNumeric(1234, 2345)]
                    if (_.localizable)
                        for (const lang_id in º.appState.config.contentAuthoring.languages)
                            ret.push({ 'id': _.id + contentDynFieldsLangSep + lang_id, 'title': `    (${º.appState.config.contentAuthoring.languages[lang_id]})`, } as ctl_inputform.Field)
                    return ret
                }).flat()
            const coll = º.collFromPath(collPath)
            if (coll) {
                let author_field_placeholder = '', pageformat_field_placeholder = ''
                if (coll) {
                    const parents = º.collParents(coll)
                    for (const parent of parents) if (parent.props) {
                        if (author_field_placeholder == '' && parent.props.authorId && parent.props.authorId.length > 0) {
                            const display_text = º.appState.config.contentAuthoring.authors ? (º.appState.config.contentAuthoring.authors[parent.props.authorId] ?? '') : ''
                            author_field_placeholder = (display_text.length > 0) ? display_text : parent.props.authorId
                        }
                        if (pageformat_field_placeholder == '' && parent.props.pageFormatId && parent.props.pageFormatId.length > 0) {
                            const display_text = º.appState.config.contentAuthoring.paperFormats ? º.strPaperFormat(º.appState.config.contentAuthoring.paperFormats[parent.props.pageFormatId]) : ''
                            pageformat_field_placeholder = (display_text.length > 0) ? display_text : parent.props.pageFormatId
                        }
                    }
                }
                authorFieldPlaceHolder.val = author_field_placeholder
                pageFormatFieldPlaceHolder.val = pageformat_field_placeholder
                main_form.onDataChangedAtSource(curProps(coll))
            }
            setDisabled(false)
            break
        default:
            utils.vs.postMessage({ 'unknown_msg': msg })
            break
    }
}

function curProps(coll: º.Collection) {
    const ret: ctl_inputform.Rec = { 'authorId': coll.props.authorId ?? '', 'pageFormatId': coll.props.pageFormatId ?? '' }
    if (coll.props.contentFields)
        for (const dyn_field_id in coll.props.contentFields)
            if (coll.props.contentFields[dyn_field_id])
                for (const lang_id in coll.props.contentFields[dyn_field_id])
                    ret[dyn_field_id + contentDynFieldsLangSep + lang_id] = coll.props.contentFields[dyn_field_id][lang_id]
    return ret
}
