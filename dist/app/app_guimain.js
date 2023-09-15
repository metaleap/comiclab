import { query, w2utils, w2tabs } from '../w2ui/w2ui.es6.js'
import { setToolbarIcon, logErr, logInfo, newLayout } from './util.js'

import { appViews, appViewSetActive, appViewRefresh } from './app_views.js'
import { app_sidebar } from './app_sidebar.js'

guiMain = {
    div: query('#main'),
    layout: newLayout('main_layout', [
        {
            type: 'left', size: 234, minSize: 55, maxSize: 555, resizable: true, html: '', toolbar: {
                tooltip: 'bottom',
                items: [
                    { type: 'spacer' },
                    {
                        type: 'menu', id: 'menu_proj', tooltip: 'Project: ' + uiProjPath, icon: 'fa fa-spinner', items: [
                            { id: 'menu_proj_save', text: 'Save Changes', icon: 'fa fa-save', disabled: true, },
                            { id: 'menu_proj_reload', text: 'Reload', icon: 'fa fa-refresh', },
                        ]
                    },
                    {
                        type: 'menu', id: 'menu_cfg', tooltip: 'Config: ' + uiCfgPath, icon: 'fa fa-spinner', items: [
                            { id: 'menu_cfg_save', text: 'Save Changes', icon: 'fa fa-save', disabled: true, },
                            { id: 'menu_cfg_reload', text: 'Reload', icon: 'fa fa-refresh', },
                        ]
                    },
                    { type: 'break' },
                    { type: 'button', id: 'both_reload', tooltip: 'Reload Both', icon: 'fa fa-refresh' },
                    { type: 'button', id: 'both_save', tooltip: 'Save Both', icon: 'fa fa-save', disabled: true },
                    { type: 'spacer' },
                ],
                onClick(evt) {
                    switch (evt.target) {
                        case 'menu_proj:menu_proj_reload':
                            appStateReload(true, false)
                            break
                        case 'menu_proj:menu_proj_save':
                            appStateSave(true, false)
                            break
                        case 'menu_cfg:menu_cfg_reload':
                            appStateReload(false, true)
                            break
                        case 'menu_cfg:menu_cfg_save':
                            appStateSave(false, true)
                            break
                        case 'both_reload':
                            appStateReload(true, true)
                            break
                        case 'both_save':
                            appStateSave(true, true)
                            break
                    }
                }
            }
        },
        {
            type: 'main', show: { tabs: true }, tabs: new w2tabs({
                name: 'main_tabs',
                tabs: [],
                onClick(evt) { guiMain.layout.html('main', evt.object.ctl) },
            })
        },
    ]),
    sidebar: app_sidebar,
}

function lockUnlock(locked) {
    if (locked)
        w2utils.lock(guiMain.div, { spinner: true })
    else
        w2utils.unlock(guiMain.div)
}

function prepReq(proj, cfg) {
    if (proj)
        setToolbarIcon(guiMain.layout.panels[0].toolbar, 'menu_proj', 'fa fa-spinner')
    if (cfg)
        setToolbarIcon(guiMain.layout.panels[0].toolbar, 'menu_cfg', 'fa fa-spinner')
    lockUnlock(true)
    let failed = false
    return {
        onDone: () => {
            lockUnlock(false)
            const icon = 'fa ' + (failed ? 'fa-exclamation-triangle' : 'fa-check-circle')
            if (proj) {
                onDirtyProj(failed)
                setToolbarIcon(guiMain.layout.panels[0].toolbar, 'menu_proj', icon)
            }
            if (cfg) {
                onDirtyCfg(failed)
                setToolbarIcon(guiMain.layout.panels[0].toolbar, 'menu_cfg', icon)
            }
        },
        onErr: (err) => {
            failed = true
            const on_err = logErr
            if (err.statusText && err.statusText.length && err.text && err.json && err.blob)
                err.text().
                    catch(_ => on_err(err.statusText)).
                    then(s => on_err((s && s.length) ? s : err.statusText))
            else
                on_err(err)
        },
    }
}

