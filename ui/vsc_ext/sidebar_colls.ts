import * as vs from 'vscode'
import * as º from './_º'
import * as utils from './utils'
import * as app from './app'
import * as sidebar from './sidebar'
import * as coll_editor from './coll_editor'
import * as page_editor from './page_editor'


const node_id_prefix_coll = 'coll:'
const node_id_prefix_page = 'page:'


export class TreeColls extends sidebar.TreeDataProvider {
    override getTreeItem(treeNode: vs.TreeItem): vs.TreeItem {
        return treeNode
    }

    override getChildren(parentTreeNode?: vs.TreeItem): vs.ProviderResult<vs.TreeItem[]> {
        let colls = º.appState.proj.collections
        let pages: º.Page[] = []
        if (parentTreeNode) {
            const coll = collFromNodeId(parentTreeNode.id as string) as º.Collection
            colls = coll.collections ?? []
            pages = coll.pages ?? []
        }

        const ret: vs.TreeItem[] = colls.map(_ => ({
            collapsibleState: (((_.collections.length == 0) && (_.pages.length == 0)) ? vs.TreeItemCollapsibleState.None
                : (((_.pages.length > 0) || coll_editor.isOpen(_) || page_editor.isOpen(_) || !parentTreeNode) ? vs.TreeItemCollapsibleState.Expanded
                    : vs.TreeItemCollapsibleState.Collapsed)),
            iconPath: new vs.ThemeIcon('archive'),
            id: collToNodeId(_),
            contextValue: '_canRename_canDelete_canAddPage_canAddColl_',
            command: { command: 'comiclab.proj.colls.openColl', arguments: [º.collToPath(_)] },
            label: _.name,
        } as vs.TreeItem)) ?? []
        ret.push(...pages.map(_ => ({
            collapsibleState: vs.TreeItemCollapsibleState.None,
            iconPath: new vs.ThemeIcon('file'),
            id: pageToNodeId(_),
            contextValue: '_canRename_canDelete_',
            command: { command: 'comiclab.proj.colls.openPage', arguments: [º.pageToPath(_)] },
            label: _.name,
        } as vs.TreeItem)))
        for (const treeNode of ret) {
            const dict: { [_: string]: boolean } = {
                'canMoveUp_': this.move(treeNode, º.DirPrev, true),
                'canMoveDn_': this.move(treeNode, º.DirNext, true),
                'canMoveTop_': this.move(treeNode, º.DirStart, true),
                'canMoveEnd_': this.move(treeNode, º.DirEnd, true),
                'canMoveTo_': (this.relocate(treeNode, true).length > 0),
            }
            for (const k in dict)
                if (dict[k])
                    treeNode.contextValue += k
        }
        return ret
    }

