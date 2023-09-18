import * as vs from 'vscode'
import * as utils from './utils'
import * as app from './app'
import * as shared from './_shared_types'


let configWebviewPanel: vs.WebviewPanel | null

function onCfgSaved(appState: shared.State) {
    if (configWebviewPanel)
        configWebviewPanel.title = title()
}

function onCfgRefreshed(appState: shared.State) {
    if (configWebviewPanel) {
        configWebviewPanel.webview.postMessage({ ident: 'onAppStateCfgRefreshed', payload: appState.config })
            .then(() => { }, console.error)
        configWebviewPanel.title = title()
    }
}

function title() {
    console.log(app.dirtyCfg)
    let ret = "ComicLab Config"
    if (app.dirtyCfg)
        ret += "*"
    return ret
}

export function show() {
    shared.subscribe(shared.appState.onCfgRefreshed, onCfgRefreshed)
    shared.subscribe(shared.appState.onCfgSaved, onCfgSaved)
    if (configWebviewPanel)
        return configWebviewPanel.reveal(vs.ViewColumn.One)

    utils.disp(configWebviewPanel = vs.window.createWebviewPanel('comicLabConfig', title(), vs.ViewColumn.One, {
        retainContextWhenHidden: true,
        enableCommandUris: true,
        enableFindWidget: false,
        enableForms: true,
        enableScripts: true,
        localResourceRoots: [utils.extUri, utils.homeDirPath]
    }))
    configWebviewPanel.webview.html = `<!DOCTYPE html>
            <html><head>
                <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel='stylesheet' type='text/css' href='${htmlUri(utils.cssPath('reset'))}'>
                <link rel='stylesheet' type='text/css' href='${htmlUri(utils.cssPath('vscode'))}'>
                <link rel='stylesheet' type='text/css' href='${htmlUri(utils.cssPath('main'))}'>
            </head><body>
                <script type='module'>
                    import * as main from '${htmlUri(utils.jsPath('config-main'))}'
                    main.onInitConfigView(acquireVsCodeApi(), '${htmlUri(vs.Uri.joinPath(utils.extUri, 'ui')).toString()}')
                </script>
            </body></html>`
    utils.disp(configWebviewPanel.webview.onDidReceiveMessage(onMessage))
    configWebviewPanel.iconPath = utils.codiconPath('tools')
    utils.disp(configWebviewPanel.onDidDispose(() => {
        shared.unsubscribe(shared.appState.onCfgRefreshed, onCfgRefreshed)
        configWebviewPanel = null
    }))
    setTimeout(() => onCfgRefreshed(shared.appState), 345)
}

function onMessage(msg: any) {
    switch (msg.ident) {
        case 'alert':
            vs.window.showWarningMessage(msg.payload as string, { modal: true })
            break
        case 'appStateCfgModified':
            (configWebviewPanel as vs.WebviewPanel).title = title()
            shared.trigger(shared.appState.onCfgModified, msg.payload as shared.Config)
            break
        default:
            vs.window.showInformationMessage(JSON.stringify(msg))
    }
}

function htmlUri(localUri: vs.Uri) {
    return (configWebviewPanel as vs.WebviewPanel).webview.asWebviewUri(localUri)
}