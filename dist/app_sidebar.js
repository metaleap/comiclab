import { w2sidebar, w2confirm, w2tooltip } from './w2ui/w2ui.es6.js'
import { arrayMoveItem, newObjName } from './util.js'

import { onDirtyProj, onDirtyCfg } from './app_guimain.js'
import { appViews, appViewActive, appViewSetActive } from './app_views.js'

let listInfos = {
    'pages': {
        name: 'Page', icon: 'fa-th-large', contains: [], appView: appViews.proj_pagelayout,
        deletePrompt: id => `Remove the '${id}' page from the project files, including all its letterings and translations?<br/><br/>(Picture files, whether scanned or generated, will not be deleted from the file system.)`,
    },
    'collections': {
        name: 'Collection', icon: 'fa-briefcase', contains: ['collections', 'pages'], appView: appViews.proj_collection,
        deletePrompt: id => `Remove the '${id}' collection from the project files, including all its sub-collections and page layouts, letterings and translations?<br/><br/>(Picture files, whether scanned or generated, will not be deleted from the file system.)`,
    },
}

export const app_sidebar = new w2sidebar({
    name: 'sidebar',
    toggleAlign: 'left',
    nodes: [
        {
            id: 'project', text: 'Project: ' + uiProjName, group: true, expanded: true, groupShowHide: false, nodes: [
                { id: 'proj_collections', listOf: ['collections'], text: 'Collections', icon: 'fa fa-archive', nodes: [], appView: appViews.proj_settings_content },
                { id: 'proj_books', text: 'Books', icon: 'fa fa-book', disabled: true },
                { id: 'proj_sitegen', text: 'SiteGen', icon: 'fa fa-globe', disabled: true },
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
        // capture current selection / view for possible restore later
        const sel_node_id = app_sidebar.selected
        let sel_node = app_sidebar.get(sel_node_id)
        const app_view = appViewActive
        appViewSetActive(null)

        // actual refresh
        const refreshList = (listNode, listOwner) => {
            if (!(listNode.listOf && listNode.listOf.length))
                return
            app_sidebar.remove(...listNode.nodes.map(_ => _.id))
            for (const list_of of listNode.listOf) {
                const sub_info = listInfos[list_of]
                const list = listOwner[list_of]
                if (list && list.length)
                    app_sidebar.insert(listNode.id, null, list.map(_ => ({
                        id: listNode.id + '_' + list_of + '_' + _.id, listOf: sub_info.contains, ownKind: list_of,
                        text: _.id, icon: 'fa ' + sub_info.icon, appView: sub_info.appView, record: _,
                    })))
            }
            for (const sub_node of listNode.nodes)
                refreshList(sub_node, sub_node.record)
        }
        for (const node of app_sidebar.get('project').nodes)
            refreshList(node, appState.proj)

        // restore selection & view if possible
        appViewSetActive(app_view)
        if (sel_node_id && sel_node_id.length && app_sidebar.get(sel_node_id))
            clickNode(sel_node_id)
        else if (sel_node && sel_node.parent && sel_node.record) {
            const found = app_sidebar.find(sel_node.parent.id, { record: sel_node.record })
            clickNode((found && found.length && app_sidebar.get(found[0])) ? found[0].id : sel_node.parent.id)
        }
        app_sidebar.refresh()
    },

    onMenuClick(evt) {
        if (evt.detail.menuItem.onClick)
            return evt.detail.menuItem.onClick()
    },

    onContextMenu(evt) {
        this.menu = []
        const node_id = evt.target
        const node = app_sidebar.get(node_id)

        // 'Add' action
        for (const list_of of node.listOf) {
            const sub_info = listInfos[list_of]
            const owner = node.record ?? appState.proj
            let list = owner[list_of]
            if (!(list && list.length)) {
                owner[list_of] = []
                list = owner[list_of]
            }
            this.menu.push({
                icon: 'fa fa-plus', text: 'Add new ' + sub_info.name + ' to ' + (node.record ? `'${node.record.id}'` : 'project') + '...',
                onClick: () => {
                    const new_item = { id: newObjName(sub_info.name, list.length, (n) => !list.some(_ => _.id == n)) }
                    list.push(new_item)
                    if (sub_info.isCfg) { onDirtyCfg(true) } else { onDirtyProj(true) } // refresh. brings node into sidebar
                    const new_node_id = node_id + '_' + list_of + '_' + new_item.id
                    clickNode(new_node_id)
                },
            })
        }

        // 'Delete' & 'Move' actions
        if (node.ownKind) {
            const list_info = listInfos[node.ownKind]
            let parent_list = appState.proj[node.ownKind]
            let parent_list_mut = (newList) => { appState.proj[node.ownKind] = newList }
            if (node.parent && node.parent.record && node.parent.listOf?.length) {
                parent_list = node.parent.record[node.ownKind]
                parent_list_mut = (newList) => { node.parent.record[node.ownKind] = newList }
            }
            if (parent_list) {
                if (this.menu.length)
                    this.menu.push({ text: '--' })
                const idx = parent_list.indexOf(node.record)
                const moveIt = (idxNew) => {
                    parent_list_mut(arrayMoveItem(parent_list, idx, idxNew))
                    if (list_info.isCfg) { onDirtyCfg(true) } else { onDirtyProj(true) } // refresh. reorders node in sidebar
                }
                this.menu.push({ text: `Move '${node.record.id}' Up`, disabled: (idx == 0), icon: 'fa fa-angle-up', onClick: () => moveIt(idx - 1) })
                this.menu.push({ text: `Move '${node.record.id}' Down`, disabled: (idx == (parent_list.length - 1)), icon: 'fa fa-angle-down', onClick: () => moveIt(idx + 1) })
                this.menu.push({ text: `Move '${node.record.id}' To Top`, disabled: (idx == 0), icon: 'fa fa-angle-double-up', onClick: () => moveIt(0) })
                this.menu.push({ text: `Move '${node.record.id}' To End`, disabled: (idx == (parent_list.length - 1)), icon: 'fa fa-angle-double-down', onClick: () => moveIt(parent_list.length - 1) })
                this.menu.push({
                    text: `Delete '${node.record.id}'...`, icon: 'fa fa-remove',
                    onClick: () => w2confirm(list_info.deletePrompt(node.record.id)).yes(() => {
                        appViewSetActive(null)
                        parent_list_mut(parent_list.filter(_ => _.id != node.record.id))
                        if (list_info.isCfg) { onDirtyCfg(true) } else { onDirtyProj(true) } // refresh. drops node from sidebar
                        clickNode(node.parent.id)
                    }),
                })
            }
        }
    },
})

function clickNode(nodeID) {
    app_sidebar.unselect()
    app_sidebar.expandParents(nodeID)
    app_sidebar.click(nodeID)
    app_sidebar.expand(nodeID)
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
