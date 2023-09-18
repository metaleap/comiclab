import * as vs from 'vscode'
import * as shared from './_shared_types'
import * as utils from './utils'
import { SidebarWebViewProvider } from './sidebar_webview'
import { NavProjColls } from './sidebar_colls'
import { NavProjBooks } from './sidebar_books'
import { NavProjSites } from './sidebar_sites'


let webviewProvider: SidebarWebViewProvider

export function onInit(ctx: vs.ExtensionContext) {
    utils.disp(vs.window.registerWebviewViewProvider('comicLabSidebarWebview', webviewProvider = new SidebarWebViewProvider()))

    utils.disp(vs.window.registerTreeDataProvider('comiclabExplorerProjColls', sideBarTreeColls))
    utils.disp(vs.window.registerTreeDataProvider('comiclabExplorerProjBooks', sideBarTreeBooks))
    utils.disp(vs.window.registerTreeDataProvider('comiclabExplorerProjSites', sideBarTreeSites))
    shared.subscribe(shared.appState.onProjRefreshed, (_) => {
        sideBarTreeColls.refresh.fire()
        sideBarTreeBooks.refresh.fire()
        sideBarTreeSites.refresh.fire()
    })
}

export abstract class TreeDataProvider implements vs.TreeDataProvider<vs.TreeItem> {
    refresh = new vs.EventEmitter<vs.TreeItem | undefined | null | void>()
    onDidChangeTreeData: vs.Event<vs.TreeItem | undefined | null | void> = this.refresh.event
    abstract getTreeItem(element: vs.TreeItem): vs.TreeItem;
    abstract getChildren(element?: vs.TreeItem): vs.ProviderResult<vs.TreeItem[]>;
}


let sideBarTreeColls = new NavProjColls()
let sideBarTreeBooks = new NavProjBooks()
let sideBarTreeSites = new NavProjSites()

export function showWebview() {
    webviewProvider.webView?.show(true)
}
