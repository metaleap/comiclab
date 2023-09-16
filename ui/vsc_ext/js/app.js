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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appStateSave = exports.appStateReload = exports.activate = exports.dirtyProj = exports.dirtyCfg = exports.state = void 0;
const vs = __importStar(require("vscode"));
const sidebar = __importStar(require("./sidebar"));
const utils = __importStar(require("./utils"));
const sidebar_webview_1 = require("./sidebar_webview");
const config_view = __importStar(require("./config_view"));
const node_fetch_1 = __importDefault(require("node-fetch"));
exports.state = { proj: {}, config: {} };
const apiUri = 'http://localhost:64646';
const colorGreen = new vs.ThemeColor('charts.green');
const colorOrange = new vs.ThemeColor('charts.orange');
const colorRed = new vs.ThemeColor('charts.red');
exports.dirtyCfg = false;
exports.dirtyProj = false;
let statusBarItem;
let sidebarWebViewProvider;
function activate(context) {
    utils.onInit(context);
    utils.disp(vs.commands.registerCommand('comiclab.menu', mainMenu));
    utils.disp(statusBarItem = vs.window.createStatusBarItem('id', vs.StatusBarAlignment.Left, 987654321));
    statusBarItem.text = "$(sync~spin) ComicLab loading...";
    statusBarItem.command = 'comiclab.menu';
    statusBarItem.show();
    utils.disp(vs.window.registerTreeDataProvider('comiclabExplorerProjColls', new sidebar.NavProjColls()));
    utils.disp(vs.window.registerTreeDataProvider('comiclabExplorerProjBooks', new sidebar.NavProjBooks()));
    utils.disp(vs.window.registerTreeDataProvider('comiclabExplorerProjSites', new sidebar.NavProjSites()));
    utils.disp(vs.window.registerWebviewViewProvider('comicLabSidebarWebview', sidebarWebViewProvider = new sidebar_webview_1.SidebarWebViewProvider()));
    appStateReload(true, true);
}
exports.activate = activate;
function mainMenu() {
    let itemSaveProj = { label: "Save Project Changes", iconPath: utils.iconPath('floppy-disk'), alwaysShow: true };
    let itemSaveCfg = { label: "Save Config Changes", iconPath: utils.iconPath('floppy-disk'), alwaysShow: true };
    let itemSaveBoth = { label: "Save Both", iconPath: utils.iconPath('floppy-disk'), alwaysShow: true };
    let itemReloadProj = { label: "Reload Project", iconPath: utils.iconPath('arrows-rotate'), alwaysShow: true };
    let itemReloadCfg = { label: "Reload Config", iconPath: utils.iconPath('arrows-rotate'), alwaysShow: true };
    let itemReloadBoth = { label: "Reload Both", iconPath: utils.iconPath('arrows-rotate'), alwaysShow: true };
    let itemConfig = { label: "Config...", iconPath: utils.iconPath('screwdriver-wrench'), alwaysShow: true };
    let items = [itemConfig];
    if (exports.dirtyCfg && exports.dirtyProj)
        items.push(itemSaveBoth);
    if (exports.dirtyCfg)
        items.push(itemSaveCfg);
    if (exports.dirtyProj)
        items.push(itemSaveProj);
    items.push(itemReloadBoth, itemReloadProj, itemReloadCfg);
    vs.window.showQuickPick(items, { title: "ComicLab" }).then((item) => {
        var _a;
        switch (item) {
            case itemConfig:
                (_a = sidebarWebViewProvider.webView) === null || _a === void 0 ? void 0 : _a.show(false);
                config_view.show(exports.state);
                break;
            case itemReloadBoth:
                appStateReload(true, true);
                break;
            case itemReloadCfg:
                appStateReload(false, true);
                break;
            case itemReloadProj:
                appStateReload(true, false);
                break;
            case itemSaveBoth:
                appStateSave(true, true);
                break;
            case itemSaveCfg:
                appStateSave(false, true);
                break;
            case itemSaveProj:
                appStateSave(true, false);
                break;
        }
    });
}
function appStateReload(proj, cfg) {
    const msgSuffix = ((proj && cfg) ? "project and config." : (proj ? "project." : (cfg ? "config." : "?!?!")));
    statusBarItem.text = "$(sync~spin) ComicLab reloading " + msgSuffix + "...";
    const req = prepFetch(proj, cfg);
    // setTimeout(() => {
    (0, node_fetch_1.default)(apiUri + '/appState', { method: 'POST' })
        .then((resp) => {
        if (!resp.ok)
            return req.onErr(resp);
        return resp.json()
            .then((latestAppState) => {
            if (!latestAppState)
                return req.onErr("No error reported but nothing received, buggily. Frontend app state might be out of date, try again and fix that bug.");
            if (proj) {
                exports.state.proj = latestAppState.proj;
                exports.dirtyProj = false;
            }
            if (cfg) {
                exports.state.config = latestAppState.config;
                exports.dirtyCfg = false;
            }
            statusBarItem.color = colorGreen;
            statusBarItem.text = "$(pass-filled) ComicLab reloaded " + msgSuffix;
        })
            .catch(req.onErr);
    })
        .catch(req.onErr)
        .finally(req.onDone);
    // }, 2345)
}
exports.appStateReload = appStateReload;
function appStateSave(proj, cfg) {
}
exports.appStateSave = appStateSave;
function prepFetch(proj, cfg) {
    statusBarItem.color = undefined;
    statusBarItem.tooltip = '';
    // if (proj)
    // 	setToolbarIcon(guiMain.layout.panels[0].toolbar, 'menu_proj', 'fa fa-spinner')
    // if (cfg)
    // 	setToolbarIcon(guiMain.layout.panels[0].toolbar, 'menu_cfg', 'fa fa-spinner')
    let failed = false;
    return {
        onDone: () => {
            if (proj) {
                // onDirtyProj(failed)
                // setToolbarIcon(guiMain.layout.panels[0].toolbar, 'menu_proj', icon)
            }
            if (cfg) {
                // onDirtyCfg(failed)
                // setToolbarIcon(guiMain.layout.panels[0].toolbar, 'menu_cfg', icon)
            }
        },
        onErr: (err) => {
            failed = true;
            const on_err = (err) => {
                const msg = err.toString();
                statusBarItem.color = colorRed;
                statusBarItem.text = msg;
                statusBarItem.tooltip = msg;
                vs.window.showErrorMessage(msg);
            };
            if (err.statusText && err.statusText.length && err.statusText.length > 0 && err.text)
                err.text()
                    .catch((_) => on_err(err.statusText))
                    .then((s) => on_err((s && s.length && s.length > 0) ? s : err.statusText));
            else
                on_err(err);
        },
    };
}
