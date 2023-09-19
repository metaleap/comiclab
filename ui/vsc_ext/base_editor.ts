import * as vs from 'vscode'
import * as utils from './utils'
import * as app from './app'
import * as shared from './_shared_types'


const editors = new Map<string, WebviewPanel>();


export abstract class WebviewPanel {
    private readonly targetsCfg: boolean
    private readonly targetsProj: boolean
    private readonly viewTypeIdent: string
    private readonly codicon: string
    private webviewPanel: vs.WebviewPanel | null = null
    reuseKey: string = ''

    constructor(targetsProj: boolean, targetsCfg: boolean, viewTypeIdent: string, codicon: string) {
        this.targetsCfg = targetsCfg
        this.targetsProj = targetsProj
        this.viewTypeIdent = viewTypeIdent
        this.codicon = codicon
    }

    title() { return "TitleHere" }
    htmlUri(localUri: vs.Uri) { return (this.webviewPanel as vs.WebviewPanel).webview.asWebviewUri(localUri) }
    dirtyIndicator(): boolean {
        return (this.targetsCfg && app.dirtyCfg) || (this.targetsProj && app.dirtyProj)
    }
    refreshTitle() {
        if (this.webviewPanel)
            this.webviewPanel.title = this.title() + (this.dirtyIndicator() ? "*" : "")
    }

    onSaved() {
        this.refreshTitle()
    }
    onRefreshed() {
        this.refreshTitle()
        if (this.webviewPanel)
            this.webviewPanel.webview.postMessage(this.onRefreshedEventMessage())
                .then(() => { }, console.error)
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

    show() {
        if (this.webviewPanel)
            return this.webviewPanel.reveal(vs.ViewColumn.One)

        const on_refreshed = () => this.onRefreshed()
        const on_saved = () => this.onSaved()
        if (this.targetsCfg) {
            app.onCfgRefreshed.do(on_refreshed)
            app.onCfgSaved.do(on_saved)
        }
        if (this.targetsProj) {
            app.onProjRefreshed.do(on_refreshed)
            app.onProjSaved.do(on_saved)
        }
        utils.disp(this.webviewPanel = vs.window.createWebviewPanel(this.viewTypeIdent, this.title(), vs.ViewColumn.One, {
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
                        import * as main from '${this.htmlUri(utils.jsPath(this.viewTypeIdent))}'
                        main.onInit(acquireVsCodeApi(), '${this.htmlUri(vs.Uri.joinPath(utils.extUri, 'ui')).toString()}')
                    </script>
                </body></html>`
        utils.disp(this.webviewPanel.webview.onDidReceiveMessage((msg) => this.onMessage(msg)))
        this.webviewPanel.iconPath = utils.codiconPath(this.codicon)
        utils.disp(this.webviewPanel.onDidDispose(() => {
            if (this.targetsCfg) {
                app.onCfgRefreshed.dont(on_refreshed)
                app.onCfgSaved.dont(on_saved)
            }
            if (this.targetsProj) {
                app.onProjRefreshed.dont(on_refreshed)
                app.onProjSaved.dont(on_saved)
            }
            this.onDisposed()
        }))
        setTimeout(on_refreshed, 345) // below 3xx was sometimes to soon..
    }

    close() {
        if (this.webviewPanel)
            this.webviewPanel.dispose()
    }
    onDisposed() {
        this.webviewPanel = null
        editors.delete(this.reuseKey)
    }

}


export function show(reuseKey: string, newT: () => WebviewPanel) {
    let editor = editors.get(reuseKey)
    if (!editor) {
        editor = newT()
        editor.reuseKey = reuseKey
        editors.set(reuseKey, editor)
    }
    editor.show()
}

export function close(reuseKey: string) {
    const editor = editors.get(reuseKey)
    if (editor)
        editor.close()
}
