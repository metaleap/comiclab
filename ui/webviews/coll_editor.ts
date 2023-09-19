import van from './vanjs/van-1.2.0.js'
import * as º from './_º.js'
import * as utils from './utils.js'

import * as ctl_tabs from './ctl/tabs.js'
import * as ctl_form from './ctl/form.js'


const main_form = ctl_form.create('coll_editor_form', [
    { id: 'authorID', title: 'Author', validators: [ctl_form.validatorLookup], lookUp: () => (º.appState.config.contentAuthoring.authors ?? {}) }
], (userModifiedRec) => {
    // const c = shared.appState.proj.collections[0]
})

let main_tabs = ctl_tabs.create('coll_editor_tabs', {
    "Collection Details": main_form.ctl,
})

export function onInit(vscode: { postMessage: (_: any) => any }, baseUri: string) {
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
        case 'onCollRefreshed':
            console.log(msg.payload)
            // shared.appState.pro = msg.payload as shared.Collection
            // authors_grid.onDataChangedAtSource(curAuthors())
            // paperformats_grid.onDataChangedAtSource(curPaperFormats())
            // languages_grid.onDataChangedAtSource(curLanguages())
            // contentfields_grid.onDataChangedAtSource(curContentFields())
            setDisabled(false)
            break
        default:
            utils.vs.postMessage({ 'unknown_msg': msg })
            break
    }
}
