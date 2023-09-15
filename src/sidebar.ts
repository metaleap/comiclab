import * as vs from 'vscode'
import * as utils from './utils'

export class NavProjColls implements vs.TreeDataProvider<vs.TreeItem>{
    getTreeItem(element: vs.TreeItem): vs.TreeItem {
        return element
    }

    getChildren(element?: vs.TreeItem): vs.ProviderResult<vs.TreeItem[]> {
        if (!element)
            return [
                { id: "samplescoll", label: "short-stories", iconPath: utils.iconPath('box-archive') },
            ]

        return []
    }
}

export class NavProjBooks implements vs.TreeDataProvider<vs.TreeItem>{
    getTreeItem(element: vs.TreeItem): vs.TreeItem {
        return element
    }

    getChildren(element?: vs.TreeItem): vs.ProviderResult<vs.TreeItem[]> {
        return [] // book
    }
}

export class NavProjSites implements vs.TreeDataProvider<vs.TreeItem>{
    getTreeItem(element: vs.TreeItem): vs.TreeItem {
        return element
    }

    getChildren(element?: vs.TreeItem): vs.ProviderResult<vs.TreeItem[]> {
        return []  // globe
    }
}
