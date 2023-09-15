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
const colorBlue = new vs.ThemeColor('charts.blue')
const colorGreen = new vs.ThemeColor('charts.green')
const colorOrange = new vs.ThemeColor('charts.orange')
const colorRed = new vs.ThemeColor('charts.red')



export let dirtyCfg: boolean = true
export let dirtyProj: boolean = true
let statusBarItem: vs.StatusBarItem



export function activate(context: vs.ExtensionContext) {
	utils.onInit(context)

	utils.disp(vs.commands.registerCommand('comiclab.appState', appStateCommand))
	utils.disp(statusBarItem = vs.window.createStatusBarItem('id', vs.StatusBarAlignment.Left, 987654321))
	statusBarItem.text = "$(sync~spin) ComicLab loading..."
	statusBarItem.color = colorBlue
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
	let itemSaveProj: vs.QuickPickItem = { label: "Save Project Changes", iconPath: utils.iconPath('floppy-disk'), alwaysShow: true }
	let itemSaveCfg: vs.QuickPickItem = { label: "Save Config Changes", iconPath: utils.iconPath('floppy-disk'), alwaysShow: true }
	let itemSaveBoth: vs.QuickPickItem = { label: "Save Both", iconPath: utils.iconPath('floppy-disk'), alwaysShow: true }
	let itemReloadProj: vs.QuickPickItem = { label: "Reload Project", iconPath: utils.iconPath('arrows-rotate'), alwaysShow: true }
	let itemReloadCfg: vs.QuickPickItem = { label: "Reload Config", iconPath: utils.iconPath('arrows-rotate'), alwaysShow: true }
	let itemReloadBoth: vs.QuickPickItem = { label: "Reload Both", iconPath: utils.iconPath('arrows-rotate'), alwaysShow: true }
	let items = []
	if (dirtyCfg && dirtyProj)
		items.push(itemSaveBoth)
	if (dirtyCfg || true)
		items.push(itemSaveCfg)
	if (dirtyProj)
		items.push(itemSaveProj)
	items.push(itemReloadBoth, itemReloadProj, itemReloadCfg)

	vs.window.showQuickPick(items, { title: "ComicLab" }).then((item) => { })
}

export function appStateReload(proj: boolean, cfg: boolean) {
	const msgSuffix = ((proj && cfg) ? "project and config." : (proj ? "project." : (cfg ? "config." : "?!?!")))
	statusBarItem.text = "$(sync~spin) ComicLab reloading " + msgSuffix + "..."
	const req = prepFetch(proj, cfg)
	setTimeout(() => {
		fetch(apiUri + '/appState', { method: 'POST' })
			.then((resp) => {
				if (!resp.ok)
					return req.onErr(resp)
				return resp.json()
					.then((latestAppState) => {
						if (!latestAppState)
							return req.onErr("No error reported but nothing received, buggily. Frontend app state might be out of date, try again and fix that bug.")
						if (proj) {
							state.proj = latestAppState.proj
							dirtyProj = false
						}
						if (cfg) {
							state.config = latestAppState.config
							dirtyCfg = false
						}
						statusBarItem.color = colorGreen
						statusBarItem.text = "$(pass-filled) ComicLab reloaded " + msgSuffix
					})
					.catch(req.onErr)
			})
			.catch(req.onErr)
			.finally(req.onDone)
	}, 2345)
}

export function appStateSave() {

}

function prepFetch(proj: boolean, cfg: boolean) {
	statusBarItem.color = colorBlue
	statusBarItem.tooltip = ''
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
			const on_err = (err: any) => {
				const msg = err.toString()
				statusBarItem.color = colorRed
				statusBarItem.text = msg
				statusBarItem.tooltip = msg
				vs.window.showWarningMessage(msg)
			}
			if (err.statusText && err.statusText.length && err.statusText.length > 0 && err.text)
				err.text()
					.catch((_: any) => on_err(err.statusText))
					.then((s: string) => on_err((s && s.length && s.length > 0) ? s : err.statusText))
			else
				on_err(err)
		},
	}
}
