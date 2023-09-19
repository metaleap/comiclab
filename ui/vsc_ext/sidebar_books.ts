import * as vs from 'vscode'
import * as sidebar from './sidebar'


export class TreeBooks extends sidebar.TreeDataProvider {
    override getTreeItem(element: vs.TreeItem): vs.TreeItem {
        return element
    }

    override getChildren(element?: vs.TreeItem): vs.ProviderResult<vs.TreeItem[]> {
        return [] // book
    }
}
