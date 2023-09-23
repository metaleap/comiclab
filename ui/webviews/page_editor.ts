import van from './vanjs/van-1.2.1.js'
import * as º from './_º.js'
import * as utils from './utils.js'
import * as ctl_pagecanvas from './ctl/pagecanvas.js'
import * as ctl_panelwidget from './ctl/panelwidget.js'


const html = van.tags
const zoomMin = 0.5
const zoomMax = 321.5


let pagePath: string = ''
let page: º.Page
let vscCfg: object

let ˍ: {
    main: HTMLDivElement,
    page_canvas: ctl_pagecanvas.PageCanvas,
    panel_widget: ctl_panelwidget.PanelWidget,
    top_toolbar: HTMLDivElement,
    top_toolbar_dbg: HTMLSpanElement,
    top_toolbar_mpos_text: HTMLSpanElement,
    top_toolbar_zoom_input: HTMLInputElement,
    top_toolbar_zoom_text: HTMLSpanElement,
} = {} as any

export function onInit(editorReuseKeyDerivedPagePath: string, vscode: { postMessage: (_: any) => any }, extUri: string, vscCfgSettings: object, appState: º.AppState) {
    pagePath = editorReuseKeyDerivedPagePath
    utils.onInit(vscode, extUri, vscCfgSettings, appState)
    onAppStateRefreshed(appState)
    window.addEventListener('message', onMessage)
}

function onUserModifiedPage(userModifiedPage: º.Page, panelIdx?: number, reRender?: boolean): º.Page {
    º.pageUpdate(pagePath, page = userModifiedPage)
    utils.vs.postMessage({ ident: 'onPageModified', payload: page })
    if (reRender)
        reRenderPageCanvas(panelIdx)
    ˍ.panel_widget.refresh(page, panelIdx)
    return page
}
function onUserModifiedPanel(userModifiedPage: º.Page, panelIdx?: number): º.Page {
    º.pageUpdate(pagePath, page = userModifiedPage)
    utils.vs.postMessage({ ident: 'onPageModified', payload: page })
    reRenderPageCanvas(panelIdx)
    return page
}

function onPanelSelection() {
    ˍ.panel_widget.refresh(page, ˍ.page_canvas.selPanelIdx)
}

function onAppStateRefreshed(newAppState: º.AppState) {
    if (newAppState.config)
        º.appState.config = newAppState.config
    if (newAppState.proj)
        º.appState.proj = newAppState.proj

    const proj_page = º.pageFromPath(pagePath) as º.Page
    const changed = (!page) || !º.deepEq(page, proj_page, true)
    page = proj_page
    if (!ˍ.main)
        createGui()
    else if (changed)
        ˍ.panel_widget.refresh(page, reRenderPageCanvas(ˍ.page_canvas.selPanelIdx))
}

function onMessage(evt: MessageEvent) {
    const msg = evt.data;
    switch (msg.ident) {
        case 'onAppStateRefreshed':
            onAppStateRefreshed(msg.payload)
            break
        default:
            utils.vs.postMessage({ 'unknown_msg': msg })
            break
    }
}

function reRenderPageCanvas(selPanelIdx?: number) {
    const x = posX(), y = posY(), old_dom = ˍ.page_canvas.dom
    createPageCanvas(selPanelIdx)
    posX(x)
    posY(y)
    old_dom!.replaceWith(ˍ.page_canvas.dom!)
    return selPanelIdx
}

function createPageCanvas(panelIdx?: number) {
    ˍ.page_canvas = ctl_pagecanvas.create('page_editor_canvas', page, onPanelSelection, panelIdx, onUserModifiedPage, dbg)
}

