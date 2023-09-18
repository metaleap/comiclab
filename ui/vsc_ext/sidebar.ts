import * as vs from 'vscode'
import * as shared from './_shared_types'
import * as utils from './utils'


import { SidebarWebViewProvider } from './sidebar_webview'
let webviewProvider: SidebarWebViewProvider


export abstract class TreeDataProvider implements vs.TreeDataProvider<vs.TreeItem> {
    refresh = new vs.EventEmitter<vs.TreeItem | undefined | null | void>()
    onDidChangeTreeData: vs.Event<vs.TreeItem | undefined | null | void> = this.refresh.event
    abstract getTreeItem(element: vs.TreeItem): vs.TreeItem;
    abstract getChildren(element?: vs.TreeItem): vs.ProviderResult<vs.TreeItem[]>;
}
import { TreeColls as TreeColls } from './sidebar_colls'
import { TreeBooks as TreeBooks } from './sidebar_books'
import { TreeSites as TreeSites } from './sidebar_sites'


let treeColls = new TreeColls()
let treeBooks = new TreeBooks()
let treeSites = new TreeSites()


export function onInit(ctx: vs.ExtensionContext) {
    utils.disp(vs.window.registerWebviewViewProvider('comicLabSidebarWebview', webviewProvider = new SidebarWebViewProvider()))

    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.delete', cmdDelete))
    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.rename', cmdRename))
    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.moveUp', cmdMoveUp))
    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.moveDn', cmdMoveDn))
    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.moveTop', cmdMoveTop))
    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.moveEnd', cmdMoveEnd))

    utils.disp(vs.window.registerTreeDataProvider('comiclabExplorerProjColls', treeColls))
    utils.disp(vs.window.registerTreeDataProvider('comiclabExplorerProjBooks', treeBooks))
    utils.disp(vs.window.registerTreeDataProvider('comiclabExplorerProjSites', treeSites))
    shared.subscribe(shared.appState.onProjRefreshed, (_) => {
        treeColls.refresh.fire()
        treeBooks.refresh.fire()
        treeSites.refresh.fire()
    })
}

function cmdDelete(...args: any[]): any {
    const treeItem = args[0] as vs.TreeItem
    switch (treeItem.contextValue) {
        case 'coll':
            treeColls.deleteColl(treeItem)
            break
        case 'page':
            treeColls.deletePage(treeItem)
            break
    }
}

function cmdRename(...args: any[]): any {
}

function cmdMoveUp(...args: any[]): any {
}
function cmdMoveDn(...args: any[]): any {
}
function cmdMoveTop(...args: any[]): any {
}
function cmdMoveEnd(...args: any[]): any {
}

export function showWebview() {
    webviewProvider.webView?.show(true)
}
