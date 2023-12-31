import * as vs from 'vscode'
import * as º from './_º'
import * as utils from './utils'
import * as sidebar from './sidebar'
import * as config_editor from './config_editor'
import * as coll_editor from './coll_editor'
import * as page_editor from './page_editor'

import fetch from 'node-fetch'



export let dirtyProj = false
export let dirtyCfg = false
export let events = {
	refreshed: new utils.Event<StateEvent>(),
	saved: new utils.Event<StateEvent>,
	modifiedProj: new utils.Event<º.Proj>(),
	modifiedCfg: new utils.Event<º.Config>(),
}
export type StateEvent = { cfg?: boolean, proj?: boolean, from: { reload?: boolean, userModify?: boolean } }


const apiUri = 'http://localhost:64646'
const colorGreen = new vs.ThemeColor('charts.green')
const colorOrange = new vs.ThemeColor('charts.orange')
const colorRed = new vs.ThemeColor('charts.red')



let statusBarItem: vs.StatusBarItem
let everLoadedFully: boolean


function onDirty(proj: boolean, cfg: boolean, preserveStatusText: boolean) {
	dirtyCfg = cfg
	dirtyProj = proj
	if (dirtyCfg || dirtyProj) {
		statusBarItem.color = colorOrange
		if (!preserveStatusText)
			statusBarItem.text = `$(save-as) Unsaved changes to ` + msgSuffix(proj, cfg)
	}
}

export function activate(context: vs.ExtensionContext) {
	utils.onInit(context)

	utils.disp(vs.commands.registerCommand('comiclab.menu', cmdMainMenu))
	utils.disp(statusBarItem = vs.window.createStatusBarItem('id', vs.StatusBarAlignment.Left, 987654321))
	statusBarItem.text = "$(sync~spin) ComicLab loading..."
	statusBarItem.command = 'comiclab.menu'
	statusBarItem.show()

	sidebar.onInit()
	coll_editor.onInit()
	page_editor.onInit()

	events.modifiedCfg.on((modifiedCfg) => {
		onDirty(dirtyProj, true, false)
		º.appState.config = modifiedCfg
		events.refreshed.now({ cfg: true, from: { userModify: true } })
	})
	events.modifiedProj.on((modifiedProj) => {
		onDirty(true, dirtyCfg, false)
		º.appState.proj = modifiedProj
		events.refreshed.now({ proj: true, from: { userModify: true } })
	})

	const diag = vs.languages.createDiagnosticCollection("ComicLab")
	utils.disp(diag)

	appStateReload(true, true, () => {
		vs.commands.executeCommand('workbench.view.extension.comiclabExplorer')
			.then(() => vs.commands.executeCommand('comiclabExplorerProjColls.focus'))
			.then(() => vs.commands.executeCommand('comiclab.proj.colls.openPage', 'short-stories/2309-just-drive/page001'))
	})
}

function cmdMainMenu() {
	vs.commands.executeCommand('workbench.view.extension.comiclabExplorer')
	let itemSaveProj: vs.QuickPickItem = { label: "Save Project Changes", iconPath: new vs.ThemeIcon('save'), alwaysShow: true }
	let itemSaveCfg: vs.QuickPickItem = { label: "Save Config Changes", iconPath: new vs.ThemeIcon('save'), alwaysShow: true }
	let itemSaveBoth: vs.QuickPickItem = { label: "Save Both", iconPath: new vs.ThemeIcon('save-all'), alwaysShow: true }
	let itemReloadProj: vs.QuickPickItem = { label: "Reload Project", iconPath: new vs.ThemeIcon('refresh'), alwaysShow: true }
	let itemReloadCfg: vs.QuickPickItem = { label: "Reload Config", iconPath: new vs.ThemeIcon('refresh'), alwaysShow: true }
	let itemReloadBoth: vs.QuickPickItem = { label: everLoadedFully ? "Reload Both" : "Reload", iconPath: new vs.ThemeIcon('refresh'), alwaysShow: true }
	let itemConfig: vs.QuickPickItem = { label: "Config...", iconPath: new vs.ThemeIcon('tools'), alwaysShow: true }
	let items: vs.QuickPickItem[] = [itemConfig]
	if (!everLoadedFully)
		items.push(itemReloadBoth)
	else {
		if (dirtyProj)
			items.push(itemSaveProj)
		if (dirtyCfg)
			items.push(itemSaveCfg)
		if (dirtyCfg && dirtyProj)
			items.push(itemSaveBoth)
		if (dirtyProj)
			items.push(itemReloadProj)
		if (dirtyCfg)
			items.push(itemReloadCfg)
		if (dirtyCfg && dirtyProj)
			items.push(itemReloadBoth)
	}

	vs.window.showQuickPick(items, { title: "ComicLab" }).then((item) => {
		switch (item) {
			case itemConfig:
				sidebar.showWebview()
				config_editor.show()
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

function appStateReload(proj: boolean, cfg: boolean, onSuccess?: () => void) {
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
					onDirty(proj ? false : dirtyProj, cfg ? false : dirtyCfg, true) // happens in onDone for good, but also must occur before below event triggers
					if (proj)
						º.appState.proj = latestAppState.proj
					if (cfg)
						º.appState.config = latestAppState.config
					if (proj && cfg)
						everLoadedFully = true
					if (proj || cfg)
						events.refreshed.now({ proj: proj, cfg: cfg, from: { reload: true } })
					statusBarItem.text = "$(pass-filled) ComicLab reloaded " + msg_suffix
					if (onSuccess) onSuccess()
				})
				.catch(req.onErr)
		})
		.catch(req.onErr)
		.finally(req.onDone)
}

function appStateSave(proj: boolean, cfg: boolean) {
	const msg_suffix = msgSuffix(proj, cfg)
	statusBarItem.text = "$(sync~spin) ComicLab saving changes to " + msg_suffix + "..."
	const req = prepFetch(proj, cfg)
	const postBody: any = {}
	if (proj)
		postBody.proj = º.appState.proj
	if (cfg)
		postBody.config = º.appState.config
	fetch(apiUri + '/appState', { method: 'POST', body: JSON.stringify(postBody), headers: { "Content-Type": "application/json" }, })
		.then((resp) => {
			if (!resp.ok)
				req.onErr(resp)
			else {
				onDirty(proj ? false : dirtyProj, cfg ? false : dirtyCfg, true) // happens in onDone for good, but also must occur before below event triggers
				events.saved.now({ proj: proj, cfg: cfg, from: { reload: true } })
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
				utils.alert(msg)
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
