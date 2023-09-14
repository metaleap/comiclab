import { w2sidebar, w2confirm, w2tooltip } from './w2ui/w2ui.es6.js'
import { arrayMoveItem, newObjName } from './util.js'

import { onDirtyProj, onDirtyCfg } from './app_guimain.js'
import { appViews, appViewActive, appViewSetActive } from './app_views.js'

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
                        appView: appViews.proj_pagelayout, name: 'Page', itemIcon: 'fa fa-th-large', deletePrompt: id => 'Remove the "' + id + '" page from the project files, including all its letterings and translations?<br/><br/>(Picture files, whether scanned or generated, will not be deleted from the file system.)',
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
            id: 'project', text: 'Project: ' + uiProjName, group: true, expanded: true, groupShowHide: false, nodes: [
                { id: 'proj_series', text: 'Series &amp; Episodes', icon: 'fa fa-archive', nodes: [], },
                { id: 'proj_books', text: 'Books', icon: 'fa fa-book', disabled: true },
                { id: 'proj_sitegen', text: 'SiteGen', icon: 'fa fa-globe', disabled: true },
                { id: 'proj_settings', text: 'Project Settings', icon: 'fa fa-wrench', appView: appViews.proj_settings }
            ],
        },
        {
            id: 'config', text: 'Config', group: true, expanded: true, groupShowHide: false, nodes: [
                { id: 'config_contentauthoring', text: 'Content Authoring', icon: 'fa fa-map', appView: appViews.config_contentauthoring },
            ],
        },
        {
            id: 'log', text: 'Log', group: true, expanded: true, groupShowHide: false, nodes: [],
        },
    ],
    dataToUI: () => {
        const sel_node_id = app_sidebar.selected
        let sel_node = app_sidebar.get(sel_node_id)
        const app_view = appViewActive
        appViewSetActive(null)
        const perSideBarList = (node_id, list_info) => {
            const sidebar_node = app_sidebar.get(node_id)
            if (sidebar_node)
                app_sidebar.remove(...sidebar_node.nodes.map(_ => _.id))
            const data_src = list_info.binding()
            if (!(data_src && data_src.length && data_src.length > 0))
                return
            app_sidebar.insert(node_id, null, data_src.map(_ => ({ id: node_id + '_' + _.id, text: _.id, icon: list_info.itemIcon, appView: list_info.appView, record: _, })))
            subList(list_info, data_src, perSideBarList)
        }
        for (const node_id in sideBarLists)
            perSideBarList(node_id, sideBarLists[node_id])
        // restore selection & view if possible
        appViewSetActive(app_view)
        if (sel_node_id && sel_node_id.length && app_sidebar.get(sel_node_id))
            clickNode(sel_node_id)
        else if (sel_node && sel_node.parent && sel_node.record)
            clickNode((app_sidebar.find(sel_node.parent.id, { record: sel_node.record }) ?? sel_node.parent).id)
        app_sidebar.each(node => {
            if (node.id.startsWith('proj_series'))
                node.count = (node.nodes && node.nodes.length && node.nodes.length > 0) ? node.nodes.length : undefined
        })
        app_sidebar.refresh()
    },
    onContextMenu(evt) {
        this.menu = []
        const perSideBarList = (node_id, list_info) => {
            subList(list_info, undefined, perSideBarList)
            let data_src = list_info.binding()
            let num_items = this.menu.length
            if (evt.target == node_id)
                this.menu.push({ id: node_id + '_addnew', text: 'Add New ' + list_info.name + '...', icon: 'fa fa-plus' })
            if (evt.object && evt.object.text && evt.object.record && evt.target.startsWith && evt.target.startsWith(node_id + '_') && evt.target.lastIndexOf('_') == node_id.length) {
                const idx = data_src.findIndex(_ => _.id == evt.object.record.id)
                this.menu.push({ id: node_id + '_moveup', text: 'Move "' + evt.object.text + '" Up', disabled: idx == 0, icon: 'fa fa-angle-up' })
                this.menu.push({ id: node_id + '_movedown', text: 'Move "' + evt.object.text + '" Down', disabled: idx == (data_src.length - 1), icon: 'fa fa-angle-down' })
                this.menu.push({ id: node_id + '_movefirst', text: 'Move "' + evt.object.text + '" To Top', disabled: idx == 0, icon: 'fa fa-angle-double-up' })
                this.menu.push({ id: node_id + '_movelast', text: 'Move "' + evt.object.text + '" To End', disabled: idx == (data_src.length - 1), icon: 'fa fa-angle-double-down' })
                this.menu.push({ id: node_id + '_delete', text: 'Delete "' + evt.object.text + '"...', icon: 'fa fa-remove' })
            }
            if (this.menu.length > num_items)
                this.menu.push({ text: '--' })
        }
        for (const node_id in sideBarLists)
            perSideBarList(node_id, sideBarLists[node_id])
        if (this.menu.length && this.menu[this.menu.length - 1].text == '--')
            this.menu.pop()
    },
    onMenuClick(evt) {
        const perSideBarList = (node_id, list_info) => {
            let data_src = list_info.binding()
            const item_node = app_sidebar.get(evt.target)
            switch (evt.detail.menuItem.id) {
                case node_id + '_addnew':
                    const name = newObjName(list_info.name, data_src.length)
                    const new_item = { id: name }
                    data_src.push(new_item)
                    data_src = list_info.binding(data_src)
                    if (list_info.isCfg) { onDirtyCfg(true) } else { onDirtyProj(true) }
                    clickNode(node_id + '_' + name)
                    appViewSetActive(list_info.appView, new_item)
                    break
                case node_id + '_delete':
                    if (item_node && item_node.record && item_node.record.id) {
                        w2confirm(list_info.deletePrompt(item_node.record.id))
                            .yes(() => {
                                appViewSetActive(null)
                                data_src = data_src.filter(_ => _.id != item_node.record.id)
                                data_src = list_info.binding(data_src)
                                if (list_info.isCfg) { onDirtyCfg(true) } else { onDirtyProj(true) }
                                clickNode(item_node.parent.id)
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
            subList(list_info, data_src, perSideBarList)
        }
        for (const node_id in sideBarLists) {
            const list_info = sideBarLists[node_id]
            perSideBarList(node_id, list_info)
        }
    },
})

function clickNode(nodeID) {
    app_sidebar.unselect()
    app_sidebar.expandParents(nodeID)
    app_sidebar.click(nodeID)
    app_sidebar.expand(nodeID)
}

function subList(listInfo, dataSrc, perSideBarList) {
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
app_sidebar.on('keydown', (evt) => {
    if (evt.detail && evt.detail.originalEvent && evt.detail.originalEvent.keyCode == 27)
        w2tooltip.hide() // it's really for closing the open context menu, if any
})
app_sidebar.on('click', (evt) => {
    // if appView on node, show it
    if (evt.detail && evt.detail.node && evt.detail.node.appView)
        appViewSetActive(evt.detail.node.appView, evt.detail.node.record)
})
