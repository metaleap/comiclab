import van from './vanjs/van-1.2.1.js'
import * as º from './_º.js'
import * as utils from './utils.js'
import * as ctl_pagecanvas from './ctl/pagecanvas.js'
import * as ctl_paneltoolbar from './ctl/paneltoolbar.js'
import * as ctl_paneledgebar from './ctl/paneledgebar.js'


const html = van.tags
const zoomMin = 0.5
const zoomMax = 321.5


let pagePath: string = ''
let page: º.Page

let ˍ: {
    main: HTMLDivElement,
    page_canvas: ctl_pagecanvas.PageCanvas,
    top_toolbar: HTMLDivElement, top_toolbar_dbg_text: HTMLSpanElement, top_toolbar_mpos_text: HTMLSpanElement,
    top_toolbar_zoom_text: HTMLSpanElement,
    top_toolbar_zoom_input: HTMLInputElement,
    top_toolbar_menu_addpanelgrid: HTMLSelectElement,
    panel_toolbar: ctl_paneltoolbar.PanelToolbar,
    panelbar_left: ctl_paneledgebar.PanelEdgeBar,
    panelbar_right: ctl_paneledgebar.PanelEdgeBar,
    panelbar_upper: ctl_paneledgebar.PanelEdgeBar,
    panelbar_lower: ctl_paneledgebar.PanelEdgeBar,
} = {} as any

export function onInit(editorReuseKeyDerivedPagePath: string, vscode: { postMessage: (_: any) => any }, extUri: string, vscCfg: object, appState: º.AppState) {
    pagePath = editorReuseKeyDerivedPagePath
    utils.onInit(vscode, extUri, vscCfg, appState)
    onAppStateRefreshed(appState)
    window.addEventListener('message', onMessage)
}

function onUserModifiedPage(userModifiedPage: º.Page, reRender?: boolean): º.Page {
    º.pageUpdate(pagePath, page = userModifiedPage)
    utils.vs.postMessage({ ident: 'onPageModified', payload: page })
    if (!reRender)
        refreshPanelBars()
    else
        reRenderPageCanvas()
    if (ˍ.page_canvas.selPanelIdx !== undefined)
        document.getElementById('panel_' + ˍ.page_canvas.selPanelIdx)?.focus()
    return page
}
function onUserModifiedPanel(): º.Page {
    º.pageUpdate(pagePath, page)
    utils.vs.postMessage({ ident: 'onPageModified', payload: page })
    reRenderPageCanvas()
    refreshPanelBars(true)
    return page
}

function onPanelSelection() {
    refreshPanelBars()
}

