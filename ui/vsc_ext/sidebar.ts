import * as vs from 'vscode'
import * as utils from './utils'
import * as º from './_º'
import * as app from './app'


import { SidebarWebViewProvider } from './sidebar_webview'
let webviewProvider: SidebarWebViewProvider


export abstract class TreeDataProvider implements vs.TreeDataProvider<vs.TreeItem> {
    refreshEmitter = new vs.EventEmitter<vs.TreeItem | undefined | null | void>()
    onDidChangeTreeData = this.refreshEmitter.event
    treeView: vs.TreeView<vs.TreeItem>
    origTitle: string
    abstract getTreeItem(treeNode: vs.TreeItem): vs.TreeItem;
    abstract getChildren(treeNode?: vs.TreeItem): vs.ProviderResult<vs.TreeItem[]>;
    onInit(treeView: vs.TreeView<vs.TreeItem>) {
        utils.disp(this.refreshEmitter)
        this.origTitle = treeView.title ?? '?!bug?!'
        this.treeView = treeView
        return this.treeView
    }
    refreshTitle() {
        this.treeView.title = this.origTitle + (app.dirtyProj ? '*' : '')
    }
}
import { TreeColls as TreeColls } from './sidebar_colls'
import { TreeBooks as TreeBooks } from './sidebar_books'
import { TreeSites as TreeSites } from './sidebar_sites'
export let treeColls = new TreeColls()
export let treeBooks = new TreeBooks()
export let treeSites = new TreeSites()


export function onInit() {
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
    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.projSettings', cmdProjSettings))

    utils.disp(treeColls.onInit(vs.window.createTreeView('comiclabExplorerProjColls', { treeDataProvider: treeColls, showCollapseAll: true })))
    utils.disp(treeBooks.onInit(vs.window.createTreeView('comiclabExplorerProjBooks', { treeDataProvider: treeBooks, showCollapseAll: true })))
    utils.disp(treeSites.onInit(vs.window.createTreeView('comiclabExplorerProjSites', { treeDataProvider: treeSites, showCollapseAll: true })))
    app.events.saved.on((_) => {
        if (_.proj)
            for (const tree of [treeColls, treeBooks, treeSites])
                tree.refreshTitle()
    })
    app.events.refreshed.on((_) => {
        if (_.proj)
            for (const tree of [treeColls, treeBooks, treeSites]) {
                tree.refreshEmitter.fire()
                tree.refreshTitle()
            }
    })
}

export function treeNodeCat(treeNode: vs.TreeItem): string {
    const idx = (treeNode.id as string).indexOf(':') as number
    return (treeNode.id as string).substring(0, idx)
}

function cmdProjSettings() {
    treeColls.openProjCollDefaults()
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
        treeColls.move(treeItem, º.DirPrev)
}
function cmdMoveDn(...args: any[]): any {
    const treeItem = args[0] as vs.TreeItem
    if (treeNodeCat(treeItem) == 'page' || treeNodeCat(treeItem) == 'coll')
        treeColls.move(treeItem, º.DirNext)
}
function cmdMoveTop(...args: any[]): any {
    const treeItem = args[0] as vs.TreeItem
    if (treeNodeCat(treeItem) == 'page' || treeNodeCat(treeItem) == 'coll')
        treeColls.move(treeItem, º.DirStart)
}
function cmdMoveEnd(...args: any[]): any {
    const treeItem = args[0] as vs.TreeItem
    if (treeNodeCat(treeItem) == 'page' || treeNodeCat(treeItem) == 'coll')
        treeColls.move(treeItem, º.DirEnd)
}
function cmdMoveTo(...args: any[]): any {
    const treeItem = args[0] as vs.TreeItem
    if (treeNodeCat(treeItem) == 'coll')
        treeColls.relocate(treeItem)
}

export function showWebview() {
    webviewProvider.webView?.show(true)
}
