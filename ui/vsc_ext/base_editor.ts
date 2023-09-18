import * as vs from 'vscode'
import * as utils from './utils'
import * as app from './app'
import * as shared from './_shared_types'


export abstract class WebviewPanel {
    private webviewPanel: vs.WebviewPanel | null = null

    title() { return "TitleHere" }
    htmlUri(localUri: vs.Uri) {
        console.log("URI", localUri, this.webviewPanel ? "YO" : "NO")
        return (this.webviewPanel as vs.WebviewPanel).webview.asWebviewUri(localUri)
    }

    onSaved() {
        if (this.webviewPanel)
            this.webviewPanel.title = this.title()
    }

    onRefreshed() {
        if (this.webviewPanel) {
            this.webviewPanel.webview.postMessage(this.onRefreshedEventMessage())
                .then(() => { }, console.error)
            this.webviewPanel.title = this.title()
        }
    }
    abstract onRefreshedEventMessage(): any;

    onMessage(msg: any) {
        switch (msg.ident) {
            case 'alert':
                vs.window.showWarningMessage(msg.payload as string, { modal: true })
                break
            default:
                vs.window.showInformationMessage(JSON.stringify(msg))
        }
    }

    show(proj: boolean, cfg: boolean, viewTypeIdent: string, codicon: string) {
        if (cfg) {
            app.onCfgRefreshed.do(() => this.onRefreshed())
            app.onCfgSaved.do(this.onSaved)
        }
        if (proj) {
            app.onProjRefreshed.do(this.onRefreshed)
            app.onProjSaved.do(this.onSaved)
        }
        if (this.webviewPanel)
            return this.webviewPanel.reveal(vs.ViewColumn.One)

        utils.disp(this.webviewPanel = vs.window.createWebviewPanel(viewTypeIdent, this.title(), vs.ViewColumn.One, {
            retainContextWhenHidden: true,
            enableCommandUris: true,
            enableFindWidget: true,
            enableForms: true,
            enableScripts: true,
            localResourceRoots: [utils.extUri, utils.homeDirPath]
        }))
        this.webviewPanel.webview.html = `<!DOCTYPE html>
                <html><head>
                    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link rel='stylesheet' type='text/css' href='${this.htmlUri(utils.cssPath('reset'))}'>
                    <link rel='stylesheet' type='text/css' href='${this.htmlUri(utils.cssPath('vscode'))}'>
                    <link rel='stylesheet' type='text/css' href='${this.htmlUri(utils.cssPath('main'))}'>
                </head><body>
                    <script type='module'>
                        import * as main from '${this.htmlUri(utils.jsPath(viewTypeIdent))}'
                        main.onInit(acquireVsCodeApi(), '${this.htmlUri(vs.Uri.joinPath(utils.extUri, 'ui')).toString()}')
                    </script>
                </body></html>`
        utils.disp(this.webviewPanel.webview.onDidReceiveMessage(this.onMessage))
        this.webviewPanel.iconPath = utils.codiconPath(codicon)
        utils.disp(this.webviewPanel.onDidDispose(() => {
            if (cfg) {
                app.onCfgRefreshed.dont(this.onRefreshed)
                app.onCfgSaved.dont(this.onSaved)
            }
            if (proj) {
                app.onProjRefreshed.dont(this.onRefreshed)
                app.onProjSaved.dont(this.onSaved)
            }
            this.webviewPanel = null
        }))
        setTimeout(this.onRefreshed, 345) // below 3xx was sometimes to soon..
    }

}
