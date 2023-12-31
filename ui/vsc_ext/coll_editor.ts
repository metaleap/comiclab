import * as vs from 'vscode'
import * as º from './_º'
import * as utils from './utils'
import * as app from './app'
import * as base_editor from './base_editor'
import * as page_editor from './page_editor'


const viewTypeIdent = 'coll_editor'


export function onInit() {
    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.openColl', show))
}


class CollEditor extends base_editor.WebviewPanel {
    readonly collPath: string
    constructor(collPath: string) {
        super(true, true, viewTypeIdent, 'archive')
        this.collPath = collPath
    }
    override title(): string {
        return º.collFromPath(this.collPath)?.name ?? 'Project defaults'
    }
    override onRefreshedEventMessage(evt: app.StateEvent): any {
        if (evt.proj || evt.cfg)
            return { ident: 'onAppStateRefreshed', payload: º.appState }
        return undefined
    }
    override onMessage(msg: any): void {
        switch (msg.ident) {
            case 'onProjModified':
            case 'onCollModified':
                const dst: º.ProjOrColl = º.collFromPath(this.collPath) ?? º.appState.proj
                dst.collProps = msg.payload.collProps
                dst.pageProps = msg.payload.pageProps
                dst.panelProps = msg.payload.panelProps
                dst.balloonProps = msg.payload.balloonProps
                app.events.modifiedProj.now(º.appState.proj)
                break
            default:
                super.onMessage(msg)
        }
    }
}

export function show(collPath: string) {
    base_editor.show(viewTypeIdent + ':' + collPath, () => new CollEditor(collPath))
}

export function close(coll: º.Collection, closeAnyOpenDescendants: boolean) {
    const coll_path = º.collToPath(coll)
    base_editor.close(viewTypeIdent + base_editor.reuseKeySep + coll_path)
    if (closeAnyOpenDescendants) {
        const close_editors: string[] = []
        for (const reuse_key in base_editor.editors)
            if ((reuse_key.startsWith(viewTypeIdent + base_editor.reuseKeySep + coll_path)) || (reuse_key.startsWith(page_editor.viewTypeIdent + base_editor.reuseKeySep + coll_path)))
                close_editors.push(reuse_key)
        for (const reuse_key of close_editors)
            base_editor.close(reuse_key)
    }
}

export function isOpen(coll: º.Collection) {
    return base_editor.isOpen(viewTypeIdent + base_editor.reuseKeySep + º.collToPath(coll))
}
