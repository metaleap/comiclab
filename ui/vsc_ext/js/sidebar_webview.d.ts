import * as vs from 'vscode';
export declare class SidebarWebViewProvider implements vs.WebviewViewProvider {
    webView?: vs.WebviewView;
    resolveWebviewView(webviewView: vs.WebviewView, _: vs.WebviewViewResolveContext<unknown>): void;
}
