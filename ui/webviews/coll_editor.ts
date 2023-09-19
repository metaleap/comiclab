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
const authorField: ctl_inputform.Field = { id: 'authorID', title: 'Author', validators: [ctl_inputform.validatorLookup], lookUp: authorFieldLookup, placeHolder: authorFieldPlaceHolder }
const contentFields = van.state([
] as ctl_inputform.Field[])


const main_form = ctl_inputform.create('coll_editor_form', [
    authorField,
], (userModifiedRec) => {
    setDisabled(true)
    const coll = º.collFromPath(collPath) as º.Collection
    coll.props.authorID = userModifiedRec['authorID']
    utils.vs.postMessage({ ident: 'onCollModified', payload: coll })
}, contentFields)

let main_tabs = ctl_tabs.create('coll_editor_tabs', {
    "Collection Settings": ctl_multipanel.create('coll_editor_props', {
        'Properties': main_form.ctl,
    }),
    "Preview": html.div('(TODO)'),
})

export function onInit(editorReuseKeyDerivedCollPath: string, vscode: { postMessage: (_: any) => any }, baseUri: string) {
    collPath = editorReuseKeyDerivedCollPath
    utils.onInit(vscode)
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
            contentFields.val = utils.dictToArr(º.appState.config.contentAuthoring.contentFields, (k, v) => ({ 'id': k, 'localizable': v }))
                .map((_) => ({ 'id': _.id, 'title': _.id, } as ctl_inputform.Field))
            const coll = º.collFromPath(collPath)
            if (coll) {
                let author_field_placeholder = ctl_inputform.htmlInputDefaultPlaceholder(authorField)
                if (coll) {
                    const parent = º.collParent(coll) as º.Collection
                    if (parent && parent.props && parent.props.authorID) {
                        const full_name = º.appState.config.contentAuthoring.authors ? (º.appState.config.contentAuthoring.authors[parent.props.authorID] ?? '') : ''
                        author_field_placeholder = (full_name.length > 0) ? full_name : parent.props.authorID
                    }
                }
                authorFieldPlaceHolder.val = author_field_placeholder

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
    return {
        'id': '',
        'authorID': coll?.props.authorID ?? "",
    } as ctl_inputform.Rec
}
