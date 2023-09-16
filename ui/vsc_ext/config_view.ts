import * as vs from 'vscode'
import * as utils from './utils'
import { State, subscribe } from './_shared_types'


let configWebviewPanel: vs.WebviewPanel | null

function onCfgReloaded(appState: State): Thenable<boolean> {
    return configWebviewPanel ?
        configWebviewPanel.webview.postMessage({ ident: 'onAppStateCfgChanged', payload: appState.config })
        : utils.thenNow(false)
}

export function show(appState: State) {
    subscribe(appState.onCfgReloaded, onCfgReloaded)
    if (configWebviewPanel)
        return configWebviewPanel.reveal(vs.ViewColumn.One)

    utils.disp(configWebviewPanel = vs.window.createWebviewPanel('comicLabConfig', 'ComicLab Config', vs.ViewColumn.One, {
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
                    main.onInitConfigView(acquireVsCodeApi())
                </script>
            </body></html>`
    utils.disp(configWebviewPanel.webview.onDidReceiveMessage(data => {
        vs.window.showInformationMessage(JSON.stringify(data))
    }))
    configWebviewPanel.iconPath = utils.iconPath('screwdriver-wrench')
    onCfgReloaded(appState).then((b) => vs.window.showInformationMessage(b.toString()), (r) => vs.window.showErrorMessage(r.toString()))
    utils.disp(configWebviewPanel.onDidDispose(() => { configWebviewPanel = null }))
}

function htmlUri(localUri: vs.Uri) {
    return configWebviewPanel?.webview.asWebviewUri(localUri)
}
