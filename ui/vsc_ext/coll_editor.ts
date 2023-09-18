import * as vs from 'vscode'
import * as utils from './utils'
import * as base_editor from './base_editor'
import * as shared from './_shared_types'


export class CollEditor extends base_editor.WebviewPanel {
    readonly coll: shared.Collection
    constructor(coll: shared.Collection) {
        super()
        this.coll = coll
    }
    override title(): string {
        return "COLL"
    }
    override onRefreshedEventMessage(): any {
        return { ident: 'onCollRefreshed', payload: null }
    }
    override onMessage(msg: any): void {
        switch (msg.ident) {
            case 'appCollModified':
                // app.onProjModified.now()
                break
            default:
                super.onMessage(msg)
        }
    }
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
