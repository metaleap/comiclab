import * as vs from 'vscode'
import * as utils from './utils'
import * as shared from './_shared_types'
import * as app from './app'
import * as base_editor from './base_editor'


let collEditors = new Map<string, CollEditor>()


class CollEditor extends base_editor.WebviewPanel {
    readonly coll: shared.Collection
    constructor(coll: shared.Collection) {
        super()
        this.coll = coll
    }
    override title(): string {
        return this.coll.id
    }
    override onDisposed() {
        collEditors.delete(collToPath(this.coll))
        super.onDisposed()
    }
    override onRefreshedEventMessage(): any {
        return { ident: 'onCollRefreshed', payload: this.coll }
    }
    override onMessage(msg: any): void {
        switch (msg.ident) {
            case 'appCollModified':
                const new_coll = msg.payload as shared.Collection
                this.coll.authorID = new_coll.authorID
                this.coll.contentFields = new_coll.contentFields
                app.onProjModified.now(shared.appState.proj)
                break
            default:
                super.onMessage(msg)
        }
    }
}

export function show(collPath: string) {
    let editor = collEditors.get(collPath)
    const coll = collFromPath(collPath)
    if (!coll)
        return
    if (!editor) {
        editor = new CollEditor(coll)
        collEditors.set(collPath, editor)
    }
    editor.show(true, false, 'coll_editor', 'archive')
}

export function collToPath(coll: shared.Collection): string {
    const coll_path = shared.collParents(coll)
    return [coll].concat(coll_path).reverse().map(_ => _.id).join('/')
}

export function collFromPath(path: string): shared.Collection | undefined {
    let coll: shared.Collection | undefined
    const parts = path.split('/')
    let colls: shared.Collection[] = shared.appState.proj.collections
    for (let i = 0; i < parts.length; i++)
        if (coll = colls.find(_ => (_.id == parts[i])))
            colls = coll.collections
        else
            break
    return coll
}

export function onInit() {
    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.openColl', show))
}
