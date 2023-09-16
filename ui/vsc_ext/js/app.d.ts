import * as vs from 'vscode';
export type Proj = {};
export type Config = {};
export type State = {
    proj: Proj;
    config: Config;
};
export declare const state: State;
export declare let dirtyCfg: boolean;
export declare let dirtyProj: boolean;
export declare function activate(context: vs.ExtensionContext): void;
export declare function appStateReload(proj: boolean, cfg: boolean): void;
export declare function appStateSave(proj: boolean, cfg: boolean): void;
