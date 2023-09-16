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
exports.SidebarWebViewProvider = void 0;
const vs = __importStar(require("vscode"));
const utils = __importStar(require("./utils"));
class SidebarWebViewProvider {
    resolveWebviewView(webviewView, _) {
        this.webView = webviewView;
        this.webView.title = "Sidebar Webview!";
        webviewView.webview.options = {
            enableCommandUris: true,
            enableForms: true,
            enableScripts: true,
            localResourceRoots: [utils.extUri, utils.homeDirPath]
        };
        webviewView.webview.html = `<!DOCTYPE html>
        <html><head>
            <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel='stylesheet' type='text/css' href='${webviewView.webview.asWebviewUri(utils.cssPath('reset'))}'>
            <link rel='stylesheet' type='text/css' href='${webviewView.webview.asWebviewUri(utils.cssPath('vscode'))}'>
            <link rel='stylesheet' type='text/css' href='${webviewView.webview.asWebviewUri(utils.cssPath('main'))}'>
            <script>
                const vs = acquireVsCodeApi()
            </script>
        </head><body>
            <b>Config</b> Webview
            <hr>
            <textarea height='77' width='90%' id='tmp'></textarea>
            <hr>
            <button onclick="vs.postMessage({'digit':'dis ROX'})">Click Dat</button>
            <hr>
            <input type='checkbox' id='chk'><label for='chk'>Check it</label>
            <hr>
            <input type='radio' id='rad'><label for='rad'>Rad it</label>
            <hr>
            <input type='text' id='txt'><label for='txt'>Text it</label>
            <hr>
            <select><option>Select Dis</option><option>Select Dat</option></select>
            <script>
            window.addEventListener('message', (evt) => {
                document.getElementById('tmp').innerText = JSON.stringify(evt.data)
            })
            </script>
        </body></html>`;
        webviewView.webview.onDidReceiveMessage(data => {
            vs.window.showInformationMessage(JSON.stringify(data));
        });
    }
}
exports.SidebarWebViewProvider = SidebarWebViewProvider;
