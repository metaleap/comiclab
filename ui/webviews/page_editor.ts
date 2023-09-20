import van from './vanjs/van-1.2.0.js'
import * as º from './_º.js'
import * as utils from './utils.js'


const html = van.tags


let pagePath: string = ''
let page: º.Page
let page_editor_main: HTMLElement

export function onInit(editorReuseKeyDerivedPagePath: string, vscode: { postMessage: (_: any) => any }, extUri: string) {
    pagePath = editorReuseKeyDerivedPagePath
    utils.onInit(vscode, extUri)
    window.addEventListener('message', onMessage)
}

function setDisabled(disabled: boolean) {
    if (page_editor_main)
        page_editor_main.style.visibility = disabled ? 'hidden' : 'visible'
}

function onUserModified() {
    setDisabled(true)
    const proj_page = º.pageFromPath(pagePath) as º.Page
    proj_page.props = page.props
    proj_page.panels = page.panels
    utils.vs.postMessage({ ident: 'onPageModified', payload: proj_page })
}

function onPotentiallyChangedAtSource() {
    if (!page) {
        page = º.pageFromPath(pagePath) as º.Page
    }
}

function onMessage(evt: MessageEvent) {
    const msg = evt.data;
    switch (msg.ident) {
        case 'onAppStateRefreshed':
            if (msg.payload.config)
                º.appState.config = msg.payload.config
            if (msg.payload.proj)
                º.appState.proj = msg.payload.proj

            const proj_page = º.pageFromPath(pagePath)
            if (proj_page && ((!page) || !º.deepEq(page, proj_page))) {
                page = proj_page
                if (!page_editor_main)
                    createGui()
                onPotentiallyChangedAtSource()
                setDisabled(false)
            }
            break
        default:
            utils.vs.postMessage({ 'unknown_msg': msg })
            break
    }
}

function createGui() {
    page_editor_main = html.div(new Date().getTime().toString() + " Hello " + pagePath + " YOU OLD", html.pre(JSON.stringify(page)))
    van.add(document.body, page_editor_main)
}
