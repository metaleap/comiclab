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
        return º.collFromPath(this.collPath)?.name ?? '?!bug?!'
    }
    override onRefreshedEventMessage(evt: app.StateEvent): any {
        if (evt.proj || evt.cfg)
            return { ident: 'onAppStateRefreshed', payload: º.appState }
        return undefined
    }
    override onMessage(msg: any): void {
        const coll = º.collFromPath(this.collPath)
        if (!coll)
            return utils.alert("NEW BUG: coll " + this.collPath + " not found?!")
        switch (msg.ident) {
            case 'onCollModified':
                coll.collProps = msg.payload.collProps
                coll.pageProps = msg.payload.pageProps
                coll.panelProps = msg.payload.panelProps
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
