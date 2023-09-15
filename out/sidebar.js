"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavCfg = exports.NavProjSites = exports.NavProjBooks = exports.NavProjColls = void 0;
class NavProjColls {
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element)
            return [
                { id: "samplescoll", label: "short-stories", iconPath: "archive" },
            ];
        return [];
    }
}
exports.NavProjColls = NavProjColls;
class NavProjBooks {
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return []; // book
    }
}
exports.NavProjBooks = NavProjBooks;
class NavProjSites {
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return []; // globe
    }
}
exports.NavProjSites = NavProjSites;
class NavCfg {
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element)
            return [
                { id: "contentAuthoring", label: "Content Authoring", iconPath: "preview" },
            ];
        return [];
    }
}
exports.NavCfg = NavCfg;
//# sourceMappingURL=sidebar.js.map