import * as vs from 'vscode'

class NavItem extends vs.TreeItem {
}

export class SidebarNav implements vs.TreeDataProvider<NavItem>{

    isProj: boolean

    constructor(isProj: boolean) {
        this.isProj = isProj
    }

    getTreeItem(element: NavItem): vs.TreeItem {
        return element
    }

    getChildren(element?: NavItem): vs.ProviderResult<NavItem[]> {
        if (!element)
            if (this.isProj) {
                return [
                    { id: "proj.collections", label: "Collections", iconPath: "media/svg/box-archive.svg" },
                    { id: "proj.books", label: "Books", iconPath: "media/svg/book.svg" },
                    { id: "proj.sitegen", label: "SiteGen", iconPath: "media/svg/globe.svg" },
                ]
            } else {
                return [
                    { id: "cfg.contentAuthoring", label: "Content Authoring", iconPath: "media/svg/compass-drafting.svg" },
                ]
            }
        return []
    }

}
