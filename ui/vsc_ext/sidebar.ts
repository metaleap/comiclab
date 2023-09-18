import * as vs from 'vscode'
import * as shared from './_shared_types'
import * as utils from './utils'


import { SidebarWebViewProvider } from './sidebar_webview'
let webviewProvider: SidebarWebViewProvider


export abstract class TreeDataProvider implements vs.TreeDataProvider<vs.TreeItem> {
    refresh = new vs.EventEmitter<vs.TreeItem | undefined | null | void>()
    treeView: vs.TreeView<vs.TreeItem>
    onDidChangeTreeData: vs.Event<vs.TreeItem | undefined | null | void> = this.refresh.event
    abstract getTreeItem(treeNode: vs.TreeItem): vs.TreeItem;
    abstract getChildren(treeNode?: vs.TreeItem): vs.ProviderResult<vs.TreeItem[]>;
    onInit(treeView: vs.TreeView<vs.TreeItem>) {
        this.treeView = treeView
        return this.treeView
    }
}
import { TreeColls as TreeColls } from './sidebar_colls'
import { TreeBooks as TreeBooks } from './sidebar_books'
import { TreeSites as TreeSites } from './sidebar_sites'
let treeColls = new TreeColls()
let treeBooks = new TreeBooks()
let treeSites = new TreeSites()


export function onInit(ctx: vs.ExtensionContext) {
    utils.disp(vs.window.registerWebviewViewProvider('comicLabSidebarWebview', webviewProvider = new SidebarWebViewProvider()))

    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.addPage', cmdAddPage))
    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.addColl', cmdAddColl))
    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.addCollTop', cmdAddCollTop))
    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.delete', cmdDelete))
    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.rename', cmdRename))
    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.moveTo', cmdMoveTo))
    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.moveUp', cmdMoveUp))
    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.moveDn', cmdMoveDn))
    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.moveTop', cmdMoveTop))
    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.moveEnd', cmdMoveEnd))

    utils.disp(treeColls.onInit(vs.window.createTreeView('comiclabExplorerProjColls', { treeDataProvider: treeColls, showCollapseAll: true })))
    utils.disp(treeBooks.onInit(vs.window.createTreeView('comiclabExplorerProjBooks', { treeDataProvider: treeBooks, showCollapseAll: true })))
    utils.disp(treeSites.onInit(vs.window.createTreeView('comiclabExplorerProjSites', { treeDataProvider: treeSites, showCollapseAll: true })))
    shared.subscribe(shared.appState.onProjRefreshed, (_) => {
        [treeColls, treeBooks, treeSites].forEach(_ => _.refresh.fire())
    })
}

export function treeNodeCat(treeNode: vs.TreeItem): string {
    const idx = (treeNode.id as string).indexOf(':') as number
    return (treeNode.id as string).substring(0, idx)
}

function cmdAddPage(...args: any[]): any {
    treeColls.addNew(args[0] as vs.TreeItem, true)
}
function cmdAddColl(...args: any[]): any {
    treeColls.addNew(args[0], false)
}
function cmdAddCollTop(..._: any[]): any {
    treeColls.addNew(null, false)
}
function cmdDelete(...args: any[]): any {
    const treeItem = args[0] as vs.TreeItem
    switch (treeNodeCat(treeItem)) {
        case 'coll':
            treeColls.deleteColl(treeItem)
            break
        case 'page':
            treeColls.deletePage(treeItem)
            break
    }
}
function cmdRename(...args: any[]): any {
    const treeItem = args[0] as vs.TreeItem
    if (treeNodeCat(treeItem) == 'page' || treeNodeCat(treeItem) == 'coll')
        treeColls.rename(treeItem)
}
function cmdMoveUp(...args: any[]): any {
    const treeItem = args[0] as vs.TreeItem
    if (treeNodeCat(treeItem) == 'page' || treeNodeCat(treeItem) == 'coll')
        treeColls.move(treeItem, -1)
}
function cmdMoveDn(...args: any[]): any {
    const treeItem = args[0] as vs.TreeItem
    if (treeNodeCat(treeItem) == 'page' || treeNodeCat(treeItem) == 'coll')
        treeColls.move(treeItem, 1)
}
function cmdMoveTop(...args: any[]): any {
    const treeItem = args[0] as vs.TreeItem
    if (treeNodeCat(treeItem) == 'page' || treeNodeCat(treeItem) == 'coll')
        treeColls.move(treeItem, 0)
}
function cmdMoveEnd(...args: any[]): any {
    const treeItem = args[0] as vs.TreeItem
    if (treeNodeCat(treeItem) == 'page' || treeNodeCat(treeItem) == 'coll')
        treeColls.move(treeItem, NaN)
}
function cmdMoveTo(...args: any[]): any {
    const treeItem = args[0] as vs.TreeItem
    if (treeNodeCat(treeItem) == 'coll')
        treeColls.relocate(treeItem)
}

export function showWebview() {
    webviewProvider.webView?.show(true)
}
