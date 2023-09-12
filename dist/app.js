import { query, w2layout, w2sidebar, w2utils, w2confirm } from '/w2ui/w2ui.es6.js'
import { setToolbarIcon, logErr, logInfo, newObjName } from './util.js'

import { proj_series } from './proj_series.js'
import { config_authors } from './config_authors.js'

const appViews = [
    proj_series,
    config_authors
]

guiMain = {
    div: query('#main'),
    layout: new w2layout({
        name: 'main_layout',
        padding: 4,
        panels: [
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
            { type: 'main', html: 'main' },
        ]
    }),
    sidebar: new w2sidebar({
        name: 'sidebar',
        toggleAlign: 'left',
        nodes: [
            {
                id: 'project', text: 'Project', group: true, expanded: true, groupShowHide: false, nodes: [
                    { id: 'proj_series', text: 'Series', icon: 'fa fa-cubes', nodes: [] },
                    { id: 'proj_books', text: 'Books', icon: 'fa fa-book' },
                    { id: 'proj_sitegen', text: 'SiteGen', icon: 'fa fa-globe' },
                    { id: 'proj_settings', text: 'Settings', icon: 'fa fa-wrench' }
                ],
            },
            {
                id: 'config', text: 'Config', group: true, expanded: true, groupShowHide: false, nodes: [
                    { id: 'cfg_authors', text: 'Authors', icon: 'fa fa-vcard', appView: config_authors }
                ],
            },
            {
                id: 'log', text: 'Log', group: true, expanded: true, groupShowHide: false, nodes: [],
            },
        ],
        dataToUI: () => {
            const sidebar_node = guiMain.sidebar.get('proj_series')
            guiMain.sidebar.remove(...sidebar_node.nodes.map(_ => _.id))
            if (appState.proj.series && appState.proj.series.length)
                guiMain.sidebar.insert('proj_series', null, appState.proj.series.map(_ => {
                    return { id: 'proj_series_' + _.id, text: _.id, series: _, icon: 'fa fa-cubes' }
                }))
        },
        onContextMenu(evt) {
            switch (evt.target) {
                case 'proj_series':
                    this.menu = [{ id: 'proj_series_addnew', text: 'Add New Series...', icon: 'fa fa-plus' }]
                    break
            }
            if (evt.target.startsWith && evt.target.startsWith('proj_series_'))
                this.menu = [{ id: 'proj_series_delete', text: 'Delete...', icon: 'fa fa-plus' }]
        },
        onMenuClick(evt) {
            switch (evt.detail.menuItem.id) {
                case 'proj_series_delete':
                    const node = guiMain.sidebar.get(evt.target)
                    if (node && node.series && node.series.id) {
                        w2confirm('Remove the "' + node.series.id + '" series from the project files, including all its episodes and their layouts and letterings?<br/><br/>(Picture files, whether scanned or generated, will not be deleted from the file system.)')
                            .yes(() => {
                                appState.proj.series = appState.proj.series.filter(_ => _.id != node.series.id)
                                guiMain.sidebar.dataToUI()
                                onDirtyProj(true)
                            })
                    }
                    break
                case 'proj_series_addnew':
                    const name = newObjName('Series', appState.proj.series.map(_ => _.id))
                    appState.proj.series.push({ id: name })
                    guiMain.sidebar.dataToUI()
                    guiMain.sidebar.expand('proj_series')
                    guiMain.sidebar.select('proj_series_' + name)
                    onDirtyProj(true)
                    break
            }
        },
    }),
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
        postBody.proj = appState.proj;
    if (cfg)
        postBody.config = appState.config;
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
    fetch('/appState', { method: 'POST', priority: 'high' })
        .then((resp) => {
            if (!resp.ok)
                return req.onErr(resp)
            return resp.json()
                .then((latestAppState) => {
                    if (!latestAppState)
                        return
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
    const toolbar = guiMain.layout.panels[0].toolbar;
    toolbar.refresh()
    const neither_dirty = toolbar.get('menu_proj:menu_proj_save').disabled && toolbar.get('menu_cfg:menu_cfg_save').disabled
    toolbar[neither_dirty ? 'disable' : 'enable']('both_save')
}
function onDirtyProj(dirty) {
    setToolbarIcon(guiMain.layout.panels[0].toolbar, 'menu_proj', 'fa ' + (dirty ? 'fa-save' : 'fa-check-circle'))
    guiMain.layout.panels[0].toolbar[dirty ? 'enable' : 'disable']('menu_proj:menu_proj_save')
    onDirtyChanged()
}
function onDirtyCfg(dirty) {
    setToolbarIcon(guiMain.layout.panels[0].toolbar, 'menu_cfg', 'fa ' + (dirty ? 'fa-save' : 'fa-check-circle'))
    guiMain.layout.panels[0].toolbar[dirty ? 'enable' : 'disable']('menu_cfg:menu_cfg_save')
    onDirtyChanged()
}

// guiMain.sidebar.on('*', (evt) => { console.log('guiMain.sidebar', evt) })
guiMain.sidebar.on('click', (evt) => {
    // if sub-nodes, expand-or-collapse
    if (evt.object && evt.object.id && evt.object.nodes && evt.object.nodes.length) {
        evt.object.selected = false
        guiMain.sidebar.toggle(evt.object.id)
    }
    // if appView on node, show it
    if (evt.detail && evt.detail.node && evt.detail.node.appView)
        guiMain.layout.html('main', evt.detail.node.appView)
})

guiMain.layout.render('#main')
guiMain.layout.html('left', guiMain.sidebar)
guiMain.layout.html('main', '')

for (const appView of appViews)
    appView.onGuiMainInited(onDirtyProj, onDirtyCfg)

appStateReload(true, true)
console.log("initial appState:", appState)
