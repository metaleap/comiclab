import van from './vanjs/van-1.2.1.debug.js'
import * as º from './_º.js'
import * as utils from './utils.js'
import * as ctl_pagecanvas from './pagecanvas.js'
import * as ctl_shapetoolbar from './shapetoolbar.js'
import * as ctl_shapeedgebar from './shapeedgebar.js'
import * as dialog_props from './dialog_props.js'


const html = van.tags
const zoomMin = 0.5
const zoomMax = 321.5


let pagePath: string = ''

let ˍ: {
    main: HTMLDivElement,
    page_canvas: ctl_pagecanvas.PageCanvas,
    top_toolbar: HTMLDivElement, top_toolbar_mpos_text: HTMLSpanElement,
    top_toolbar_zoom_text: HTMLSpanElement,
    top_toolbar_zoom_input: HTMLInputElement,
    top_toolbar_menu_addpanelgrid: HTMLSelectElement,
    shape_toolbar: ctl_shapetoolbar.ShapeToolbar,
    shapebar_left: ctl_shapeedgebar.ShapeEdgeBar,
    shapebar_right: ctl_shapeedgebar.ShapeEdgeBar,
    shapebar_upper: ctl_shapeedgebar.ShapeEdgeBar,
    shapebar_lower: ctl_shapeedgebar.ShapeEdgeBar,
    panel_textareas: HTMLDivElement[],
    props_dialog?: dialog_props.PropsDialog,
} = { panel_textareas: [] } as any

export function onInit(editorReuseKeyDerivedPagePath: string, vscode: { postMessage: (_: any) => any }, extUri: string, vscCfg: object, appState: º.AppState) {
    utils.onInit(vscode, extUri, vscCfg, appState)
    pagePath = editorReuseKeyDerivedPagePath
    onAppStateRefreshed()
    window.addEventListener('message', onMessage)
}

function onUserModifiedPage(userModifiedPage?: º.Page, reRender?: boolean, preserveShapeToolbar?: boolean): º.Page {
    if (userModifiedPage)
        º.pageUpdate(pagePath, userModifiedPage)
    else
        userModifiedPage = º.pageFromPath(pagePath)!
    if (reRender)
        reRenderPageCanvas(preserveShapeToolbar)
    else
        refreshShapeWidgets(preserveShapeToolbar)
    if (ˍ.page_canvas.sel && !preserveShapeToolbar)
        document.getElementById((ˍ.page_canvas.sel.isBalloon ? 'balloon_' : 'panel_') + ˍ.page_canvas.sel.idx)?.focus()
    utils.vs.postMessage({ ident: 'onPageModified', payload: userModifiedPage })
    return userModifiedPage
}

function onShapeSelection() {
    refreshShapeWidgets()
}