function createGui() {
    const orig_size_zoom_percent: number = (utils.vscCfg && utils.vscCfg['pageEditorDefaultZoom']) ? (utils.vscCfg['pageEditorDefaultZoom'] as number) : 122.5
    const page_size = º.pageSizeMm(page)
    ˍ.top_toolbar = html.div({ 'id': 'page_editor_top_toolbar', 'class': 'page-editor-top-toolbar', 'tabindex': -1 },
        html.div({ 'id': 'page_editor_top_toolbar_zoom', 'class': 'page-editor-top-toolbar-block' },
            ˍ.top_toolbar_zoom_input = html.input({
                'type': 'range', 'min': zoomMin, 'max': zoomMax, 'step': '0.5', 'value': orig_size_zoom_percent, 'onchange': (evt) =>
                    zoomSet(parseFloat(ˍ.top_toolbar_zoom_input.value))
            }),
            ˍ.top_toolbar_zoom_text = html.span({}, orig_size_zoom_percent + '%'),
            html.button({ 'class': 'btn', 'title': `Original size (${page_size.wMm / 10} × ${page_size.hMm / 10} cm)`, 'style': cssIcon('screen-full'), 'onclick': () => zoomSet(orig_size_zoom_percent) }),
            html.button({ 'class': 'btn', 'title': `View size (${((page_size.wMm / 1.5) / 10).toFixed(1)} × ${((page_size.hMm / 1.5) / 10).toFixed(1)} cm)`, 'style': cssIcon('preview'), 'onclick': () => zoomSet(orig_size_zoom_percent / 1.5) }),
            html.button({ 'class': 'btn', 'title': 'Fit into canvas', 'style': cssIcon('screen-normal'), 'onclick': () => zoomSet() }),
        ),
        html.div({ 'class': 'page-editor-top-toolbar-block', },
            html.select({
                'class': 'placeholder',
                'onchange': () => {
                    utils.alert('this.value')
                }
            },
                html.option({ 'value': '', 'class': 'placeholder' }, '(Add new panel grid...)'),
                [true, false].flatMap((rowsFirst) => [3, 4, 2, 1, 0, 5].flatMap((numRows) => [2, 3, 0, 1, 4, 5].flatMap((numCols) =>
                    rowsFirst
                        ? html.option({ 'value': `R${numRows}C${numCols}` }, `${numRows} row(s), ${numCols} column(s)`)
                        : html.option({ 'value': `C${numCols}R${numRows}` }, `${numCols} column/s, ${numRows} row(s)`)
                ))),
            ),
        ),
        html.div({ 'id': 'page_editor_top_toolbar_dbg', 'class': 'page-editor-top-toolbar-block page-editor-top-toolbar-block-right' },
            ˍ.top_toolbar_dbg = html.span({}, "...")),
        html.div({ 'class': 'page-editor-top-toolbar-block page-editor-top-toolbar-block-right' },
            ˍ.top_toolbar_mpos_text = html.span({}, " ")),
    )
    ˍ.panel_widget = ctl_panelwidget.create('page_editor_panel_toolbar', onUserModifiedPanel, dbg)
    createPageCanvas()
    document.onkeydown = (evt: KeyboardEvent) => {
        switch (evt.key) {
            case 'Escape':
                ˍ.panel_widget.toggleDeletePrompt(false)
                break
            case '+':
            case '-':
                if (!(evt.shiftKey || evt.ctrlKey || evt.altKey || evt.metaKey)) {
                    evt.preventDefault()
                    zoomSet(zoomGet() + (5 * ((evt.key == '+') ? 1 : -1)))
                } else if (evt.altKey && ˍ.page_canvas.selPanelIdx !== undefined) {
                    evt.preventDefault()
                    ˍ.page_canvas.panelReorder(ˍ.page_canvas.selPanelIdx, (evt.key == '+') ? NaN : 0)
                }
                break
        }
    }
    ˍ.main = html.div({
        'id': 'page_editor_main', 'style': `zoom: ${orig_size_zoom_percent}%;`,
        'onmousedown': (evt: MouseEvent) => {
            if (evt.button === 1) {
                evt.preventDefault()
                ˍ.page_canvas.dom?.focus()
                ˍ.page_canvas.panelSelect(evt)
            }
        },
        'onauxclick': (evt: MouseEvent) => {
            ˍ.page_canvas.addNewPanel()
        },
        'onclick': (evt: MouseEvent) => {
            ˍ.page_canvas.panelSelect(evt)
        },
        'onwheel': (evt: WheelEvent) => {
            if (evt.shiftKey)
                zoomSet(zoomGet() + (((evt.deltaX + evt.deltaY) * 0.5)) * 0.05,
                    { x: evt.clientX, y: evt.clientY })
            else {
                posY((posY() + (evt.deltaY * -0.1)))
                posX(posX() + (evt.deltaX * -0.1))
            }
        },
        'onmouseout': (evt: Event) => {
            [ˍ.page_canvas.xMm, ˍ.page_canvas.yMm] = [undefined, undefined]
            ˍ.top_toolbar_mpos_text.innerHTML = 'Add panel: <i>mid-click</i>.&nbsp;&nbsp;—&nbsp;&nbsp;Add balloon: <i>shift+mid-click</i>.'
        },
        'onmousemove': (evt: MouseEvent) => {
            const zoom = zoomGet()
            const xptr = ((100 / zoom) * evt.clientX) - posX(), yptr = ((100 / zoom) * evt.clientY) - posY()
            const xfac = xptr / ˍ.page_canvas.dom!.clientWidth, yfac = yptr / ˍ.page_canvas.dom!.clientHeight
            ˍ.page_canvas.xMm = page_size.wMm * xfac
            ˍ.page_canvas.yMm = page_size.hMm * yfac
            ˍ.top_toolbar_mpos_text.innerText = `X: ${(ˍ.page_canvas.xMm * 0.1).toFixed(1)} , Y:${(ˍ.page_canvas.yMm * 0.1).toFixed(1)}`
        },
    }, ˍ.page_canvas.dom)
    van.add(document.body, ˍ.main, ˍ.panel_widget.dom, ˍ.top_toolbar)
    zoomSet()
}

