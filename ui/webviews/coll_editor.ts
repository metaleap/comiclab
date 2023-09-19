import van from './vanjs/van-1.2.0.js'
import * as shared from './_shared_types.js'
import * as utils from './utils.js'

import * as ctl_tabs from './ctl/tabs.js'
import * as ctl_inputgrid from './ctl/inputgrid.js'
import * as ctl_multipanel from './ctl/multipanel.js'


const html = van.tags


let main_tabs = ctl_tabs.create('coll_editor_tabs', {
    "Collection Details": html.div({}, 'Hello World'),
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
