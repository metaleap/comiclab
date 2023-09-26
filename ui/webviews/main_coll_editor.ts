import van, { State, ChildDom } from './vanjs/van-1.2.1.debug.js'
import * as º from './_º.js'
import * as utils from './utils.js'

import * as ctl_tabs from './ctl/tabs.js'
import * as ctl_multipanel from './ctl/multipanel.js'
import * as ctl_propsform from './propsform.js'

const html = van.tags


let collPath: string = ''


let main_tabs: ChildDom
let props_form: ctl_propsform.PropsForm

export function onInit(editorReuseKeyDerivedCollPath: string, vscode: { postMessage: (_: any) => any }, extUri: string, vscCfgSettings: object, appState: º.AppState) {
    utils.onInit(vscode, extUri, vscCfgSettings, appState)
    collPath = editorReuseKeyDerivedCollPath
    props_form = ctl_propsform.create('coll_editor_props', collPath, '', undefined,
        (userModifiedCollProps?: º.CollProps, userModifiedPageProps?: º.PageProps, userModifiedPanelProps?: º.PanelProps) => {
            setDisabled(true)
            const coll = º.collFromPath(collPath) as º.Collection
            if (userModifiedCollProps)
                coll.collProps = userModifiedCollProps
            if (userModifiedPageProps)
                coll.pageProps = userModifiedPageProps
            if (userModifiedPanelProps)
                coll.panelProps = userModifiedPanelProps
            utils.vs.postMessage({ ident: 'onCollModified', payload: coll })
        })
    main_tabs = ctl_tabs.create('coll_editor_main', {
        "Details": props_form.dom,
        "Preview": html.div('(TODO)'),
    })
    onAppStateRefreshed()
    van.add(document.body, main_tabs)
    window.addEventListener('message', onMessage)
}

function setDisabled(disabled: boolean) {
    (main_tabs as HTMLElement).style.visibility = disabled ? 'hidden' : 'visible'
}

function onAppStateRefreshed(newAppState?: º.AppState) {
    if (newAppState) {
        if (newAppState.config)
            º.appState.config = newAppState.config
        if (newAppState.proj)
            º.appState.proj = newAppState.proj
    }
    props_form.refresh()
    setDisabled(false)
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
