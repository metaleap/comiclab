import van from './vanjs/van-1.2.0.js'
import * as º from './_º.js'
import * as utils from './utils.js'


const html = van.tags


let pagePath: string = ''
let page: º.Page

let ˍ: {
    main: HTMLDivElement,
    top_toolbar: HTMLDivElement,
    top_toolbar_dbg: HTMLDivElement,
    top_toolbar_zoom: HTMLInputElement,
    top_toolbar_zoom_text: HTMLSpanElement,
} = {} as any

export function onInit(editorReuseKeyDerivedPagePath: string, vscode: { postMessage: (_: any) => any }, extUri: string) {
    pagePath = editorReuseKeyDerivedPagePath
    utils.onInit(vscode, extUri)
    window.addEventListener('message', onMessage)
}

function setDisabled(disabled: boolean) {
    if (ˍ.main)
        ˍ.main.style.visibility = disabled ? 'hidden' : 'visible'
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
                if (!ˍ.main)
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
    ˍ.top_toolbar_dbg = html.div({ 'id': 'top_toolbar_dbg', 'class': 'top-toolbar-block' }, "Debug info here")
    ˍ.top_toolbar = html.div({ 'id': 'top_toolbar' },
        html.div({ 'class': 'top-toolbar-block' },
            html.a({ 'class': 'btn', 'title': 'Original size', 'style': cssIcon('zoom-in'), 'onclick': () => setZoom(100) }),
            ˍ.top_toolbar_zoom_text = html.span({}, '100%'),
            html.a({ 'class': 'btn', 'title': 'Fit into canvas', 'style': cssIcon('zoom-out'), 'onclick': () => setZoom(0) }),
            ˍ.top_toolbar_zoom = html.input({
                'type': 'range', 'min': '10', 'max': '500', 'step': 10, 'value': '100', 'onchange': (evt) => {
                    setZoom(parseInt(ˍ.top_toolbar_zoom.value))
                }
            })),
        ˍ.top_toolbar_dbg,
    )

    ˍ.main = html.div({
        'id': 'page_editor_main', 'style': `zoom: ${zoom_percent}%;`,
        'onwheel': (evt: WheelEvent) => {
            console.log(evt)
            ˍ.top_toolbar_dbg.innerText = evt.toString()
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
    })
    van.add(document.body, ˍ.top_toolbar, ˍ.main)
    // setZoom(0)
}

function setZoom(zoom: number) {
    if (zoom == 0) { // fit in viewport

    }
    ˍ.top_toolbar_zoom.value = zoom.toString()
    ˍ.top_toolbar_zoom_text.innerText = ˍ.top_toolbar_zoom.value + "%"
}

function dom(id: string): HTMLElement {
    return document.getElementById(id) as HTMLElement
}

function cssIcon(name: string) {
    return `background-image: url('${utils.codiconPath(name)}')`
}
