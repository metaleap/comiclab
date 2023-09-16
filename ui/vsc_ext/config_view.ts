import * as vs from 'vscode'
import * as utils from './utils'
import { State, Config, subscribe, unsubscribe } from './_shared_types'


let configWebviewPanel: vs.WebviewPanel | null

function onCfgReloaded(appState: State) {
    if (configWebviewPanel)
        configWebviewPanel.webview.postMessage({ ident: 'onAppStateCfgChanged', payload: appState.config })
            .then(() => { }, console.error)
}

export function show(appState: State, onModified: (_: Config) => void) {
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
                    main.onInitConfigView(acquireVsCodeApi(), '${htmlUri(vs.Uri.joinPath(utils.extUri, 'ui'))?.toString()}')
                </script>
            </body></html>`
    utils.disp(configWebviewPanel.webview.onDidReceiveMessage(msg => {
        switch (msg.ident) {
            case 'appStateCfgModified':
                onModified(msg.payload as Config)
                break
            default:
                vs.window.showInformationMessage(JSON.stringify(msg))
        }
    }))
    configWebviewPanel.iconPath = utils.iconPath('screwdriver-wrench')
    utils.disp(configWebviewPanel.onDidDispose(() => {
        unsubscribe(appState.onCfgReloaded, onCfgReloaded)
        configWebviewPanel = null
    }))
    setTimeout(() => onCfgReloaded(appState), 234)
}

function htmlUri(localUri: vs.Uri) {
    return configWebviewPanel?.webview.asWebviewUri(localUri)
}
