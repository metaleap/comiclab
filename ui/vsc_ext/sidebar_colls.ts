import * as vs from 'vscode'
import * as shared from './_shared_types'
import * as utils from './utils'
import * as sidebar from './sidebar'


export class TreeColls extends sidebar.TreeDataProvider {
    override getTreeItem(treeNode: vs.TreeItem): vs.TreeItem {
        return treeNode
    }

    override getChildren(parentTreeNode?: vs.TreeItem): vs.ProviderResult<vs.TreeItem[]> {
        let colls = shared.appState.proj.collections
        let pages: shared.Page[] | undefined = []
        if (parentTreeNode) {
            const coll = collFromNodeId(parentTreeNode.id as string) as shared.Collection
            colls = coll.collections ?? []
            pages = coll.pages
        }

        const ret: vs.TreeItem[] = colls?.map(_ => ({
            collapsibleState: ((utils.noneIn(_.collections) && utils.noneIn(_.pages)) ? vs.TreeItemCollapsibleState.None
                : (parentTreeNode ? vs.TreeItemCollapsibleState.Collapsed : vs.TreeItemCollapsibleState.Expanded)),
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
        ret.forEach((treeNode: vs.TreeItem) => {
            const dict: { [_: string]: boolean } = {
                "canMoveUp_": this.move(treeNode, -1, true),
                "canMoveDn_": this.move(treeNode, 1, true),
                "canMoveTop_": this.move(treeNode, 0, true),
                "canMoveEnd_": this.move(treeNode, NaN, true),
            }
            for (const k in dict)
                if (dict[k])
                    treeNode.contextValue += k
        })
        return ret
    }

    addNew(parentTreeNode: vs.TreeItem | null | undefined, addNewPage: boolean) {
        const coll = parentTreeNode ? collFromNodeId(parentTreeNode.id as string) : undefined
        const nameConflicts = (name: string) =>
            ((addNewPage && coll) ? shared.collChildPage(coll, name) : shared.collChildColl(coll ? coll : shared.appState.proj, name))
        const desc_parent = coll ? (`'${coll.id}'`) : "the project"
        const desc_what = (addNewPage ? 'page' : 'collection')
        let name_sugg = desc_what + ((((addNewPage && coll) ? coll.pages : (coll ? coll.collections : shared.appState.proj.collections))?.length ?? 0) + 1).toString().padStart(addNewPage ? 3 : 2, "0")
        if (nameConflicts(name_sugg))
            name_sugg = ''
        vs.window.showInputBox({
            title: `Add ${desc_what} to ${desc_parent}:`,
            value: name_sugg,
            prompt: `Name the new ${desc_what}.`,
            validateInput: (name) => {
                if ((name = name.trim()).length > 0) {
                    if (nameConflicts(name))
                        return `Another ${desc_what} in ${desc_parent} is already named '${name}'.`
                }
                return undefined
            }
        }).then((name) => {
            if (name && ((name = name.trim()).length > 0)) {
                if (addNewPage && coll)
                    coll.pages = (coll.pages ?? []).concat([{ id: name }])
                else {
                    const new_coll = { id: name, collections: [], pages: [], authorID: '', contentFields: {} }
                    if (coll)
                        coll.collections = (coll.collections ?? []).concat([new_coll])
                    else
                        shared.appState.proj.collections = (shared.appState.proj.collections ?? []).concat([new_coll])
                }
                shared.trigger(shared.appState.onProjModified, shared.appState.proj)
            }
        })
    }

    rename(treeNode: vs.TreeItem) {
        const old_name = treeNode.label?.toString() ?? '?!bug!?'
        const coll = (sidebar.treeNodeCat(treeNode) == 'coll') ? collFromNodeId(treeNode.id as string) : undefined
        const page = (sidebar.treeNodeCat(treeNode) == 'page') ? pageFromNodeId(treeNode.id as string) : undefined
        const coll_parent = coll ? shared.collParent(coll) : undefined
        const page_parent = page ? shared.pageParent(page) : undefined
        vs.window.showInputBox({
            title: `Rename '${old_name}'`,
            value: old_name,
            validateInput: (newName) => {
                if (((newName = newName.trim()).length > 0) && (newName != old_name)) {
                    if (coll_parent && shared.collChildColl(coll_parent, newName))
                        return `Another collection in ${((coll_parent.id) ? ("'" + coll_parent.id + "'") : "the project")} is already named '${newName}'.`
                    if (page_parent && shared.collChildPage(page_parent, newName))
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

    private readonly deletionNote = 'This does not delete scans from the file system. If proceeding, the deletion still only becomes permanent when next saving the project.'
    deleteColl(treeNode: vs.TreeItem) {
        const coll = collFromNodeId(treeNode.id as string)
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
    deletePage(treeNode: vs.TreeItem) {
        const page = pageFromNodeId(treeNode.id as string)
        const coll = page ? shared.pageParent(page) : undefined
        if (page && coll)
            vs.window.showWarningMessage(`Really remove page '${page.id}' from collection '${coll.id}'?`, { modal: true, detail: this.deletionNote }, "OK").then((_) => {
                if (_ == "OK") {
                    coll.pages = coll.pages?.filter(_ => (_ != page))
                    shared.trigger(shared.appState.onProjModified, shared.appState.proj)
                }
            })
    }

    move(treeNode: vs.TreeItem, direction: number, dontDoIt?: boolean): boolean {
        let can_move: boolean = false
        const coll = (sidebar.treeNodeCat(treeNode) == 'coll') ? collFromNodeId(treeNode.id as string) : undefined
        const page = (sidebar.treeNodeCat(treeNode) == 'page') ? pageFromNodeId(treeNode.id as string) : undefined
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
