import van from './vanjs/van-1.2.0.js'
import * as º from './_º.js'
import * as utils from './utils.js'


const html = van.tags


let pagePath: string = ''
let page: º.Page

let htmls: {
    main: HTMLDivElement,
    top_toolbar: HTMLDivElement,
    top_toolbar_dbg: HTMLDivElement,
} = {} as any

export function onInit(editorReuseKeyDerivedPagePath: string, vscode: { postMessage: (_: any) => any }, extUri: string) {
    pagePath = editorReuseKeyDerivedPagePath
    utils.onInit(vscode, extUri)
    window.addEventListener('message', onMessage)
}

function setDisabled(disabled: boolean) {
    if (htmls.main)
        htmls.main.style.visibility = disabled ? 'hidden' : 'visible'
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
                if (!htmls.main)
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
    const zoom_percent = 123
    htmls.top_toolbar_dbg = html.div({ 'id': 'top_toolbar_dbg' }, "Debug info here")
    htmls.top_toolbar = html.div({ 'id': 'top_toolbar' }, htmls.top_toolbar_dbg)
    htmls.main = html.div({
        'id': 'page_editor_main',
        'style': `zoom: ${zoom_percent}%; font-size: ${100 / zoom_percent}em`,
        'onwheel': (evt: WheelEvent) => {
            console.log(evt)
            htmls.top_toolbar_dbg.innerText = evt.toString()
        },
        // 'ondragstart': (evt: DragEvent) => {
        //     console.log(evt)
        //     if (evt.dataTransfer) {
        //         evt.dataTransfer.effectAllowed = "move"
        //         evt.dataTransfer.dropEffect = "move"
        //         evt.dataTransfer.setDragImage(new Image(), 0, 0)
        //     }
        //     htmls.top_toolbar_dbg.innerText = evt.clientX.toString()
        // },
    },
        htmls.top_toolbar,
        new Date().getTime().toString() + " HELLO " + pagePath + " YOU FUNKY", html.pre(JSON.stringify(page)),
    )
    van.add(document.body, htmls.main)
}
