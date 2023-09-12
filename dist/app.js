import { query, w2layout, w2sidebar, w2utils, w2confirm } from '/w2ui/w2ui.es6.js'
import { arrayMoveItem, setToolbarIcon, logErr, logInfo, newObjName } from './util.js'

import { proj_series } from './proj_series.js'
import { proj_episode } from './proj_episode.js'
import { proj_pagelayout } from './proj_pagelayout.js'
import { config_authors } from './config_authors.js'

const appViews = [
    config_authors,
    proj_series,
    proj_episode,
    proj_pagelayout,
]

let appViewActive = null
let sideBarLists = {
    'proj_series': {
        appView: proj_series, name: 'Series', itemIcon: 'fa fa-cubes', deletePrompt: id => 'Remove the "' + id + '" series from the project files, including all its episodes and their page layouts, letterings and translations?<br/><br/>(Picture files, whether scanned or generated, will not be deleted from the file system.)',
        binding: (set) => {
            if (set)
                appState.proj.series = set
            return appState.proj.series ?? []
        },
        subList: (series) => {
            const ret_episodes = {}
            ret_episodes['proj_series_' + series.id] = {
                appView: proj_episode, name: 'Episode', itemIcon: 'fa fa-cube', deletePrompt: id => 'Remove the "' + id + '" episode from the project files, including all its page layouts, letterings and translations?<br/><br/>(Picture files, whether scanned or generated, will not be deleted from the file system.)',
                binding: (set) => {
                    if (set)
                        series.episodes = set
                    return series.episodes ?? []
                },
                subList: (episode) => {
                    const ret_pagelayouts = {}
                    ret_pagelayouts['proj_series_' + series.id + '_' + episode.id] = {
                        appView: proj_pagelayout, name: 'Page', itemIcon: 'fa fa-th', deletePrompt: id => 'Remove the "' + id + '" page from the project files, including all its letterings and translations?<br/><br/>(Picture files, whether scanned or generated, will not be deleted from the file system.)',
                        binding: (set) => {
                            if (set)
                                episode.pages = set
                            return episode.pages ?? []
                        },
                    }
                    return ret_pagelayouts
                },
            }
            return ret_episodes
        },
    },
}

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
                    { id: 'proj_series', text: 'Series &amp; Episodes', icon: sideBarLists['proj_series'].itemIcon, nodes: [], expanded: true },
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
            const sel_node_id = guiMain.sidebar.selected
            let sel_node = guiMain.sidebar.get(sel_node_id)
            guiMain.sidebar.unselect()
            const app_view = appViewActive
            appViewSet(null)
            const perSideBarList = (node_id, list_info) => {
                const sidebar_node = guiMain.sidebar.get(node_id)
                if (sidebar_node)
                    guiMain.sidebar.remove(...sidebar_node.nodes.map(_ => _.id))
                const data_src = list_info.binding()
                if (!(data_src && data_src.length && data_src.length > 0))
                    return
                guiMain.sidebar.insert(node_id, null, data_src.map(_ => ({ id: node_id + '_' + _.id, text: _.id, icon: list_info.itemIcon, appView: list_info.appView, record: _, })))
                sideBarSubList(list_info, data_src, perSideBarList)
            }
            for (const node_id in sideBarLists)
                perSideBarList(node_id, sideBarLists[node_id])
            // restore selection & view if possible
            appViewSet(app_view)
            if (sel_node_id && sel_node_id.length && guiMain.sidebar.get(sel_node_id)) {
                guiMain.sidebar.expandParents(sel_node_id)
                guiMain.sidebar.select(sel_node_id)
            } else if (sel_node && sel_node.parent && sel_node.record) {
                sel_node = (guiMain.sidebar.find(sel_node.parent.id, { record: sel_node.record }) ?? sel_node.parent)
                guiMain.sidebar.expandParents(sel_node.id)
                guiMain.sidebar.select(sel_node.id)
            }
            guiMain.sidebar.each(node => {
                if (node.id.startsWith(proj_series.name))
                    node.count = (node.nodes && node.nodes.length && node.nodes.length > 0) ? node.nodes.length : undefined
            })
            guiMain.sidebar.refresh()
        },
        onContextMenu(evt) {
            this.menu = []
            const perSideBarList = (node_id, list_info) => {
                let data_src = list_info.binding()
                if (evt.target == node_id)
                    this.menu.push({ id: node_id + '_addnew', text: 'Add New ' + list_info.name + '...', icon: 'fa fa-plus' })
                if (evt.object && evt.object.text && evt.object.record && evt.target.startsWith && evt.target.startsWith(node_id + '_') && evt.target.lastIndexOf('_') == node_id.length) {
                    this.menu.push({ id: node_id + '_delete', text: 'Delete "' + evt.object.text + '"...', icon: 'fa fa-remove' })
                    const idx = data_src.findIndex(_ => _.id == evt.object.record.id)
                    this.menu.push({ id: node_id + '_moveup', text: 'Move "' + evt.object.text + '" Up', disabled: idx == 0, icon: 'fa fa-angle-up' })
                    this.menu.push({ id: node_id + '_movedown', text: 'Move "' + evt.object.text + '" Down', disabled: idx == (data_src.length - 1), icon: 'fa fa-angle-down' })
                    this.menu.push({ id: node_id + '_movefirst', text: 'Move "' + evt.object.text + '" To Top', disabled: idx == 0, icon: 'fa fa-angle-double-up' })
                    this.menu.push({ id: node_id + '_movelast', text: 'Move "' + evt.object.text + '" To End', disabled: idx == (data_src.length - 1), icon: 'fa fa-angle-double-down' })
                }
                sideBarSubList(list_info, undefined, perSideBarList)
            }
            for (const node_id in sideBarLists)
                perSideBarList(node_id, sideBarLists[node_id])
        },
        onMenuClick(evt) {
            const perSideBarList = (node_id, list_info) => {
                let data_src = list_info.binding()
                const item_node = guiMain.sidebar.get(evt.target)
                switch (evt.detail.menuItem.id) {
                    case node_id + '_addnew':
                        const name = newObjName(list_info.name, data_src.map(_ => _.id))
                        const new_item = { id: name }
                        data_src.push(new_item)
                        data_src = list_info.binding(data_src)
                        if (list_info.isCfg) { onDirtyCfg(true) } else { onDirtyProj(true) }
                        guiMain.sidebar.expandParents(node_id + '_' + name)
                        guiMain.sidebar.select(node_id + '_' + name)
                        list_info.appView.record = new_item
                        appViewSet(list_info.appView)
                        break
                    case node_id + '_delete':
                        if (item_node && item_node.record && item_node.record.id) {
                            w2confirm(list_info.deletePrompt(item_node.record.id))
                                .yes(() => {
                                    data_src = data_src.filter(_ => _.id != item_node.record.id)
                                    data_src = list_info.binding(data_src)
                                    if (list_info.isCfg) { onDirtyCfg(true) } else { onDirtyProj(true) }
                                })
                        }
                        break
                    default:
                        if (item_node && item_node.record && item_node.record.id) {
                            let idx = data_src.findIndex(_ => _.id == item_node.record.id)
                            if (idx >= 0) {
                                let moved = false
                                if (evt.detail.menuItem.id == (node_id + '_moveup') && idx > 0) {
                                    data_src = arrayMoveItem(data_src, idx, idx - 1)
                                    moved = true
                                } else if (evt.detail.menuItem.id == (node_id + '_movedown') && idx < (data_src.length - 1)) {
                                    data_src = arrayMoveItem(data_src, idx, idx + 1)
                                    moved = true
                                } else if (evt.detail.menuItem.id == (node_id + '_movefirst') && idx > 0) {
                                    data_src = arrayMoveItem(data_src, idx, 0)
                                    moved = true
                                } else if (evt.detail.menuItem.id == (node_id + '_movelast') && idx != (data_src.length - 1)) {
                                    data_src = arrayMoveItem(data_src, idx, data_src.length - 1)
                                    moved = true
                                }
                                if (moved) {
                                    data_src = list_info.binding(data_src)
                                    if (list_info.isCfg) { onDirtyCfg(true) } else { onDirtyProj(true) }
                                }
                            }
                        }
                        break
                }
                sideBarSubList(list_info, data_src, perSideBarList)
            }
            for (const node_id in sideBarLists) {
                const list_info = sideBarLists[node_id]
                perSideBarList(node_id, list_info)
            }
        },
    }),
}

