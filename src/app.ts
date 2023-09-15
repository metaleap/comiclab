import * as vs from 'vscode'
import * as sidebar from './sidebar'
import * as utils from './utils'

import fetch from 'node-fetch'



export type Proj = {}

export type Config = {}

export type State = {
	proj: Proj
	config: Config
}



export const state: State = { proj: {}, config: {} }

const apiUri = 'http://localhost:64646'



export let dirtyCfg: boolean = true
export let dirtyProj: boolean = true
let statusBarItem: vs.StatusBarItem



export function activate(context: vs.ExtensionContext) {
	utils.onInit(context)

	utils.disp(vs.commands.registerCommand('comiclab.appState', appStateCommand))
	utils.disp(statusBarItem = vs.window.createStatusBarItem('id', vs.StatusBarAlignment.Left, 987654321))
	statusBarItem.text = '$(sync~spin) ComicLab loading...'
	statusBarItem.color = '#FFD700'
	statusBarItem.command = 'comiclab.appState'
	statusBarItem.show()

	utils.disp(vs.window.registerTreeDataProvider('comiclabExplorerProjColls', new sidebar.NavProjColls()))
	utils.disp(vs.window.registerTreeDataProvider('comiclabExplorerProjBooks', new sidebar.NavProjBooks()))
	utils.disp(vs.window.registerTreeDataProvider('comiclabExplorerProjSites', new sidebar.NavProjSites()))
	utils.disp(vs.window.registerTreeDataProvider('comiclabExplorerCfg', new sidebar.NavCfg()))

	appStateReload(true, true)
}

export function deactivate() { }

function appStateCommand() {
	let itemSaveProj: vs.QuickPickItem = { label: '$(save-as) Save Project Changes', iconPath: { id: 'save-as' }, alwaysShow: true }
	let itemSaveCfg: vs.QuickPickItem = { label: '$(save) Save Config Changes', iconPath: { id: 'save' }, alwaysShow: true }
	let itemSaveBoth: vs.QuickPickItem = { label: '$(save-all) Save Both', description: '', iconPath: { id: 'save-all' }, alwaysShow: true }
	let itemReloadProj: vs.QuickPickItem = { label: '$(refresh) Reload Project', iconPath: { id: 'refresh' }, alwaysShow: true }
	let itemReloadCfg: vs.QuickPickItem = { label: '$(refresh) Reload Config', iconPath: { id: 'refresh' }, alwaysShow: true }
	let itemReloadBoth: vs.QuickPickItem = { label: '$(refresh) Reload Both', description: '', iconPath: { id: 'refresh' }, alwaysShow: true }
	let items = []
	if (dirtyCfg && dirtyProj)
		items.push(itemSaveBoth)
	if (dirtyCfg)
		items.push(itemSaveCfg)
	if (dirtyProj)
		items.push(itemSaveProj)
	items.push(itemReloadBoth, itemReloadProj, itemReloadCfg)

	vs.window.showQuickPick(items, { title: 'The Title' }).then((item) => { })
}

export function appStateReload(proj: boolean, cfg: boolean) {
	statusBarItem.text = "$(sync~spin) Reloading..."
	const req = prepFetch(proj, cfg)
	fetch(apiUri + '/appState', { method: 'POST' })
		.then((resp) => {
			if (!resp.ok)
				return req.onErr(resp)
			return resp.json()
				.then((latestAppState) => {
					if (!latestAppState)
						return req.onErr('No error reported but nothing received, buggily. Frontend app state might be out of date, try again and fix that bug.')
					if (proj) {
						state.proj = latestAppState.proj
						dirtyProj = false
					}
					if (cfg) {
						state.config = latestAppState.config
						dirtyCfg = false
					}
					statusBarItem.text = '$(pass-filled) Reloaded ' + ((proj && cfg) ? 'project and config.' : (proj ? 'project.' : (cfg ? 'config.' : '?!?!')))
				})
				.catch(req.onErr)
		})
		.catch(req.onErr)
		.finally(req.onDone)
}

export function appStateSave() {

}

function prepFetch(proj: boolean, cfg: boolean) {
	// if (proj)
	// 	setToolbarIcon(guiMain.layout.panels[0].toolbar, 'menu_proj', 'fa fa-spinner')
	// if (cfg)
	// 	setToolbarIcon(guiMain.layout.panels[0].toolbar, 'menu_cfg', 'fa fa-spinner')
	let failed = false
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
		onErr: (err: any) => {
			failed = true
			const on_err = vs.window.showWarningMessage
			if (err.statusText && err.statusText.length && err.statusText.length > 0 && err.text)
				err.text()
					.catch((_: any) => on_err(err.statusText))
					.then((s: string) => on_err((s && s.length && s.length > 0) ? s : err.statusText))
			else
				on_err(err)
		},
	}
}
