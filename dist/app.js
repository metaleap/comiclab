import { w2layout, w2sidebar, w2toolbar, w2utils, w2popup, query } from '/w2ui/w2ui-2.0.es6.js'
import { config_authors } from '/config-authors.js'

export const gui_main = {
    div: query('#main'),
    layout: new w2layout({
        name: 'main_layout',
        padding: 4,
        panels: [
            {
                type: 'left', size: 200, resizable: true, html: '', toolbar: {
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
            { type: 'main', html: 'main' },
        ]
    }),
    sidebar: new w2sidebar({
        name: 'sidebar',
        nodes: [
            {
                id: 'project', text: 'Project', icon: 'fa fa-sitemap', group: true, expanded: true, groupShowHide: false, nodes: [
                    { id: 'proj_series', text: 'Series', icon: 'fa fa-sitemap', count: 0, selected: true },
                    { id: 'proj_ebooks', text: 'eBooks', count: 0, icon: 'fa fa-tablet' },
                    { id: 'proj_sitegen', text: 'SiteGen', icon: 'fa fa-globe' },
                    { id: 'proj_settings', text: 'Settings', icon: 'fa fa-wrench' }
                ],
            },
            {
                id: 'config', text: 'Config', group: true, expanded: true, groupShowHide: false, nodes: [
                    { id: 'cfg_authors', text: 'Authors', icon: 'fa fa-vcard', count: 0 }
                ],
            },
            {
                id: 'log', text: 'Log', group: true, expanded: true, groupShowHide: false, nodes: [],
            },
        ],
    }),
}

export function logErr(err) { logMsg(true, err) }
export function logInfo(msg) { logMsg(false, msg) }
export function logMsg(isErr, msg) {
    const now = new Date()
    logMsg.mostRecentItem = gui_main.sidebar.insert('log', logMsg.mostRecentItem,
        {
            id: 'log_item_' + now.getTime(), count: now.toLocaleTimeString(undefined, { hour12: false }), text: msg, tooltip: msg, icon: 'fa ' + (isErr ? 'fa-info-circle' : 'fa-exclamation-triangle'),
            onClick(evt) {
                w2popup.open({ title: now.toTimeString(), text: msg })
            }
        },
    ).id
    gui_main.sidebar.expand('log')
}

function lockUnlock(locked) {
    if (locked)
        w2utils.lock(gui_main.div, { spinner: true })
    else
        w2utils.unlock(gui_main.div)
}

function onPreReq(proj, cfg) {
    if (proj)
        setToolbarIcon(gui_main.layout.panels[0].toolbar, 'menu_proj', 'fa fa-spinner')
    if (cfg)
        setToolbarIcon(gui_main.layout.panels[0].toolbar, 'menu_cfg', 'fa fa-spinner')
    lockUnlock(true)
    let failed = false
    return {
        onErr: (err) => {
            failed = true
            logErr(err)
        },
        onDone: () => {
            lockUnlock(false)
            const icon = 'fa ' + (failed ? 'fa-exclamation-triangle' : 'fa-check-circle')
            if (proj) {
                setToolbarIcon(gui_main.layout.panels[0].toolbar, 'menu_proj', icon)
                onDirtyProj(failed)
            }
            if (cfg) {
                setToolbarIcon(gui_main.layout.panels[0].toolbar, 'menu_cfg', icon)
                onDirtyCfg(failed)
            }
        },
    }
}

function appStateReload(proj, cfg) {
    const req = onPreReq(proj, cfg)
    fetch('/appState', { method: 'POST', priority: 'high' })
        .finally(req.onDone)
        .catch(req.onErr)
        .then((resp) => {
            if (!resp.ok)
                throw (resp.statusText)
            return resp.json().catch(req.onErr)
        }).then((latestAppState) => {
            console.log(latestAppState)
            if (latestAppState && proj) {
                appState.proj = latestAppState.Proj
                gui_main.div.trigger(new Event('reloadedproj', { 'proj': proj, 'cfg': cfg }))
            }
            if (latestAppState && cfg) {
                appState.config = latestAppState.Config
                gui_main.div.trigger(new Event('reloadedcfg', { 'proj': proj, 'cfg': cfg }))
            }
        })
}

function appStateSave(proj, cfg) {
    const req = onPreReq(proj, cfg)
    req.onDone()
}

export function on(evtName, handlerFunc) {
    gui_main.div.on(evtName, handlerFunc)
}

export function onDirtyChanged() {
    const toolbar = gui_main.layout.panels[0].toolbar;
    toolbar.refresh()
    const neither_dirty = toolbar.get('menu_proj:menu_proj_save').disabled && toolbar.get('menu_cfg:menu_cfg_save').disabled
    toolbar[neither_dirty ? 'disable' : 'enable']('both_save')
}
export function onDirtyProj(dirty) {
    gui_main.layout.panels[0].toolbar[dirty ? 'enable' : 'disable']('menu_proj:menu_proj_save')
    onDirtyChanged()
}
export function onDirtyCfg(dirty) {
    gui_main.layout.panels[0].toolbar[dirty ? 'enable' : 'disable']('menu_cfg:menu_cfg_save')
    onDirtyChanged()
}

function setToolbarIcon(toolbar, id, icon) {
    const item = toolbar.get(id)
    if (item) {
        item.icon = icon
        toolbar.refresh()
    }
}

// gui_main.sidebar.on('*', (evt) => { console.log('gui_main.sidebar', evt) })
gui_main.sidebar.on('click', (evt) => {
    switch (evt.target) {
        case 'cfg_authors':
            gui_main.layout.html('main', config_authors)
            break;
    }
})

gui_main.layout.render('#main')
gui_main.layout.html('left', gui_main.sidebar)
gui_main.layout.html('main', 'Welcome')




for (const ctl of [
    config_authors,
])
    ctl.onGuiMainInited(gui_main, onDirtyProj, onDirtyCfg)

appStateReload(true, true)
