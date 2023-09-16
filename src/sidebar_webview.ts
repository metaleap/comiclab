import * as vs from 'vscode'
import * as utils from './utils'

export class SidebarWebViewProvider implements vs.WebviewViewProvider {
    webView?: vs.WebviewView

    resolveWebviewView(webviewView: vs.WebviewView, _: vs.WebviewViewResolveContext<unknown>) {
        this.webView = webviewView
        this.webView.title = "Sidebar Webview!"
        webviewView.webview.options = {
            enableCommandUris: true,
            enableForms: true,
            enableScripts: true,
            localResourceRoots: [utils.extUri]
        }
        webviewView.webview.html = '<html><style>body { font-size: 1.11em }</style><body><b>Side</b> Webview</body></html>'
        webviewView.webview.onDidReceiveMessage(data => {
            vs.window.showInformationMessage(JSON.stringify(data))
        })
    }
}