function refreshPanelBars(edgeBarsOnly?: boolean) {
    if (!edgeBarsOnly)
        ˍ.panel_toolbar.refresh()
    for (const panel_bar of [ˍ.panelbar_left, ˍ.panelbar_right, ˍ.panelbar_upper, ˍ.panelbar_lower])
        panel_bar.refresh() // do this before the below, so we'll have a non-0 clientWidth
    if (ˍ.page_canvas.selPanelIdx !== undefined) { // positioning the panel bar right on its assigned panel edge
        const panel = page.panels[ˍ.page_canvas.selPanelIdx]
        const page_size = º.pageSizeMm(page)
        const panel_px_pos = mmToPx(panel.x, panel.y, true, page_size)
        const panel_px_size = mmToPx(panel.w, panel.h, false, page_size)

        ˍ.panelbar_upper.dom.style.left = ((panel_px_pos.xPx + (panel_px_size.xPx / 2)) - (ˍ.panelbar_upper.dom.clientWidth / 2)).toFixed(0) + 'px'
        ˍ.panelbar_lower.dom.style.left = ˍ.panelbar_upper.dom.style.left
        ˍ.panelbar_upper.dom.style.top = (panel_px_pos.xPy - 12).toFixed(0) + 'px'
        ˍ.panelbar_lower.dom.style.top = (panel_px_pos.xPy + panel_px_size.xPy).toFixed(0) + 'px'

        ˍ.panelbar_left.dom.style.top = ((panel_px_pos.xPy + (panel_px_size.xPy / 2)) - (ˍ.panelbar_left.dom.clientHeight / 2)).toFixed(0) + 'px'
        ˍ.panelbar_right.dom.style.top = ˍ.panelbar_left.dom.style.top
        ˍ.panelbar_left.dom.style.left = (panel_px_pos.xPx - 12).toFixed(0) + 'px'
        ˍ.panelbar_right.dom.style.left = (panel_px_pos.xPx + panel_px_size.xPx).toFixed(0) + 'px'
    }
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
        reRenderPageCanvas()
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

function reRenderPageCanvas() {
    const x = posX(), y = posY(), old_dom = ˍ.page_canvas.dom
    createPageCanvas(ˍ.page_canvas.selPanelIdx)
    old_dom!.replaceWith(ˍ.page_canvas.dom!)
    refreshPanelBars()
    posX(x)
    posY(y)
}

function createPageCanvas(panelIdx?: number) {
    ˍ.page_canvas = ctl_pagecanvas.create('page_editor_canvas', page, onPanelSelection, panelIdx, onUserModifiedPage)
    for (const panelbar of [ˍ.panel_toolbar, ˍ.panelbar_left, ˍ.panelbar_right, ˍ.panelbar_upper, ˍ.panelbar_lower])
        if (panelbar)
            panelbar.canvas = ˍ.page_canvas
}

function createGui() {
    const orig_size_zoom_percent: number = (utils.vscCfg && utils.vscCfg['pageEditorDefaultZoom']) ? (utils.vscCfg['pageEditorDefaultZoom'] as number) : 122.5
    const page_size = º.pageSizeMm(page)
    ˍ.top_toolbar_menu_addpanelgrid = html.select({
        'class': 'placeholder',
        'onchange': () => {
            ˍ.top_toolbar_menu_addpanelgrid.blur()
            const [num_rows, num_cols] = JSON.parse(ˍ.top_toolbar_menu_addpanelgrid.value) as number[]
            ˍ.top_toolbar_menu_addpanelgrid.selectedIndex = 0
            ˍ.page_canvas.addNewPanelGrid(num_rows, num_cols)
        }
    }, html.option({ 'value': '', 'class': 'placeholder' }, '(Add new page-sized full panel grid...)'),
        [3, 4, 2, 5, 1].flatMap((numRows) => [2, 3, 1, 4, 5].flatMap((numCols) =>
            html.option({ 'value': `${JSON.stringify([numRows, numCols])}` }, `${numRows} row(s), ${numCols} column(s)`),
        )),
    )
    ˍ.top_toolbar = html.div({ 'id': 'page_editor_top_toolbar', 'class': 'page-editor-top-toolbar', 'tabindex': -1 },
        html.div({ 'id': 'page_editor_top_toolbar_zoom', 'class': 'page-editor-top-toolbar-block' },
            ˍ.top_toolbar_zoom_input = html.input({
                'type': 'range', 'min': zoomMin, 'max': zoomMax, 'step': '0.5', 'value': orig_size_zoom_percent, 'onchange': (evt) =>
                    zoomSet(parseFloat(ˍ.top_toolbar_zoom_input.value))
            }),
            ˍ.top_toolbar_zoom_text = html.span({}, orig_size_zoom_percent + '%'),
            html.button({ 'class': 'btn', 'title': `Original size (${page_size.wMm / 10} × ${page_size.hMm / 10} cm)`, 'style': utils.codiconCss('screen-full'), 'onclick': () => zoomSet(orig_size_zoom_percent) }),
            html.button({ 'class': 'btn', 'title': `View size (${((page_size.wMm / 1.5) / 10).toFixed(1)} × ${((page_size.hMm / 1.5) / 10).toFixed(1)} cm)`, 'style': utils.codiconCss('preview'), 'onclick': () => zoomSet(orig_size_zoom_percent / 1.5) }),
            html.button({ 'class': 'btn', 'title': 'Fit into canvas', 'style': utils.codiconCss('screen-normal'), 'onclick': () => zoomSet() }),
        ),
        html.div({ 'class': 'page-editor-top-toolbar-block', },
            ˍ.top_toolbar_menu_addpanelgrid,
        ),
        html.div({ 'id': 'page_editor_top_toolbar_dbg', 'class': 'page-editor-top-toolbar-block page-editor-top-toolbar-block-right' },
            ˍ.top_toolbar_dbg_text = html.span({}, "...")),
        html.div({ 'class': 'page-editor-top-toolbar-block page-editor-top-toolbar-block-right' },
            ˍ.top_toolbar_mpos_text = html.span({}, " ")),
    )
    createPageCanvas()
    ˍ.panel_toolbar = ctl_paneltoolbar.create('page_editor_panel_toolbar', ˍ.page_canvas, (() => page), onUserModifiedPanel)
    ˍ.panelbar_left = ctl_paneledgebar.create('page_editor_panel_edgebar_left', ˍ.page_canvas, º.DirLeft)
    ˍ.panelbar_right = ctl_paneledgebar.create('page_editor_panel_edgebar_right', ˍ.page_canvas, º.DirRight)
    ˍ.panelbar_upper = ctl_paneledgebar.create('page_editor_panel_edgebar_upper', ˍ.page_canvas, º.DirUp)
    ˍ.panelbar_lower = ctl_paneledgebar.create('page_editor_panel_edgebar_lower', ˍ.page_canvas, º.DirDown)
    document.onkeydown = (evt: KeyboardEvent) => {
        switch (evt.key) {
            case 'Escape':
                ˍ.panel_toolbar.toggleDeletePrompt(false)
                break
            case '+':
            case '-':
                if (!(evt.shiftKey || evt.ctrlKey || evt.altKey || evt.metaKey)) {
                    evt.preventDefault()
                    zoomSet(zoomGet() + (5 * ((evt.key == '+') ? 1 : -1)))
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
                ˍ.page_canvas.panelSelect()
            }
        },
        'onclick': (evt: MouseEvent) => {
            if (evt.target, evt.currentTarget, evt.target === evt.currentTarget)
                ˍ.page_canvas.panelSelect()
        },
        'onauxclick': (evt: MouseEvent) => {
            ˍ.page_canvas.addNewPanel()
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
            const mm = mmFromPx(evt.clientX, evt.clientY, true, page_size)
            ˍ.page_canvas.xMm = mm.xPx
            ˍ.page_canvas.yMm = mm.yPx
            ˍ.top_toolbar_mpos_text.innerText = `X: ${(ˍ.page_canvas.xMm * 0.1).toFixed(1)} , Y:${(ˍ.page_canvas.yMm * 0.1).toFixed(1)}`
        },
    }, ˍ.page_canvas.dom, ˍ.panelbar_left.dom, ˍ.panelbar_right.dom, ˍ.panelbar_upper.dom, ˍ.panelbar_lower.dom)
    van.add(document.body, ˍ.main, ˍ.panel_toolbar.dom, ˍ.top_toolbar)
    zoomSet()
}

