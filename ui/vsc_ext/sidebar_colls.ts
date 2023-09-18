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
            iconPath: new vs.ThemeIcon('folder'),
            id: collToNodeId(_),
            contextValue: '_canRename_canDelete_canAddPage_canAddColl_',
            label: _.id,
        } as vs.TreeItem)) ?? []
        if (pages)
            ret.push(...pages.map(_ => ({
                collapsibleState: vs.TreeItemCollapsibleState.None,
                iconPath: new vs.ThemeIcon('file'),
                id: pageToNodeId(_),
                contextValue: '_canRename_canDelete_',
                label: _.id,
            } as vs.TreeItem)))
        ret.forEach((treeItem: vs.TreeItem) => {
            const dict: { [_: string]: boolean } = {
                "canMoveUp_": this.move(treeItem, -1, true),
                "canMoveDn_": this.move(treeItem, 1, true),
                "canMoveTop_": this.move(treeItem, 0, true),
                "canMoveEnd_": this.move(treeItem, NaN, true),
            }
            for (const k in dict)
                if (dict[k])
                    treeItem.contextValue += k
        })
        return ret
    }

    private readonly deletionNote = 'This does not delete scans from the file system. If proceeding, the deletion still only becomes permanent when next saving the project.'

    deleteColl(item: vs.TreeItem) {
        const coll = collFromNodeId(item.id as string)
        if (coll)
            vs.window.showWarningMessage(`Really remove '${coll.id}' from the project?`, { modal: true, detail: this.deletionNote }, "OK").then((_) => {
                if (_ == "OK") {
                    const parents = shared.collParents(coll)
                    if (parents.length > 0)
                        parents[0].collections = parents[0].collections?.filter(_ => (_ != coll))
                    else
                        shared.appState.proj.collections = shared.appState.proj.collections?.filter(_ => (_ != coll))
                    shared.trigger(shared.appState.onProjModified, shared.appState.proj)
                }
            })
    }

    deletePage(item: vs.TreeItem) {
        const page = pageFromNodeId(item.id as string)
        const coll = page ? shared.pageParent(page) : undefined
        if (page && coll)
            vs.window.showWarningMessage(`Really remove page '${page.id}' from collection '${coll.id}'?`, { modal: true, detail: this.deletionNote }, "OK").then((_) => {
                if (_ == "OK") {
                    coll.pages = coll.pages?.filter(_ => (_ != page))
                    shared.trigger(shared.appState.onProjModified, shared.appState.proj)
                }
            })
    }

    rename(item: vs.TreeItem) {
        const old_name = item.label?.toString() ?? '?!bug!?'
        const coll = (sidebar.treeNodeCat(item) == 'coll') ? collFromNodeId(item.id as string) : undefined
        const page = (sidebar.treeNodeCat(item) == 'page') ? pageFromNodeId(item.id as string) : undefined
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

    move(item: vs.TreeItem, direction: number, dontDoIt?: boolean): boolean {
        let can_move: boolean = false
        const coll = (sidebar.treeNodeCat(item) == 'coll') ? collFromNodeId(item.id as string) : undefined
        const page = (sidebar.treeNodeCat(item) == 'page') ? pageFromNodeId(item.id as string) : undefined
        const coll_parent = coll ? shared.collParent(coll) : undefined
        const page_parent = page ? shared.pageParent(page) : undefined
        const arr: any[] | undefined = (coll && coll_parent && coll_parent.collections) ? coll_parent.collections : ((page && page_parent && page_parent.pages) ? page_parent.pages : undefined)
        if (arr) {
            can_move = (arr.length > 1)
            const idx_cur = arr.indexOf(coll ?? page)
            const idx_new =
                (direction == 1) ? (idx_cur + 1)
                    : ((direction == -1) ? (idx_cur - 1)
                        : ((direction == 0) ? 0
                            : (arr.length - 1)))
            can_move = (idx_new != idx_cur) && (idx_new >= 0) && (idx_new < arr.length)
            if (can_move && !dontDoIt) {
                if (coll && coll_parent && coll_parent.collections)
                    coll_parent.collections = utils.arrayMoveItem(coll_parent.collections, idx_cur, idx_new)
                else if (page && page_parent && page_parent.pages)
                    page_parent.pages = utils.arrayMoveItem(page_parent.pages, idx_cur, idx_new)
                shared.trigger(shared.appState.onProjModified, shared.appState.proj)
            }
        }
        return can_move
    }
}

function collFromNodeId(id: string) {
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
