import * as vs from 'vscode'
import * as º from './_º'
import * as utils from './utils'
import * as app from './app'
import * as base_editor from './base_editor'


export const viewTypeIdent = 'coll_editor'


export function onInit() {
    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.openColl', show))
}


class CollEditor extends base_editor.WebviewPanel {
    readonly coll: º.Collection
    constructor(coll: º.Collection) {
        super(true, false, viewTypeIdent, 'archive')
        this.coll = coll
    }
    override title(): string {
        return this.coll.id
    }
    override onRefreshedEventMessage(): any {
        return {
            ident: 'onCollRefreshed', payload: {
                'path': º.collToPath(this.coll),
            }
        }
    }
    override onMessage(msg: any): void {
        switch (msg.ident) {
            case 'onCollModified':
                const new_coll = msg.payload as º.Collection
                this.coll.authorID = new_coll.authorID
                this.coll.contentFields = new_coll.contentFields
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
