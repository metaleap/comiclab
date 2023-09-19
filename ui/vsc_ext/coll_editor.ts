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
        const coll = º.collFromPath(this.collPath) as º.Collection
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
    base_editor.close(viewTypeIdent + ':' + º.collToPath(coll))
}
