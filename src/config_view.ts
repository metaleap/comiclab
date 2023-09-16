import * as vs from 'vscode'
import * as utils from './utils'

import { provideVSCodeDesignSystem, vsCodeButton } from "@vscode/webview-ui-toolkit"

let configWebviewPanel: vs.WebviewPanel | null

export function onInit() {
    provideVSCodeDesignSystem().register(vsCodeButton())
}

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
                <hr>
                <button>Click Dat</button>
                <hr>
                <input type='checkbox' id='chk'><label for='chk'>Check it</label>
                <hr>
                <input type='radio' id='rad'><label for='rad'>Rad it</label>
                <hr>
                <input type='text' id='txt'><label for='txt'>Text it</label>
                <hr>
                <select><option>Select Dis</option><option>Select Dat</option></select>
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
