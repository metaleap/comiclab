import van from './vanjs/van-1.2.0.js'
import * as º from './_º.js'
import * as utils from './utils.js'

import * as ctl_pagecanvas from './ctl/pagecanvas.js'


const html = van.tags


let pagePath: string = ''
let page_editor_main = ctl_pagecanvas.create('page_editor_main', pagePath,
    (userModifiedPage) => {
        setDisabled(true)
        const page = º.pageFromPath(pagePath) as º.Page
        page.props = userModifiedPage.props
        page.panels = userModifiedPage.panels
        utils.vs.postMessage({ ident: 'onPageModified', payload: page })
    })

export function onInit(editorReuseKeyDerivedPagePath: string, vscode: { postMessage: (_: any) => any }, extUri: string) {
    pagePath = editorReuseKeyDerivedPagePath
    utils.onInit(vscode, extUri)
    window.addEventListener('message', onMessage)
    van.add(document.body, page_editor_main.ctl)
}

function setDisabled(disabled: boolean) {
    page_editor_main.ctl.style.visibility = disabled ? 'hidden' : 'visible'
}

function onMessage(evt: MessageEvent) {
    const msg = evt.data;
    switch (msg.ident) {
        case 'onAppStateRefreshed':
            if (msg.payload.config)
                º.appState.config = msg.payload.config
            if (msg.payload.proj)
                º.appState.proj = msg.payload.proj

            page_editor_main.onDataChangedAtSource(º.pageFromPath(pagePath) as º.Page)
            setDisabled(false)
            break
        default:
            utils.vs.postMessage({ 'unknown_msg': msg })
            break
    }
}
