"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vs = require("vscode");
const sidebar = require("./sidebar");
function activate(ctx) {
    ctx.subscriptions.push(vs.commands.registerCommand('comiclab.helloWorld', () => { vs.window.showInformationMessage('Hello World from ComicLab!'); }));
    ctx.subscriptions.push(vs.window.registerTreeDataProvider('comiclabExplorerProjColls', new sidebar.NavProjColls()));
    ctx.subscriptions.push(vs.window.registerTreeDataProvider('comiclabExplorerProjBooks', new sidebar.NavProjBooks()));
    ctx.subscriptions.push(vs.window.registerTreeDataProvider('comiclabExplorerProjSites', new sidebar.NavProjSites()));
    ctx.subscriptions.push(vs.window.registerTreeDataProvider('comiclabExplorerCfg', new sidebar.NavCfg()));
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=main.js.map