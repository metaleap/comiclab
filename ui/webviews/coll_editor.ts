import van from './vanjs/van-1.2.0.js'
import * as º from './_º.js'
import * as utils from './utils.js'

import * as ctl_tabs from './ctl/tabs.js'
import * as ctl_inputform from './ctl/inputform.js'


let collPath: string = ''


const main_form = ctl_inputform.create('coll_editor_form', [
    { id: 'authorID', title: 'Author', validators: [ctl_inputform.validatorLookup], lookUp: () => (º.appState.config.contentAuthoring.authors ?? {}) }
], (userModifiedRec) => {
    setDisabled(true)
    const coll = º.collFromPath(collPath) as º.Collection
    coll.props.authorID = userModifiedRec['authorID']
    utils.vs.postMessage({ ident: 'onCollModified', payload: coll })
})

let main_tabs = ctl_tabs.create('coll_editor_tabs', {
    "Collection Details": main_form.ctl,
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
            main_form.onDataChangedAtSource(curProps())
            setDisabled(false)
            break
        default:
            utils.vs.postMessage({ 'unknown_msg': msg })
            break
    }
}

function curProps() {
    const coll = º.collFromPath(collPath)
    return {
        'id': '',
        'authorID': coll?.props.authorID ?? "",
    } as ctl_inputform.Rec
}
