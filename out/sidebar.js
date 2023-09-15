"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarNav = void 0;
const vs = require("vscode");
class NavItem extends vs.TreeItem {
}
class SidebarNav {
    constructor(isProj) {
        this.isProj = isProj;
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element)
            if (this.isProj) {
                return [
                    { id: "proj.collections", label: "Collections", iconPath: "media/svg/box-archive.svg" },
                    { id: "proj.books", label: "Books", iconPath: "media/svg/book.svg" },
                    { id: "proj.sitegen", label: "SiteGen", iconPath: "media/svg/globe.svg" },
                ];
            }
            else {
                return [
                    { id: "cfg.contentAuthoring", label: "Content Authoring", iconPath: "media/svg/compass-drafting.svg" },
                ];
            }
        return [];
    }
}
exports.SidebarNav = SidebarNav;
//# sourceMappingURL=sidebar.js.map