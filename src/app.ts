import * as vs from 'vscode'
import * as sidebar from './sidebar'

import fetch from 'node-fetch'

export function activate(ctx: vs.ExtensionContext) {
	ctx.subscriptions.push(vs.commands.registerCommand('comiclab.appStateReload', appStateReload))
	ctx.subscriptions.push(vs.commands.registerCommand('comiclab.appStateSave', appStateSave))
	ctx.subscriptions.push(vs.window.registerTreeDataProvider('comiclabExplorerProjColls', new sidebar.NavProjColls()))
	ctx.subscriptions.push(vs.window.registerTreeDataProvider('comiclabExplorerProjBooks', new sidebar.NavProjBooks()))
	ctx.subscriptions.push(vs.window.registerTreeDataProvider('comiclabExplorerProjSites', new sidebar.NavProjSites()))
	ctx.subscriptions.push(vs.window.registerTreeDataProvider('comiclabExplorerCfg', new sidebar.NavCfg()))
}

export function deactivate() {
}

export function appStateReload() {

}

export function appStateSave() {

}