function refreshShapeWidgets(skipToolbar?: boolean) {
    for (const textarea of ˍ.panel_textareas)
        textarea.remove()
    const page = º.pageFromPath(pagePath)!
    const page_size = º.pageSizeMm(page)
    ˍ.panel_textareas = page.panels.map((panel, pIdx) => {
        const px_pos = mmToPx(panel.x, panel.y, true, page_size)
        const px_size = mmToPx(panel.w, panel.h, false, page_size)
        const pad = 11
        const visible = (!ˍ.page_canvas.sel) || ((!ˍ.page_canvas.sel.isBalloon) && (ˍ.page_canvas.sel.idx === pIdx))
        const textarea = html.div({
            'class': 'page-editor-textarea', 'style':
                `visibility: ${visible ? 'visible' : 'hidden'}; left: ${px_pos.x + pad}px; top: ${px_pos.y + pad}px; width: ${px_size.x - (2 * pad)}px; height: ${px_size.y - (2 * pad)}px;`,
            'onclick': (evt: MouseEvent) => {
                const dom = ˍ.panel_textareas[pIdx].firstChild as HTMLElement
                if (!dom.hasAttribute('contenteditable'))
                    ˍ.page_canvas.select(ˍ.page_canvas.whatsAt())
            },
        }, html.div({
            'class': 'page-editor-textarea',
            'onblur': (evt: Event) => {
                const dom = evt.target as HTMLElement
                dom.removeAttribute('contenteditable')
                if (panel.text != dom.innerText) {
                    panel.text = dom.innerText
                    onUserModifiedPage(undefined, true)
                }
            },
        }, panel.text ?? ''))
        return textarea
    })
    van.add(ˍ.main, ...ˍ.panel_textareas)

    if (!skipToolbar)
        ˍ.shape_toolbar.refresh()
    for (const panel_bar of [ˍ.shapebar_left, ˍ.shapebar_right, ˍ.shapebar_upper, ˍ.shapebar_lower])
        panel_bar.refresh() // do this before the below, so we'll have a non-0 clientWidth

    if (ˍ.page_canvas.sel) { // positioning the panel bar right on its assigned panel edge
        const shapes: º.Shape[] = (ˍ.page_canvas.sel.isBalloon) ? page.balloons : page.panels
        const shape: º.Shape = shapes[ˍ.page_canvas.sel.idx]
        const shape_px_pos = mmToPx(shape.x, shape.y, true, page_size)
        const shape_px_size = mmToPx(shape.w, shape.h, false, page_size)

        ˍ.shapebar_upper.dom.style.left = ((shape_px_pos.x + (shape_px_size.x / 2)) - (ˍ.shapebar_upper.dom.clientWidth / 2)).toFixed(0) + 'px'
        ˍ.shapebar_lower.dom.style.left = ˍ.shapebar_upper.dom.style.left
        ˍ.shapebar_upper.dom.style.top = (shape_px_pos.y - 12).toFixed(0) + 'px'
        ˍ.shapebar_lower.dom.style.top = (shape_px_pos.y + shape_px_size.y).toFixed(0) + 'px'

        ˍ.shapebar_left.dom.style.top = ((shape_px_pos.y + (shape_px_size.y / 2)) - (ˍ.shapebar_left.dom.clientHeight / 2)).toFixed(0) + 'px'
        ˍ.shapebar_right.dom.style.top = ˍ.shapebar_left.dom.style.top
        ˍ.shapebar_left.dom.style.left = (shape_px_pos.x - 12).toFixed(0) + 'px'
        ˍ.shapebar_right.dom.style.left = (shape_px_pos.x + shape_px_size.x).toFixed(0) + 'px'
    }
}