    addNew(parentTreeNode: vs.TreeItem | null | undefined, addNewPage: boolean) {
        const coll = parentTreeNode ? collFromNodeId(parentTreeNode.id as string) : undefined
        const nameConflicts = (name: string) =>
            ((addNewPage && coll) ? º.collChildPage(coll, name) : º.collChildColl(coll ? coll : º.appState.proj, name))
        const desc_parent = coll ? (`'${coll.name}'`) : "the project"
        const desc_what = (addNewPage ? 'page' : 'collection')
        let name_sugg = desc_what + (((addNewPage && coll) ? coll.pages : (coll ? coll.collections : º.appState.proj.collections)).length + 1).toString().padStart(addNewPage ? 3 : 2, "0")
        if (nameConflicts(name_sugg))
            name_sugg = ''
        if (addNewPage && coll && !º.cfgPaperFormat(º.pageProps(coll).paperFormatId)) {
            utils.alert(`Collection '${coll.name}' has no valid Page Format set yet.`)
            return
        }
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
                    coll.pages = (coll.pages ?? []).concat([{ name: name, pageProps: {}, panelProps: {}, balloonProps: {}, panels: [], balloons: [] }])
                else {
                    const new_coll: º.Collection = { name: name, collections: [], pages: [], collProps: {}, pageProps: {}, panelProps: {}, balloonProps: {} }
                    if (coll)
                        coll.collections = (coll.collections ?? []).concat([new_coll])
                    else
                        º.appState.proj.collections = (º.appState.proj.collections ?? []).concat([new_coll])
                }
                app.events.modifiedProj.now(º.appState.proj)
            }
        })
    }

    rename(treeNode: vs.TreeItem) {
        const old_name = treeNode.label as string
        const coll = (sidebar.treeNodeCat(treeNode) == 'coll') ? collFromNodeId(treeNode.id as string) : undefined
        const page = (sidebar.treeNodeCat(treeNode) == 'page') ? pageFromNodeId(treeNode.id as string) : undefined
        const coll_parent = coll ? º.collParent(coll) : undefined
        const page_parent = page ? º.pageParent(page) : undefined
        vs.window.showInputBox({
            title: `Rename '${old_name}':`,
            value: old_name,
            validateInput: (newName) => {
                if (((newName = newName.trim()).length > 0) && (newName != old_name)) {
                    if (coll_parent && º.collChildColl(coll_parent, newName))
                        return `Another collection in ${((coll_parent.name) ? ("'" + coll_parent.name + "'") : "the project")} is already named '${newName}'.`
                    if (page_parent && º.collChildPage(page_parent, newName))
                        return `Another page in '${page_parent.name}' is already named '${newName}'.`
                }
                return undefined
            }
        }).then((newName) => {
            if (newName && ((newName = newName.trim()).length > 0) && (newName != old_name)) {
                if (coll) {
                    coll_editor.close(coll, false)
                    coll.name = newName
                } else if (page) {
                    page_editor.close(page)
                    page.name = newName
                }
                app.events.modifiedProj.now(º.appState.proj)
            }
        })
    }

    private readonly deletionNote = 'This does not delete scans from the file system. If proceeding, the deletion still only becomes permanent when next saving the project.'
    deleteColl(treeNode: vs.TreeItem) {
        const coll = collFromNodeId(treeNode.id as string)
        if (coll)
            vs.window.showWarningMessage(`Really remove '${coll.name}' from the project?`, { modal: true, detail: this.deletionNote }, "OK").then((_) => {
                if (_ == "OK") {
                    coll_editor.close(coll, true)
                    const parents = º.collParents(coll)
                    if (parents.length > 0)
                        parents[0].collections = parents[0].collections.filter(_ => (_ != coll))
                    else
                        º.appState.proj.collections = º.appState.proj.collections.filter(_ => (_ != coll))
                    app.events.modifiedProj.now(º.appState.proj)
                }
            })
    }
    deletePage(treeNode: vs.TreeItem) {
        const page = pageFromNodeId(treeNode.id as string)
        const coll = page ? º.pageParent(page) : undefined
        if (page && coll)
            vs.window.showWarningMessage(`Really remove page '${page.name}' from collection '${coll.name}'?`, { modal: true, detail: this.deletionNote }, "OK").then((_) => {
                if (_ == "OK") {
                    page_editor.close(page)
                    coll.pages = coll.pages.filter(_ => (_ != page))
                    app.events.modifiedProj.now(º.appState.proj)
                }
            })
    }

    relocate(treeNode: vs.TreeItem, dontDoIt?: boolean): (º.Collection | null)[] {
        const new_parent_candidates: (º.Collection | null)[] = []
        const coll = collFromNodeId(treeNode.id as string)
        if (!coll)
            return []
        const coll_parents = º.collParents(coll)
        const coll_parent = (coll_parents.length > 0) ? coll_parents[0] : undefined
        if (coll_parent)
            new_parent_candidates.push(null)
        º.walkCollections((collCurPath) => {
            if ((coll_parent != collCurPath[0]) && (!collCurPath.includes(coll)))
                new_parent_candidates.push(collCurPath[0])
        })
        if (!dontDoIt)
            vs.window.showQuickPick(new_parent_candidates.map(_ => {
                return '/' + ((!_) ? '' : º.collToPath(_))
            }), { placeHolder: `Select the new parent collection for '${coll.name}':`, title: `Relocate '${coll.name}:'` }).then((path) => {
                if (path) {
                    if (coll_parent)
                        coll_parent.collections = coll_parent.collections.filter(_ => (_ != coll))
                    else
                        º.appState.proj.collections = º.appState.proj.collections.filter(_ => (_ != coll))
                    if (path == '/')
                        º.appState.proj.collections.push(coll)
                    else
                        (º.collFromPath(path.substring(1)) as º.Collection).collections.push(coll)
                    app.events.modifiedProj.now(º.appState.proj)
                }
            })
        return new_parent_candidates
    }

    move(treeNode: vs.TreeItem, direction: º.Direction, dontDoIt?: boolean): boolean {
        let can_move: boolean = false
        const coll = (sidebar.treeNodeCat(treeNode) == 'coll') ? collFromNodeId(treeNode.id as string) : undefined
        const page = (sidebar.treeNodeCat(treeNode) == 'page') ? pageFromNodeId(treeNode.id as string) : undefined
        const coll_parent = coll ? º.collParent(coll) : undefined
        const page_parent = page ? º.pageParent(page) : undefined
        const arr: any[] | undefined = (coll && coll_parent && coll_parent.collections) ? coll_parent.collections : ((page && page_parent && page_parent.pages) ? page_parent.pages : undefined)
        if (arr) {
            const idx_cur = arr.indexOf(coll ?? page)
            const idx_new = º.arrayCanMove(arr, idx_cur, direction)
            if ((can_move = (idx_new !== undefined)) && !dontDoIt) {
                if (coll && coll_parent && coll_parent.collections)
                    coll_parent.collections = º.arrayMoveItem(coll_parent.collections, idx_cur, idx_new)
                else if (page && page_parent && page_parent.pages)
                    page_parent.pages = º.arrayMoveItem(page_parent.pages, idx_cur, idx_new)
                app.events.modifiedProj.now(º.appState.proj)
            }
        }
        return can_move
    }

    openProjCollDefaults() {
        coll_editor.show('')
    }
}

function collToNodeId(coll: º.Collection) {
    return node_id_prefix_coll + º.collToPath(coll)
}

function collFromNodeId(id: string): º.Collection | undefined {
    return (!id.startsWith(node_id_prefix_coll)) ? undefined
        : º.collFromPath(id.substring(node_id_prefix_coll.length))
}

function pageToNodeId(page: º.Page) {
    return node_id_prefix_page + º.pageToPath(page)
}

function pageFromNodeId(id: string): º.Page | undefined {
    return (!id.startsWith(node_id_prefix_page)) ? undefined
        : º.pageFromPath(id.substring(node_id_prefix_page.length))
}
