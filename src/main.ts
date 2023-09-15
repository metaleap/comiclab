import * as vs from 'vscode'
import { SidebarNav } from './sidebar'

export function activate(ctx: vs.ExtensionContext) {
	ctx.subscriptions.push(vs.commands.registerCommand('comiclab.helloWorld', () => { vs.window.showInformationMessage('Hello World from ComicLab!') }))
	ctx.subscriptions.push(vs.window.registerTreeDataProvider('comiclabExplorerProj', new SidebarNav(true)))
	ctx.subscriptions.push(vs.window.registerTreeDataProvider('comiclabExplorerCfg', new SidebarNav(false)))
}

export function deactivate() {
}