function onAppStateRefreshed(newAppState?: º.AppState) {
    const old_page = º.pageFromPath(pagePath)!
    const old_pageprops = º.pageProps(old_page) // has the coll-level and project-level prop vals where no page-level overrides
    const old_panelprops = º.panelProps(old_page) // dito as above
    const old_balloonprops = º.balloonProps(old_page) // dito

    if (newAppState) {
        if (newAppState.config)
            º.appState.config = newAppState.config
        if (newAppState.proj)
            º.appState.proj = newAppState.proj
    }

    const new_page = º.pageFromPath(pagePath) as º.Page
    const new_panelprops = º.panelProps(new_page) // dito as above
    const new_balloonprops = º.balloonProps(new_page) // dito
    const new_pageprops = º.pageProps(new_page) // dito
    const page_changed = !º.deepEq(old_page, new_page)
    º.pageUpdate(pagePath, new_page)
    if (!ˍ.main)
        createGui()
    else if (page_changed || (!º.deepEq(old_pageprops, new_pageprops)) || (!º.deepEq(old_panelprops, new_panelprops)) || (!º.deepEq(old_balloonprops, new_balloonprops)))
        reRenderPageCanvas()
    if (ˍ.props_dialog)
        ˍ.props_dialog.refresh()
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

function reRenderPageCanvas(preserveShapeToolbar?: boolean) {
    const old_x = posX(), old_y = posY(), old_dom = ˍ.page_canvas.dom, old_mouse_pos = ˍ.page_canvas.mousePosMm
    createPageCanvas(ˍ.page_canvas.sel)
    ˍ.page_canvas.mousePosMm = old_mouse_pos
    old_dom!.replaceWith(ˍ.page_canvas.dom!)
    refreshShapeWidgets(preserveShapeToolbar)
    posX(old_x)
    posY(old_y)
}

function createPageCanvas(sel?: º.ShapeRef) {
    const page = º.pageFromPath(pagePath)!
    ˍ.page_canvas = ctl_pagecanvas.create('page_editor_canvas', page, onShapeSelection, sel, onUserModifiedPage)
    for (const panelbar of [ˍ.shape_toolbar, ˍ.shapebar_left, ˍ.shapebar_right, ˍ.shapebar_upper, ˍ.shapebar_lower])
        if (panelbar)
            panelbar.canvas = ˍ.page_canvas
}

function createGui() {
    const orig_size_zoom_percent: number = (utils.vscCfg && utils.vscCfg['pageEditorDefaultZoom']) ? (utils.vscCfg['pageEditorDefaultZoom'] as number) : 122.5
    const page_size_mm = º.pageSizeMm(º.pageFromPath(pagePath)!)
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
            html.button({ 'class': 'btn', 'title': `Original size (${page_size_mm.w / 10} × ${page_size_mm.h / 10} cm)`, 'style': utils.codiconCss('screen-full'), 'onclick': () => zoomSet(orig_size_zoom_percent) }),
            html.button({ 'class': 'btn', 'title': `View size (${((page_size_mm.w / 1.5) / 10).toFixed(1)} × ${((page_size_mm.h / 1.5) / 10).toFixed(1)} cm)`, 'style': utils.codiconCss('preview'), 'onclick': () => zoomSet(orig_size_zoom_percent / 1.5) }),
            html.button({ 'class': 'btn', 'title': 'Fit into canvas', 'style': utils.codiconCss('screen-normal'), 'onclick': () => zoomSet() }),
        ),
        html.div({ 'class': 'page-editor-top-toolbar-block', },
            ˍ.top_toolbar_menu_addpanelgrid,
        ),
        html.div({ 'class': 'page-editor-top-toolbar-block page-editor-top-toolbar-block-right' },
            ˍ.top_toolbar_mpos_text = html.span({}, " ")),
    )
    createPageCanvas()
    ˍ.shape_toolbar = ctl_shapetoolbar.create('page_editor_shape_toolbar', ˍ.page_canvas, (() => º.pageFromPath(pagePath)!),
        (preserveShapeToolbar: boolean) => {
            onUserModifiedPage(undefined, true, preserveShapeToolbar)
        })
    ˍ.shapebar_left = ctl_shapeedgebar.create('page_editor_shape_edgebar_left', ˍ.page_canvas, º.DirLeft)
    ˍ.shapebar_right = ctl_shapeedgebar.create('page_editor_shape_edgebar_right', ˍ.page_canvas, º.DirRight)
    ˍ.shapebar_upper = ctl_shapeedgebar.create('page_editor_shape_edgebar_upper', ˍ.page_canvas, º.DirUp)
    ˍ.shapebar_lower = ctl_shapeedgebar.create('page_editor_shape_edgebar_lower', ˍ.page_canvas, º.DirDown)
    document.onkeydown = (evt: KeyboardEvent) => {
        switch (evt.key) {
            case 'Escape':
                ˍ.shape_toolbar.toggleDeletePrompt(false)
                if (ˍ.page_canvas.sel && !ˍ.page_canvas.sel.isBalloon) {
                    const dom = ˍ.panel_textareas[ˍ.page_canvas.sel.idx].firstChild as HTMLElement
                    dom.blur()
                }
                break
            case '+':
            case '-':
                if (!(evt.shiftKey || evt.ctrlKey || evt.altKey || evt.metaKey)) {
                    evt.preventDefault()
                    zoomSet(zoomGet() + (5 * ((evt.key == '+') ? 1 : -1)))
                }
                break
            case 'F2':
                if (ˍ.page_canvas.sel && !ˍ.page_canvas.sel.isBalloon) {
                    const dom = ˍ.panel_textareas[ˍ.page_canvas.sel.idx].firstChild as HTMLElement
                    if (!dom.hasAttribute('contenteditable')) {
                        dom.setAttribute('contenteditable', 'true')
                        window.getSelection()?.selectAllChildren(dom)
                    }
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
                ˍ.page_canvas.select(undefined, undefined)
                if (evt.shiftKey)
                    ˍ.page_canvas.addNewBalloon()
                else
                    ˍ.page_canvas.addNewPanel()
            }
        },
        'onclick': (evt: MouseEvent) => { // ensure canvas shape deselection when clicking outside the page
            const at_mouse_pos = ˍ.page_canvas.whatsAt()
            if (!at_mouse_pos)
                ˍ.page_canvas.select(undefined)
        },
        'onauxclick': (evt: PointerEvent) => {
            if (evt.button === 2) // right-click
                ˍ.props_dialog = dialog_props.show('page_editor_props_dialog', º.pageFromPath(pagePath)!, ˍ.page_canvas,
                    () => { ˍ.props_dialog = undefined },
                    (userModifiedPageProps?: º.PageProps, userModifiedPanelProps?: º.PanelProps, userModifiedBalloonProps?: º.BalloonProps, sel?: º.ShapeRef) => {
                        const page = º.pageFromPath(pagePath)!
                        if (userModifiedPageProps || userModifiedPanelProps || userModifiedBalloonProps) {
                            if (userModifiedPageProps)
                                page.pageProps = userModifiedPageProps
                            if (userModifiedPanelProps)
                                ((sel && !sel.isBalloon) ? page.panels[sel.idx] : page).panelProps = userModifiedPanelProps
                            if (userModifiedBalloonProps)
                                ((sel?.isBalloon) ? page.balloons[sel.idx] : page).balloonProps = userModifiedBalloonProps
                            onUserModifiedPage(undefined, true)
                        }
                    })
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
        'onmouseleave': (evt: Event) => {
            ˍ.page_canvas.mousePosMm = undefined
            ˍ.top_toolbar_mpos_text.innerHTML = 'Some mouse-out info text here?'
        },
        'onmousemove': (evt: MouseEvent) => {
            ˍ.page_canvas.mousePosMm = mmFromPx(evt.clientX, evt.clientY, true, page_size_mm)
            ˍ.top_toolbar_mpos_text.innerText = `X: ${(ˍ.page_canvas.mousePosMm.x * 0.1).toFixed(1)}cm , Y:${(ˍ.page_canvas.mousePosMm.y * 0.1).toFixed(1)}cm`
        },
    }, ˍ.page_canvas.dom, ˍ.shapebar_left.dom, ˍ.shapebar_right.dom, ˍ.shapebar_upper.dom, ˍ.shapebar_lower.dom)
    van.add(document.body, ˍ.main, ˍ.shape_toolbar.dom, ˍ.top_toolbar)
    zoomSet()
}

