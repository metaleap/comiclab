import * as vs from 'vscode'
import * as sidebar from './sidebar'

export function activate(ctx: vs.ExtensionContext) {
	ctx.subscriptions.push(vs.commands.registerCommand('comiclab.helloWorld', () => { vs.window.showInformationMessage('Hello World from ComicLab!') }))
	ctx.subscriptions.push(vs.window.registerTreeDataProvider('comiclabExplorerProjColls', new sidebar.NavProjColls()))
	ctx.subscriptions.push(vs.window.registerTreeDataProvider('comiclabExplorerProjBooks', new sidebar.NavProjBooks()))
	ctx.subscriptions.push(vs.window.registerTreeDataProvider('comiclabExplorerProjSites', new sidebar.NavProjSites()))
	ctx.subscriptions.push(vs.window.registerTreeDataProvider('comiclabExplorerCfg', new sidebar.NavCfg()))
}

export function deactivate() {
}