function mmFromPx(xPx: number, yPx: number, areUnzoomed: boolean, pageSize?: º.PageSize) {
    const zoom = zoomGet()
    xPx = ((100 / zoom) * xPx) - posX()
    yPx = ((100 / zoom) * yPx) - posY()
    const xfac = areUnzoomed ? (xPx / ˍ.page_canvas.dom!.clientWidth) : 1, yfac = areUnzoomed ? (yPx / ˍ.page_canvas.dom!.clientHeight) : 1
    if (!pageSize)
        pageSize = º.pageSizeMm(page)
    return { xPx: pageSize.wMm * xfac, yPx: pageSize.hMm * yfac }
}

function mmToPx(mmX: number, mmY: number, isPos: boolean, pageSize?: º.PageSize)/*: º.PageSize*/ {
    if (!pageSize)
        pageSize = º.pageSizeMm(page)
    const px_per_mm = ˍ.page_canvas.dom!.clientWidth / pageSize.wMm
    const x_off = isPos ? posX() : 0, y_off = isPos ? posY() : 0
    return { xPx: (px_per_mm * mmX) + x_off, xPy: (px_per_mm * mmY) + y_off }
}

function posX(newX?: number): number {
    if (newX !== undefined) {
        ˍ.page_canvas.dom!.style.left = newX.toString() + 'px'
        refreshPanelBars(true)
    }
    return parseInt(ˍ.page_canvas.dom!.style.left)
}
function posY(newY?: number): number {
    if (newY !== undefined) {
        ˍ.page_canvas.dom!.style.top = newY.toString() + 'px'
        refreshPanelBars(true)
    }
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
    refreshPanelBars(true)
}