function appStateSave(proj, cfg) {
    const req = prepReq(proj, cfg)
    const postBody = {}
    if (proj)
        postBody.proj = appState.proj
    if (cfg)
        postBody.config = appState.config
    fetch('/appState', { method: 'POST', priority: 'high', body: JSON.stringify(postBody), headers: { "Content-Type": "application/json" }, })
        .then((resp) => {
            if (resp.ok) {
                logInfo('Saved changes to ' + ((proj && cfg) ? 'project and config.' : (proj ? 'project.' : (cfg ? 'config.' : '?!?!'))))
                if (proj) guiMain.div.trigger(new Event('savedproj'))
                if (cfg) guiMain.div.trigger(new Event('savedcfg'))
            } else
                req.onErr(resp)
        })
        .catch(req.onErr)
        .finally(req.onDone)
}

function appStateReload(proj, cfg) {
    const req = prepReq(proj, cfg)
    appViewSetActive(null)
    fetch('/appState', { method: 'POST', priority: 'high' })
        .then((resp) => {
            if (!resp.ok)
                return req.onErr(resp)
            return resp.json()
                .then((latestAppState) => {
                    if (!latestAppState)
                        return req.onErr('No error reported but nothing received, buggily. Frontend app state might be out of date, try again and fix that bug.')
                    if (proj) {
                        appState.proj = latestAppState.proj
                        guiMain.sidebar.dataToUI()
                        guiMain.div.trigger(new Event('reloadedproj'))
                    }
                    if (cfg) {
                        appState.config = latestAppState.config
                        guiMain.div.trigger(new Event('reloadedcfg'))
                    }
                    logInfo('Reloaded ' + ((proj && cfg) ? 'project and config.' : (proj ? 'project.' : (cfg ? 'config.' : '?!?!'))))
                })
                .catch(req.onErr)
        })
        .catch(req.onErr)
        .finally(req.onDone)
}

function onDirtyChanged() {
    const toolbar = guiMain.layout.panels[0].toolbar
    toolbar.refresh()
    const neither_dirty = toolbar.get('menu_proj:menu_proj_save').disabled && toolbar.get('menu_cfg:menu_cfg_save').disabled
    toolbar[neither_dirty ? 'disable' : 'enable']('both_save')
}
export function onDirtyProj(dirty) {
    setToolbarIcon(guiMain.layout.panels[0].toolbar, 'menu_proj', 'fa ' + (dirty ? 'fa-save' : 'fa-check-circle'))
    guiMain.layout.panels[0].toolbar[dirty ? 'enable' : 'disable']('menu_proj:menu_proj_save')
    onDirtyChanged()
}
export function onDirtyCfg(dirty) {
    setToolbarIcon(guiMain.layout.panels[0].toolbar, 'menu_cfg', 'fa ' + (dirty ? 'fa-save' : 'fa-check-circle'))
    guiMain.layout.panels[0].toolbar[dirty ? 'enable' : 'disable']('menu_cfg:menu_cfg_save')
    onDirtyChanged()
}

function onGuiMainInited(appView) {
    switch (true) {
        case appView.name.startsWith('config_'):
            appView.onDirty = (dirty) => {
                if (dirty)
                    appView.dataFromUI()
                onDirtyCfg(dirty)
            }
            guiMain.div.on('reloadedcfg', (evt) => { appView.dataToUI() })
            guiMain.div.on('savedcfg', (evt) => { appViewRefresh(appView) })
            break
        case appView.name.startsWith('proj_'):
            appView.onDirty = (dirty) => {
                if (dirty)
                    appView.dataFromUI()
                onDirtyProj(dirty)
            }
            guiMain.div.on('reloadedproj', (evt) => { appView.dataToUI() })
            guiMain.div.on('savedproj', (evt) => { appViewRefresh(appView) })
            break
    }
}

guiMain.layout.render('#main')
guiMain.layout.html('left', guiMain.sidebar)
appViewSetActive(null)

for (const appViewID in appViews)
    onGuiMainInited(appViews[appViewID])

appStateReload(true, true)
console.log("initial appState:", appState)