function mmFromPx(xPx: number, yPx: number, areUnzoomed: boolean, pageSizeMm?: º.Size) {
    const zoom = zoomGet()
    xPx = ((100 / zoom) * xPx) - posX()
    yPx = ((100 / zoom) * yPx) - posY()
    const xfac = areUnzoomed ? (xPx / ˍ.page_canvas.dom!.clientWidth) : 1, yfac = areUnzoomed ? (yPx / ˍ.page_canvas.dom!.clientHeight) : 1
    if (!pageSizeMm)
        pageSizeMm = º.pageSizeMm(º.pageFromPath(pagePath)!)
    return { x: pageSizeMm.w * xfac, y: pageSizeMm.h * yfac }
}

function mmToPx(mmX: number, mmY: number, isPos: boolean, pageSizeMm?: º.Size) {
    if (!pageSizeMm)
        pageSizeMm = º.pageSizeMm(º.pageFromPath(pagePath)!)
    const x_px_per_mm = ˍ.page_canvas.dom!.clientWidth / pageSizeMm.w, y_px_per_mm = ˍ.page_canvas.dom!.clientHeight / pageSizeMm.h
    const x_off = isPos ? posX() : 0, y_off = isPos ? posY() : 0
    return { x: (x_px_per_mm * mmX) + x_off, y: (y_px_per_mm * mmY) + y_off }
}

function posX(newX?: number): number {
    if (newX !== undefined) {
        ˍ.page_canvas.dom!.style.left = newX.toString() + 'px'
        refreshShapeWidgets(true)
    }
    return parseInt(ˍ.page_canvas.dom!.style.left)
}
function posY(newY?: number): number {
    if (newY !== undefined) {
        ˍ.page_canvas.dom!.style.top = newY.toString() + 'px'
        refreshShapeWidgets(true)
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
    refreshShapeWidgets(true)
}
