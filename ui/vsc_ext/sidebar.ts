import * as vs from 'vscode'
import * as shared from './_shared_types'
import * as utils from './utils'
import * as app from './app'


export class NavProjColls implements vs.TreeDataProvider<vs.TreeItem>{

    refreshTriggerer = new vs.EventEmitter<vs.TreeItem | undefined | null | void>()
    onDidChangeTreeData: vs.Event<vs.TreeItem | undefined | null | void> = this.refreshTriggerer.event

    getTreeItem(element: vs.TreeItem): vs.TreeItem {
        return element
    }

    getChildren(element?: vs.TreeItem): vs.ProviderResult<vs.TreeItem[]> {
        let colls = shared.appState.proj.collections
        if (element)
            colls = (collFromNodeId(element.id as string) as shared.Collection).collections
        if (!colls)
            return []

        return colls.map(_ => ({
            collapsibleState: (element ? vs.TreeItemCollapsibleState.Collapsed : vs.TreeItemCollapsibleState.Expanded),
            contextValue: 'coll',
            iconPath: utils.iconPath('box-archive'),
            id: collToNodeId(_),
            label: _.id,
        } as vs.TreeItem))
    }
}

export class NavProjBooks implements vs.TreeDataProvider<vs.TreeItem>{
    getTreeItem(element: vs.TreeItem): vs.TreeItem {
        return element
    }

    getChildren(element?: vs.TreeItem): vs.ProviderResult<vs.TreeItem[]> {
        return [] // book
    }
}

export class NavProjSites implements vs.TreeDataProvider<vs.TreeItem>{
    getTreeItem(element: vs.TreeItem): vs.TreeItem {
        return element
    }

    getChildren(element?: vs.TreeItem): vs.ProviderResult<vs.TreeItem[]> {
        return []  // globe
    }
}

function collFromNodeId(id: string) {
    if (!id.startsWith('coll:'))
        throw id
    const parts = id.substring('coll:'.length).split('/')
    let colls = shared.appState.proj.collections
    let coll: shared.Collection | undefined
    for (let i = 0; i < parts.length; i++)
        if (coll = colls.find(_ => (_.id == parts[i])))
            colls = coll?.collections
        else
            break
    return coll
}

function collToNodeId(coll: shared.Collection) {
    const coll_path = shared.collParents(coll)
    return 'coll:' + [coll].concat(coll_path).reverse().map(_ => _.id).join('/')
}
