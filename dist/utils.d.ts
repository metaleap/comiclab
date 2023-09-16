import * as vs from 'vscode';
export declare let disp: (...items: {
    dispose(): any;
}[]) => number;
export declare let extUri: vs.Uri;
export declare let homeDirPath: vs.Uri;
export declare function onInit(context: vs.ExtensionContext): void;
export declare function iconPath(name: string): {
    light: vs.Uri;
    dark: vs.Uri;
};
export declare function imgPath(name: string): vs.Uri;
export declare function cssPath(name: string): vs.Uri;
