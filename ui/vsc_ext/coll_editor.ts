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
    readonly coll: º.Collection
    constructor(coll: º.Collection) {
        super(true, true, viewTypeIdent, 'archive')
        this.coll = coll
    }
    override title(): string {
        return this.coll.name
    }
    override onRefreshedEventMessage(): any {
        return {
            ident: 'onAppStateRefreshed', payload: º.appState,
        }
    }
    override onMessage(msg: any): void {
        switch (msg.ident) {
            case 'onCollModified':
                this.coll.props = msg.payload.props
                app.onProjModified.now(º.appState.proj)
                break
            default:
                super.onMessage(msg)
        }
    }
}

export function show(collPath: string) {
    const coll = º.collFromPath(collPath)
    if (!coll)
        return
    base_editor.show(viewTypeIdent + ':' + collPath, () => new CollEditor(coll))
}

export function close(coll: º.Collection) {
    base_editor.close(viewTypeIdent + ':' + º.collToPath(coll))
}
