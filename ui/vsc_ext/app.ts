import * as vs from 'vscode'
import { State, trigger, subscribe } from './_shared_types'
import * as utils from './utils'
import * as sidebar from './sidebar'
import { SidebarWebViewProvider } from './sidebar_webview'
import * as config_view from './config_view'

import fetch from 'node-fetch'



export const state: State = {
	proj: {}, config: { contentAuthoring: {} },
	onProjRefreshed: { handlers: [] },
	onCfgRefreshed: { handlers: [] },
	onProjSaved: { handlers: [] },
	onCfgSaved: { handlers: [] },
	onCfgModified: { handlers: [] },
	onProjModified: { handlers: [] },
}
let dirtyProj = false
let dirtyCfg = false


const apiUri = 'http://localhost:64646'
const colorGreen = new vs.ThemeColor('charts.green')
const colorOrange = new vs.ThemeColor('charts.orange')
const colorRed = new vs.ThemeColor('charts.red')



let statusBarItem: vs.StatusBarItem
let sidebarWebViewProvider: SidebarWebViewProvider


function onDirty(proj: boolean, cfg: boolean, preserveStatusText: boolean) {
	if ((dirtyCfg = cfg) || (dirtyProj = proj)) {
		statusBarItem.color = colorOrange
		if (!preserveStatusText)
			statusBarItem.text = `$(save-as) Unsaved changes to ` + msgSuffix(proj, cfg)
	}
}

export function activate(context: vs.ExtensionContext) {
	utils.onInit(context)

	utils.disp(vs.commands.registerCommand('comiclab.menu', mainMenu))
	utils.disp(statusBarItem = vs.window.createStatusBarItem('id', vs.StatusBarAlignment.Left, 987654321))
	statusBarItem.text = "$(sync~spin) ComicLab loading..."
	statusBarItem.command = 'comiclab.menu'
	statusBarItem.show()

	utils.disp(vs.window.registerTreeDataProvider('comiclabExplorerProjColls', new sidebar.NavProjColls()))
	utils.disp(vs.window.registerTreeDataProvider('comiclabExplorerProjBooks', new sidebar.NavProjBooks()))
	utils.disp(vs.window.registerTreeDataProvider('comiclabExplorerProjSites', new sidebar.NavProjSites()))
	utils.disp(vs.window.registerWebviewViewProvider('comicLabSidebarWebview', sidebarWebViewProvider = new SidebarWebViewProvider()))

	subscribe(state.onCfgModified, (modifiedCfg) => {
		onDirty(dirtyProj, true, false)
		state.config = modifiedCfg
		trigger(state.onCfgRefreshed, state)
	})

	appStateReload(true, true)
}

function mainMenu() {
	vs.commands.executeCommand('workbench.view.extension.comiclabExplorer')
	let itemSaveProj: vs.QuickPickItem = { label: "Save Project Changes", iconPath: utils.iconPath('floppy-disk'), alwaysShow: true }
	let itemSaveCfg: vs.QuickPickItem = { label: "Save Config Changes", iconPath: utils.iconPath('floppy-disk'), alwaysShow: true }
	let itemSaveBoth: vs.QuickPickItem = { label: "Save Both", iconPath: utils.iconPath('floppy-disk'), alwaysShow: true }
	let itemReloadProj: vs.QuickPickItem = { label: "Reload Project", iconPath: utils.iconPath('arrows-rotate'), alwaysShow: true }
	let itemReloadCfg: vs.QuickPickItem = { label: "Reload Config", iconPath: utils.iconPath('arrows-rotate'), alwaysShow: true }
	let itemReloadBoth: vs.QuickPickItem = { label: "Reload Both", iconPath: utils.iconPath('arrows-rotate'), alwaysShow: true }
	let itemConfig: vs.QuickPickItem = { label: "Config...", iconPath: utils.iconPath('screwdriver-wrench'), alwaysShow: true }
	let items = [itemConfig]
	if (dirtyCfg && dirtyProj)
		items.push(itemSaveBoth)
	if (dirtyCfg)
		items.push(itemSaveCfg)
	if (dirtyProj)
		items.push(itemSaveProj)
	items.push(itemReloadBoth, itemReloadProj, itemReloadCfg)

	vs.window.showQuickPick(items, { title: "ComicLab" }).then((item) => {
		switch (item) {
			case itemConfig:
				sidebarWebViewProvider.webView?.show(false)
				config_view.show()
				break
			case itemReloadBoth:
				appStateReload(true, true)
				break
			case itemReloadCfg:
				appStateReload(false, true)
				break
			case itemReloadProj:
				appStateReload(true, false)
				break
			case itemSaveBoth:
				appStateSave(true, true)
				break
			case itemSaveCfg:
				appStateSave(false, true)
				break
			case itemSaveProj:
				appStateSave(true, false)
				break
		}
	})
}

function msgSuffix(proj: boolean, cfg: boolean) {
	return ((proj && cfg) ? "project and config." : (proj ? "project." : (cfg ? "config." : "?!?!")))
}

export function appStateReload(proj: boolean, cfg: boolean) {
	const msg_suffix = msgSuffix(proj, cfg)
	statusBarItem.text = "$(sync~spin) ComicLab reloading " + msg_suffix + "..."
	const req = prepFetch(proj, cfg)
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
						trigger(state.onProjRefreshed, state)
					}
					if (cfg) {
						state.config = latestAppState.config
						trigger(state.onCfgRefreshed, state)
					}
					statusBarItem.text = "$(pass-filled) ComicLab reloaded " + msg_suffix
				})
				.catch(req.onErr)
		})
		.catch(req.onErr)
		.finally(req.onDone)
}

export function appStateSave(proj: boolean, cfg: boolean) {
	const msg_suffix = msgSuffix(proj, cfg)
	statusBarItem.text = "$(sync~spin) ComicLab saving changes to " + msg_suffix + "..."
	const req = prepFetch(proj, cfg)
	const postBody: any = {}
	if (proj)
		postBody.proj = state.proj
	if (cfg)
		postBody.config = state.config
	fetch(apiUri + '/appState', { method: 'POST', body: JSON.stringify(postBody), headers: { "Content-Type": "application/json" }, })
		.then((resp) => {
			if (!resp.ok)
				req.onErr(resp)
			else {
				if (proj) trigger(state.onProjSaved, state)
				if (cfg) trigger(state.onCfgSaved, state)
				statusBarItem.text = "$(pass-filled) ComicLab saved changes to " + msg_suffix
			}
		})
		.catch(req.onErr)
		.finally(req.onDone)
}

function prepFetch(proj: boolean, cfg: boolean) {
	statusBarItem.color = undefined
	statusBarItem.tooltip = ''
	let failed = false
	return {
		onDone: () => {
			onDirty(proj ? failed : dirtyProj, cfg ? failed : dirtyCfg, true)
			if (!(dirtyCfg || dirtyProj))
				statusBarItem.color = colorGreen
		},
		onErr: (err: any) => {
			failed = true
			const on_err = (err: any) => {
				const msg = err.toString()
				statusBarItem.color = colorRed
				statusBarItem.text = msg
				statusBarItem.tooltip = msg
				vs.window.showErrorMessage(msg, { modal: true })
			}
			if (err.statusText && err.statusText.length && err.statusText.length > 0 && err.text)
				err.text()
					.catch((_: any) => on_err(err.statusText))
					.then((s: string) => on_err((s && s.length > 0) ? s : err.statusText))
			else
				on_err(err)
		},
	}
}
