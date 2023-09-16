import * as vs from 'vscode'
import * as utils from './utils'

let configWebviewPanel: vs.WebviewPanel | null

export function show() {
    if (configWebviewPanel)
        configWebviewPanel.reveal(vs.ViewColumn.One)
    else {
        utils.disp(configWebviewPanel = vs.window.createWebviewPanel('comicLabConfig', 'The Title', vs.ViewColumn.One, { retainContextWhenHidden: true }))
        configWebviewPanel.onDidDispose(() => { configWebviewPanel = null })
        configWebviewPanel.iconPath = utils.iconPath('screwdriver-wrench')
        configWebviewPanel.webview.options = {
            enableCommandUris: true,
            enableForms: true,
            enableScripts: true,
            localResourceRoots: [utils.extUri]
        }
        configWebviewPanel.webview.onDidReceiveMessage(data => {
            vs.window.showInformationMessage(JSON.stringify(data))
        })
        configWebviewPanel.webview.html = '<html><style>body { font-size: 1.11em }</style><body><b>Config</b> Webview</body></html>'
    }
}
