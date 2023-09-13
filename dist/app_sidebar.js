import { w2sidebar, w2confirm } from './w2ui/w2ui.es6.js'
import { arrayMoveItem, newObjName } from './util.js'

import { onDirtyProj, onDirtyCfg } from './app_guimain.js'
import { appViews, appViewActive, appViewSet } from './app_views.js'

let sideBarLists = {
    'proj_series': {
        appView: appViews.proj_series, name: 'Series', itemIcon: 'fa fa-cubes', deletePrompt: id => 'Remove the "' + id + '" series from the project files, including all its episodes and their page layouts, letterings and translations?<br/><br/>(Picture files, whether scanned or generated, will not be deleted from the file system.)',
        binding: (set) => {
            if (set)
                appState.proj.series = set
            return appState.proj.series ?? []
        },
        subList: (series) => {
            const ret_episodes = {}
            ret_episodes['proj_series_' + series.id] = {
                appView: appViews.proj_episode, name: 'Episode', itemIcon: 'fa fa-cube', deletePrompt: id => 'Remove the "' + id + '" episode from the project files, including all its page layouts, letterings and translations?<br/><br/>(Picture files, whether scanned or generated, will not be deleted from the file system.)',
                binding: (set) => {
                    if (set)
                        series.episodes = set
                    return series.episodes ?? []
                },
                subList: (episode) => {
                    const ret_pagelayouts = {}
                    ret_pagelayouts['proj_series_' + series.id + '_' + episode.id] = {
                        appView: appViews.proj_pagelayout, name: 'Page', itemIcon: 'fa fa-th', deletePrompt: id => 'Remove the "' + id + '" page from the project files, including all its letterings and translations?<br/><br/>(Picture files, whether scanned or generated, will not be deleted from the file system.)',
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

export const app_sidebar = new w2sidebar({
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
                { id: 'config_authors', text: 'Authors', icon: 'fa fa-vcard', appView: appViews.config_authors },
                { id: 'config_pagelayouts', text: 'Page Layouting', icon: 'fa fa-th', appView: appViews.config_pagelayouts },
            ],
        },
        {
            id: 'log', text: 'Log', group: true, expanded: true, groupShowHide: false, nodes: [],
        },
    ],
    dataToUI: () => {
        const sel_node_id = app_sidebar.selected
        let sel_node = app_sidebar.get(sel_node_id)
        app_sidebar.unselect()
        const app_view = appViewActive
        appViewSet(null)
        const perSideBarList = (node_id, list_info) => {
            const sidebar_node = app_sidebar.get(node_id)
            if (sidebar_node)
                app_sidebar.remove(...sidebar_node.nodes.map(_ => _.id))
            const data_src = list_info.binding()
            if (!(data_src && data_src.length && data_src.length > 0))
                return
            app_sidebar.insert(node_id, null, data_src.map(_ => ({ id: node_id + '_' + _.id, text: _.id, icon: list_info.itemIcon, appView: list_info.appView, record: _, })))
            sideBarSubList(list_info, data_src, perSideBarList)
        }
        for (const node_id in sideBarLists)
            perSideBarList(node_id, sideBarLists[node_id])
        // restore selection & view if possible
        appViewSet(app_view)
        if (sel_node_id && sel_node_id.length && app_sidebar.get(sel_node_id)) {
            app_sidebar.expandParents(sel_node_id)
            app_sidebar.select(sel_node_id)
        } else if (sel_node && sel_node.parent && sel_node.record) {
            sel_node = (app_sidebar.find(sel_node.parent.id, { record: sel_node.record }) ?? sel_node.parent)
            app_sidebar.expandParents(sel_node.id)
            app_sidebar.select(sel_node.id)
        }
        app_sidebar.each(node => {
            if (node.id.startsWith('proj_series'))
                node.count = (node.nodes && node.nodes.length && node.nodes.length > 0) ? node.nodes.length : undefined
        })
        app_sidebar.refresh()
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
            const item_node = app_sidebar.get(evt.target)
            switch (evt.detail.menuItem.id) {
                case node_id + '_addnew':
                    const name = newObjName(list_info.name, data_src.map(_ => _.id))
                    const new_item = { id: name }
                    data_src.push(new_item)
                    data_src = list_info.binding(data_src)
                    if (list_info.isCfg) { onDirtyCfg(true) } else { onDirtyProj(true) }
                    app_sidebar.expandParents(node_id + '_' + name)
                    app_sidebar.select(node_id + '_' + name)
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
})

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

// app_sidebar.on('*', (evt) => { console.log('app_sidebar', evt) })
app_sidebar.on('click', (evt) => {
    // if sub-nodes, expand-or-collapse
    if (evt.object && evt.object.id && evt.object.nodes && evt.object.nodes.length) {
        evt.object.selected = false
        app_sidebar.toggle(evt.object.id)
    }
    // if appView on node, show it
    if (evt.detail && evt.detail.node && evt.detail.node.appView) {
        if (evt.detail.node.appView.setRecord && evt.detail.node.record)
            evt.detail.node.appView.setRecord(evt.detail.node.record)
        appViewSet(evt.detail.node.appView)
    }
})
