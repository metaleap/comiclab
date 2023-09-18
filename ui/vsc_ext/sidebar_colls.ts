import * as vs from 'vscode'
import * as shared from './_shared_types'
import * as utils from './utils'
import * as sidebar from './sidebar'


export class TreeColls extends sidebar.TreeDataProvider {
    override getTreeItem(element: vs.TreeItem): vs.TreeItem {
        return element
    }

    override getChildren(element?: vs.TreeItem): vs.ProviderResult<vs.TreeItem[]> {
        let colls = shared.appState.proj.collections
        let pages: shared.Page[] | undefined = []
        if (element) {
            const coll = collFromNodeId(element.id as string) as shared.Collection
            colls = coll.collections ?? []
            pages = coll.pages
        }

        const ret: vs.TreeItem[] = colls?.map(_ => ({
            collapsibleState: ((utils.noneIn(_.collections) && utils.noneIn(_.pages)) ? vs.TreeItemCollapsibleState.None
                : (element ? vs.TreeItemCollapsibleState.Collapsed : vs.TreeItemCollapsibleState.Expanded)),
            contextValue: 'coll',
            iconPath: new vs.ThemeIcon('folder'),
            id: collToNodeId(_),
            label: _.id,
        } as vs.TreeItem)) ?? []
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

    deleteColl(item: vs.TreeItem) {
        const coll = collFromNodeId(item.id as string)
        if (coll) {
            const parents = shared.collParents(coll)
            if (parents.length > 0)
                parents[0].collections = parents[0].collections?.filter(_ => (_ != coll))
            else
                shared.appState.proj.collections = shared.appState.proj.collections?.filter(_ => (_ != coll))
            shared.trigger(shared.appState.onProjModified, shared.appState.proj)
        }
    }

    deletePage(item: vs.TreeItem) {
        const page = pageFromNodeId(item.id as string)
        if (page) {
            const coll = shared.pageParent(page)
            if (coll) {
                coll.pages = coll.pages?.filter(_ => (_ != page))
                shared.trigger(shared.appState.onProjModified, shared.appState.proj)
            }
        }
    }

    rename(item: vs.TreeItem) {
        const old_name = item.label?.toString() ?? '?!bug!?'
        const coll = (item.contextValue == 'coll') ? collFromNodeId(item.id as string) : undefined
        const page = (item.contextValue == 'page') ? pageFromNodeId(item.id as string) : undefined
        const coll_parent = coll ? shared.collParent(coll) : undefined
        const page_parent = page ? shared.pageParent(page) : undefined
        vs.window.showInputBox({
            title: 'Rename ' + old_name, value: old_name, validateInput: (newName) => {
                if (((newName = newName.trim()).length > 0) && (newName != old_name)) {
                    if (coll_parent && coll_parent.collections?.find(_ => (_ != coll && (_.id == newName))))
                        return `Another collection in ${((coll_parent.id) ? ("'" + coll_parent.id + "'") : "the project")} is already named '${newName}'.`
                    if (page_parent && page_parent.pages?.find(_ => (_ != page) && (_.id == newName)))
                        return `Another page in '${page_parent.id}' is already named '${newName}'.`
                }
                return undefined
            }
        }).then((newName) => {
            if (newName && ((newName = newName.trim()).length > 0) && (newName != old_name)) {
                if (coll)
                    coll.id = newName
                else if (page)
                    page.id = newName
                shared.trigger(shared.appState.onProjModified, shared.appState.proj)
            }
        })
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
