import van from './vanjs/van-1.2.0.js'
import * as º from './_º.js'
import * as utils from './utils.js'


const html = van.tags


let pagePath: string = ''
let page: º.Page

let ˍ: {
    main: HTMLDivElement,
    page_canvas: HTMLDivElement,
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
    const orig_size_zoom_percent = 122.5
    const page_size = º.pageSizeMm(page)
    ˍ.top_toolbar_dbg = html.div({ 'id': 'top_toolbar_dbg', 'class': 'top-toolbar-block' }, "Debug info here")
    ˍ.top_toolbar = html.div({ 'id': 'top_toolbar' },
        html.div({ 'class': 'top-toolbar-block' },
            html.a({ 'class': 'btn', 'title': 'Original size', 'style': cssIcon('zoom-in'), 'onclick': () => setZoom(orig_size_zoom_percent) }),
            ˍ.top_toolbar_zoom_text = html.span({}, orig_size_zoom_percent + '%'),
            html.a({ 'class': 'btn', 'title': 'Fit into canvas', 'style': cssIcon('zoom-out'), 'onclick': () => setZoom(0) }),
            ˍ.top_toolbar_zoom = html.input({
                'type': 'range', 'min': '1', 'max': '222', 'step': 0.5, 'value': orig_size_zoom_percent, 'onchange': (evt) => {
                    setZoom(parseInt(ˍ.top_toolbar_zoom.value))
                }
            })),
        ˍ.top_toolbar_dbg,
    )

    ˍ.main = html.div({
        'id': 'page_editor_main', 'style': `zoom: ${orig_size_zoom_percent}%;`,
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
    }, ˍ.page_canvas = html.div({
        'id': 'canvas', 'style': `left: 22px; top: 44px; width: ${page_size.wMm}mm; height: ${page_size.hMm}mm;`
    }))
    van.add(document.body, ˍ.main, ˍ.top_toolbar)
    // setZoom(0)
}

function setZoom(zoom: number) {
    const main_style = ˍ.main.style as any
    const htop = (() => (ˍ.top_toolbar.clientHeight * (100 / zoom)))
    if (zoom > 0)
        main_style.zoom = zoom.toString() + '%'
    else { // fit in viewport
        zoom = 1
        main_style.zoom = '1%'
        const wmax = (() => ˍ.main.clientWidth), hmax = (() => ˍ.main.clientHeight - htop())
        if (ˍ.page_canvas.clientWidth < wmax() && ˍ.page_canvas.clientHeight < hmax()) {
            const fw = wmax() / ˍ.page_canvas.clientWidth, fh = hmax() / ˍ.page_canvas.clientHeight
            const f = Math.min(fw, fh) - 2
            zoom = f
            main_style.zoom = zoom.toString() + '%'
        }
    }
    ˍ.page_canvas.style.left = ((ˍ.main.clientWidth - ˍ.page_canvas.clientWidth) / 2) + 'px'
    ˍ.page_canvas.style.top = (((ˍ.main.clientHeight - ˍ.page_canvas.clientHeight) / 2) + (htop() / 2)) + 'px'
    ˍ.top_toolbar_zoom.value = zoom.toString()
    ˍ.top_toolbar_zoom_text.innerText = ˍ.top_toolbar_zoom.value + "%"
}

function dom(id: string): HTMLElement {
    return document.getElementById(id) as HTMLElement
}

function cssIcon(name: string) {
    return `background-image: url('${utils.codiconPath(name)}')`
}
