import * as vs from 'vscode';
export declare class NavProjColls implements vs.TreeDataProvider<vs.TreeItem> {
    getTreeItem(element: vs.TreeItem): vs.TreeItem;
    getChildren(element?: vs.TreeItem): vs.ProviderResult<vs.TreeItem[]>;
}
export declare class NavProjBooks implements vs.TreeDataProvider<vs.TreeItem> {
    getTreeItem(element: vs.TreeItem): vs.TreeItem;
    getChildren(element?: vs.TreeItem): vs.ProviderResult<vs.TreeItem[]>;
}
export declare class NavProjSites implements vs.TreeDataProvider<vs.TreeItem> {
    getTreeItem(element: vs.TreeItem): vs.TreeItem;
    getChildren(element?: vs.TreeItem): vs.ProviderResult<vs.TreeItem[]>;
}
