import { w2layout, w2sidebar, w2toolbar, w2utils, w2popup, query } from '/w2ui/w2ui-2.0.es6.js'
import { config_authors } from '/config-authors.js'

const appState = {
    proj: {},
    config: {},
}
const mainDiv = query('#main');

const gui_main = {
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
                    { id: 'proj_series', text: 'Series', icon: 'fa fa-sitemap', count: 2, selected: true },
                    { id: 'proj_ebooks', text: 'eBooks', count: 0, icon: 'fa fa-tablet' },
                    { id: 'proj_sitegen', text: 'SiteGen', icon: 'fa fa-globe' },
                    { id: 'proj_settings', text: 'Settings', icon: 'fa fa-wrench' }
                ],
            },
            {
                id: 'config', text: 'Config', group: true, expanded: true, groupShowHide: false, nodes: [
                    { id: 'cfg_authors', text: 'Authors', icon: 'fa fa-vcard', count: 11 }
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
            id: 'log_item_' + now.getTime(), count: now.toLocaleTimeString(undefined, {
                hour12: false,
            }), text: msg, tooltip: msg, icon: 'fa ' + (isErr ? 'fa-info-circle' : 'fa-exclamation-triangle'),
            onClick(evt) {
                w2popup.open({ title: now.toTimeString(), text: msg })
            }
        },
    ).id
    gui_main.sidebar.expand('log')
}

function lockUnlock(locked) {
    if (locked)
        w2utils.lock(mainDiv, { spinner: true })
    else
        w2utils.unlock(mainDiv)
}

function appStateReload(proj, cfg) {
    lockUnlock(true)
    fetch('/appState', { method: 'POST', priority: 'high' })
        .finally(lockUnlock(false))
        .catch(logErr)
        .then((resp) => {
            if (!resp.ok)
                throw (resp.statusText)
            return resp.json().catch(logErr)
        }).then((latestAppState) => {
            if (proj && latestAppState)
                appState.proj = latestAppState.proj
            if (cfg && latestAppState)
                appState.config = latestAppState.config
            if ((proj || cfg) && latestAppState)
                mainDiv.trigger('reloaded', { 'proj': proj, 'cfg': cfg })
        })
}

function appStateSave(proj, cfg) {
    lockUnlock(true)
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
