import * as vs from 'vscode'
import * as º from './_º'
import * as utils from './utils'
import * as app from './app'


export const editors: { [_: string]: WebviewPanel } = {};
export const reuseKeySep = ':'


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
        return this.targetsProj ? app.dirtyProj : app.dirtyCfg
    }
    refreshTitle() {
        if (this.webviewPanel)
            this.webviewPanel.title = this.title() + (this.dirtyIndicator() ? "*" : "")
    }

    onSaved(evt: app.StateEvent) {
        if ((evt.cfg && this.targetsCfg) || (evt.proj && this.targetsProj))
            this.refreshTitle()
    }
    onRefreshed(evt: app.StateEvent, isStartup?: boolean) {
        this.refreshTitle()
        if (this.webviewPanel && ((evt.cfg && this.targetsCfg) || (evt.proj && this.targetsProj))) {
            const msg = this.onRefreshedEventMessage(evt)
            if (msg)
                this.webviewPanel.webview.postMessage(msg).then(() => { }, (fail) => utils.alert(fail))
            else if (isStartup)
                utils.alert("NEW BUG: no onRefreshedEventMessage() on base_editor init")
        } else if (isStartup)
            utils.alert("NEW BUG: no onRefreshedEventMessage() conditions on base_editor init")
    }
    abstract onRefreshedEventMessage(evt: app.StateEvent): any;

    onMessage(msg: any) {
        switch (msg.ident) {
            case 'alert':
                utils.alert(msg.payload as string)
                break
            default:
                vs.window.showInformationMessage(JSON.stringify(msg))
        }
    }

    show() {
        if (this.webviewPanel)
            return this.webviewPanel.reveal(vs.ViewColumn.One)

        const on_refreshed = (_: app.StateEvent) => this.onRefreshed(_)
        const on_saved = (_: app.StateEvent) => this.onSaved(_)
        app.events.saved.on(on_saved)
        app.events.refreshed.on(on_refreshed)
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
                        main.onInit('${this.reuseKey.substring(this.reuseKey.indexOf(reuseKeySep) + 1)}', acquireVsCodeApi(), '${this.htmlUri(utils.extUri).toString()}', ${JSON.stringify(vs.workspace.getConfiguration().get("comiclab"))})
                    </script>
                </body></html>`
        utils.disp(this.webviewPanel.webview.onDidReceiveMessage((msg) => this.onMessage(msg)))
        this.webviewPanel.iconPath = utils.codiconPath(this.codicon)
        utils.disp(this.webviewPanel.onDidDispose(() => {
            if (this.targetsCfg) {
                app.events.refreshed.no(on_refreshed)
                app.events.saved.no(on_saved)
            }
            if (this.targetsProj) {
                app.events.refreshed.no(on_refreshed)
                app.events.saved.no(on_saved)
            }
            this.onDisposed()
        }))
        this.onRefreshed({ proj: true, cfg: true, from: { reload: true } }, true)
    }

    close() {
        if (this.webviewPanel)
            this.webviewPanel.dispose()
    }
    onDisposed() {
        this.webviewPanel = null
        delete editors[this.reuseKey]
    }

}


export function show(reuseKey: string, newT: () => WebviewPanel) {
    let editor = editors[reuseKey]
    if (!editor) {
        editor = newT()
        editor.reuseKey = reuseKey
        editors[reuseKey] = editor
    }
    editor.show()
}

export function close(reuseKey: string) {
    const editor = editors[reuseKey]
    if (editor)
        editor.close()
}

export function isOpen(reuseKey: string) {
    return editors[reuseKey] ? true : false
}
