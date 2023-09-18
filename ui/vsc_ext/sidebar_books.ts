import * as vs from 'vscode'
import * as shared from './_shared_types'
import * as utils from './utils'
import * as sidebar from './sidebar'


export class NavProjBooks extends sidebar.TreeDataProvider {
    override getTreeItem(element: vs.TreeItem): vs.TreeItem {
        return element
    }

    override getChildren(element?: vs.TreeItem): vs.ProviderResult<vs.TreeItem[]> {
        return [] // book
    }
}
