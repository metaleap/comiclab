import * as vs from 'vscode'
import * as utils from './utils'


let configWebviewPanel: vs.WebviewPanel | null


export function show(appState: any) {
    if (configWebviewPanel)
        return configWebviewPanel.reveal(vs.ViewColumn.One)

    utils.disp(configWebviewPanel = vs.window.createWebviewPanel('comicLabConfig', 'ComicLab Config', vs.ViewColumn.One, {
        retainContextWhenHidden: true,
        enableCommandUris: true,
        enableFindWidget: false,
        enableForms: true,
        enableScripts: true,
        localResourceRoots: [],
    }))
    configWebviewPanel.onDidDispose(() => { configWebviewPanel = null })
    configWebviewPanel.iconPath = utils.iconPath('screwdriver-wrench')
    configWebviewPanel.webview.options = {
        enableCommandUris: true,
        enableForms: true,
        enableScripts: true,
        localResourceRoots: [utils.extUri, utils.homeDirPath]
    }
    configWebviewPanel.webview.onDidReceiveMessage(data => {
        vs.window.showInformationMessage(JSON.stringify(data))
    })
    configWebviewPanel.webview.html = `<!DOCTYPE html>
            <html><head>
                <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel='stylesheet' type='text/css' href='${htmlUri(utils.cssPath('reset'))}'>
                <link rel='stylesheet' type='text/css' href='${htmlUri(utils.cssPath('vscode'))}'>
                <link rel='stylesheet' type='text/css' href='${htmlUri(utils.cssPath('main'))}'>
                </head><body>
                <b>Config</b> Webview
                <script type='module'>
                import * as main from '${htmlUri(utils.jsPath('config-main'))}'
                main.onInitConfigView(acquireVsCodeApi())
                </script>
            </body></html>`
}

function htmlUri(localUri: vs.Uri) {
    return configWebviewPanel?.webview.asWebviewUri(localUri)
}
