import * as vs from 'vscode'
import *as shared from './_shared_types'
import * as utils from './utils'
import * as app from './app'


export class NavProjColls implements vs.TreeDataProvider<vs.TreeItem>{
    getTreeItem(element: vs.TreeItem): vs.TreeItem {
        return element
    }

    getChildren(element?: vs.TreeItem): vs.ProviderResult<vs.TreeItem[]> {
        let colls = app.state.proj.collections
        if (element)
            colls = (collFromNodeId(element.id as string) as shared.Collection).collections

        return colls.map(_ => ({
            collapsibleState: (element ? vs.TreeItemCollapsibleState.Collapsed : vs.TreeItemCollapsibleState.Expanded),
            contextValue: 'coll',
            iconPath: utils.iconPath('box-archive'),
            id: collToNodeId(app.state, _),
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
    let colls = app.state.proj.collections
    let coll: shared.Collection | undefined
    for (let i = 0; i < parts.length; i++)
        if (coll = colls.find(_ => (_.id == parts[i])))
            colls = coll?.collections
        else
            break
    return coll
}

function collToNodeId(state: shared.State, coll: shared.Collection) {
    const coll_path = shared.collParents(state, coll)
    return 'coll:' + coll_path.map(_ => _.id).join('/')
}
