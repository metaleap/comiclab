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
                <style>body { font-size: 1.11em }</style>
                <script>
                    const vs = acquireVsCodeApi()
                </script>
            </head><body>
                <b>Config</b> Webview
                <hr>
                <textarea height='77' width='90%' id='tmp'></textarea>
                <script>
                    vs.postMessage({'digit':'dis ROX'})
                    window.addEventListener('message', (evt) => {
                        document.getElementById('tmp').innerText = JSON.stringify(evt.data)
                    })
                </script>
            </body></html>`
}

function htmlUri(localUri: vs.Uri) {
    return configWebviewPanel?.webview.asWebviewUri(localUri)
}
