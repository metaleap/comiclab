import * as vs from 'vscode'
import * as º from './_º'
import * as utils from './utils'
import * as app from './app'
import * as base_editor from './base_editor'


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
    override onRefreshedEventMessage(): any {
        return {
            ident: 'onAppStateRefreshed', payload: º.appState,
        }
    }
    override onMessage(msg: any): void {
        const coll = º.collFromPath(this.collPath)
        if (!coll)
            return utils.alert("NEW BUG: coll " + this.collPath + " not found?!")
        switch (msg.ident) {
            case 'onCollModified':
                coll.props = msg.payload.props
                app.onProjModified.now(º.appState.proj)
                break
            default:
                super.onMessage(msg)
        }
    }
}

export function show(collPath: string) {
    base_editor.show(viewTypeIdent + ':' + collPath, () => new CollEditor(collPath))
}

export function close(coll: º.Collection) {
    base_editor.close(viewTypeIdent + base_editor.reuseKeySep + º.collToPath(coll))
}

export function isOpen(coll: º.Collection) {
    return base_editor.isOpen(viewTypeIdent + base_editor.reuseKeySep + º.collToPath(coll))
}
