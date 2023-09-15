import * as vs from 'vscode'
import * as utils from './utils'

export class ConfigView implements vs.WebviewViewProvider {
    webView?: vs.WebviewView

    constructor(readonly extUri: vs.Uri) { }

    resolveWebviewView(webviewView: vs.WebviewView, _: vs.WebviewViewResolveContext<unknown>) {
        this.webView = webviewView
        this.webView.description = "The Description"
        this.webView.title = "ComicLab Configuration"
        webviewView.webview.options = {
            enableCommandUris: true,
            enableForms: true,
            enableScripts: true,
            localResourceRoots: [this.extUri]
        }
        webviewView.webview.html = '<html><style>body { font-size: 1.11em }</style><body>hello <b>world</b></body></html>'
        webviewView.webview.onDidReceiveMessage(data => {
            vs.window.showInformationMessage(JSON.stringify(data))
        })
    }
}