function sideBarSubList(listInfo, dataSrc, perSideBarList) {
    if (listInfo.subList) {
        if (!dataSrc)
            dataSrc = listInfo.binding()
        for (const record of dataSrc) {
            const sub_list_info = listInfo.subList(record)
            if (sub_list_info)
                for (const k in sub_list_info)
                    perSideBarList(k, sub_list_info[k])
        }
    }
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
                    appViewSet(null)
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
    guiMain.sidebar.dataToUI()
}
function onDirtyCfg(dirty) {
    setToolbarIcon(guiMain.layout.panels[0].toolbar, 'menu_cfg', 'fa ' + (dirty ? 'fa-save' : 'fa-check-circle'))
    guiMain.layout.panels[0].toolbar[dirty ? 'enable' : 'disable']('menu_cfg:menu_cfg_save')
    onDirtyChanged()
}

function appViewSet(appView) {
    appViewActive = appView
    guiMain.layout.html('main', appView ? appView : '')
}

// guiMain.sidebar.on('*', (evt) => { console.log('guiMain.sidebar', evt) })
guiMain.sidebar.on('click', (evt) => {
    // if sub-nodes, expand-or-collapse
    if (evt.object && evt.object.id && evt.object.nodes && evt.object.nodes.length) {
        evt.object.selected = false
        guiMain.sidebar.toggle(evt.object.id)
    }
    // if appView on node, show it
    if (evt.detail && evt.detail.node && evt.detail.node.appView) {
        if (evt.detail.node.appView.setRecord && evt.detail.node.record)
            evt.detail.node.appView.setRecord(evt.detail.node.record)
        appViewSet(evt.detail.node.appView)
    }
})

guiMain.layout.render('#main')
guiMain.layout.html('left', guiMain.sidebar)
appViewSet(null)

for (const appView of appViews)
    appView.onGuiMainInited(onDirtyProj, onDirtyCfg)

appStateReload(true, true)
console.log("initial appState:", appState)