function posX(newX?: number): number {
    if (newX !== undefined)
        ˍ.page_canvas.dom!.style.left = newX.toString() + 'px'
    return parseInt(ˍ.page_canvas.dom!.style.left)
}
function posY(newY?: number): number {
    if (newY !== undefined)
        ˍ.page_canvas.dom!.style.top = newY.toString() + 'px'
    return parseInt(ˍ.page_canvas.dom!.style.top)
}

function zoomGet(): number {
    return parseFloat((ˍ.main.style as any).zoom)
}
function zoomSet(newZoom?: number, mouse?: { x: number, y: number }) {
    const main_style = ˍ.main.style as any
    const htop = (() => (ˍ.top_toolbar.clientHeight * (100 / (newZoom as number))))
    if (newZoom !== undefined) {
        const w_old = ˍ.main.clientWidth, h_old = ˍ.main.clientHeight
        const x_mid_off = (ˍ.page_canvas.dom!.clientWidth / 2), y_mid_off = (ˍ.page_canvas.dom!.clientHeight / 2)
        const x_mid_old = posX() + x_mid_off, y_mid_old = posY() + y_mid_off
        const x_rel = (w_old / x_mid_old), y_rel = (h_old / y_mid_old)
        main_style.zoom = (newZoom = Math.max(zoomMin, Math.min(zoomMax, newZoom))).toString() + '%'
        const x_mid_new = ˍ.main.clientWidth / x_rel, y_mid_new = ˍ.main.clientHeight / y_rel
        posX(x_mid_new - x_mid_off)
        posY(y_mid_new - y_mid_off)
    } else { // fit in viewport
        newZoom = 1
        main_style.zoom = '1%'
        const wmax = (() => ˍ.main.clientWidth), hmax = (() => ˍ.main.clientHeight - htop())
        if (ˍ.page_canvas.dom!.clientWidth < wmax() && ˍ.page_canvas.dom!.clientHeight < hmax()) {
            const fw = wmax() / ˍ.page_canvas.dom!.clientWidth, fh = hmax() / ˍ.page_canvas.dom!.clientHeight
            newZoom = Math.min(fw, fh) - 2
            main_style.zoom = newZoom.toString() + '%'
        }
        posX((ˍ.main.clientWidth - ˍ.page_canvas.dom!.clientWidth) / 2)
        posY(((ˍ.main.clientHeight - ˍ.page_canvas.dom!.clientHeight) / 2) + (htop() / 2))
    }
    ˍ.top_toolbar_zoom_input.value = newZoom.toString()
    ˍ.top_toolbar_zoom_text.innerText = newZoom.toFixed(1) + "%"
}

function dbg(...msg: any[]) {
    ˍ.top_toolbar_dbg.innerText = msg.join("\u00A0\u00A0\u00A0\u00A0")
}

function dom(id: string): HTMLElement {
    return document.getElementById(id) as HTMLElement
}

function cssIcon(name: string) {
    return `background-image: url('${utils.codiconPath(name)}')`
}
