import * as vs from 'vscode'
import * as shared from './_shared_types'
import * as utils from './utils'


export class NavProjColls implements vs.TreeDataProvider<vs.TreeItem>{
    refreshTriggerer = new vs.EventEmitter<vs.TreeItem | undefined | null | void>()
    onDidChangeTreeData: vs.Event<vs.TreeItem | undefined | null | void> = this.refreshTriggerer.event

    getTreeItem(element: vs.TreeItem): vs.TreeItem {
        return element
    }

    getChildren(element?: vs.TreeItem): vs.ProviderResult<vs.TreeItem[]> {
        let colls: shared.Collection[] = shared.appState.proj.collections
        let pages: shared.Page[] | undefined = []
        if (element) {
            const coll = collFromNodeId(element.id as string) as shared.Collection
            colls = coll.collections ?? []
            pages = coll.pages
        }

        const ret: vs.TreeItem[] = colls.map(_ => ({
            collapsibleState: ((utils.noneIn(_.collections) && utils.noneIn(_.pages)) ? vs.TreeItemCollapsibleState.None
                : (element ? vs.TreeItemCollapsibleState.Collapsed : vs.TreeItemCollapsibleState.Expanded)),
            contextValue: 'coll',
            iconPath: new vs.ThemeIcon('folder'),
            id: collToNodeId(_),
            label: _.id,
        } as vs.TreeItem))
        if (pages)
            ret.push(...pages.map(_ => ({
                collapsibleState: vs.TreeItemCollapsibleState.None,
                contextValue: 'page',
                iconPath: new vs.ThemeIcon('file'),
                id: pageToNodeId(_),
                label: _.id,
            } as vs.TreeItem)))
        return ret
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
    let colls: shared.Collection[] | undefined = shared.appState.proj.collections
    let coll: shared.Collection | undefined
    for (let i = 0; i < parts.length; i++)
        if (coll = colls?.find(_ => (_.id == parts[i])))
            colls = coll?.collections
        else
            break
    return coll
}

function pageFromNodeId(id: string) {
    if (!id.startsWith('page:'))
        throw id
    const parts = id.substring('page:'.length).split('/')
    let colls: shared.Collection[] | undefined = shared.appState.proj.collections
    let coll: shared.Collection | undefined
    let page: shared.Page | undefined
    for (let i = 0; i < parts.length; i++)
        if (i == parts.length - 1)
            return coll?.pages?.find(_ => (_.id == parts[i]))
        else if (coll = colls?.find(_ => (_.id == parts[i])))
            colls = coll?.collections
        else
            break
    return page
}

function collToNodeId(coll: shared.Collection) {
    const coll_path = shared.collParents(coll)
    return 'coll:' + [coll].concat(coll_path).reverse().map(_ => _.id).join('/')
}

function pageToNodeId(page: shared.Page) {
    const coll_path = shared.pageParents(page)
    return 'page:' + [page].concat(coll_path).reverse().map(_ => _.id).join('/')
}
