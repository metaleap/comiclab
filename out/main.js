"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vs = require("vscode");
const sidebar_1 = require("./sidebar");
function activate(ctx) {
    ctx.subscriptions.push(vs.commands.registerCommand('comiclab.helloWorld', () => { vs.window.showInformationMessage('Hello World from ComicLab!'); }));
    ctx.subscriptions.push(vs.window.registerTreeDataProvider('comiclabExplorerProj', new sidebar_1.SidebarNav(true)));
    ctx.subscriptions.push(vs.window.registerTreeDataProvider('comiclabExplorerCfg', new sidebar_1.SidebarNav(false)));
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=main.js.map