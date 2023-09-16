"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavProjSites = exports.NavProjBooks = exports.NavProjColls = void 0;
const utils = __importStar(require("./utils"));
class NavProjColls {
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element)
            return [
                { id: "samplescoll", label: "short-stories", iconPath: utils.iconPath('box-archive') },
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
