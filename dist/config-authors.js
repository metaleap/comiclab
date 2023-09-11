import { w2grid } from '/w2ui/w2ui.js'

export const config_authors = new w2grid({
    name: "config_authors",
    selectType: 'row',
    multiSelect: true,
    show: {
        columnMenu: false,
        toolbar: true,
        toolbarAdd: true,
        toolbarDelete: true,
        toolbarEdit: false,
        toolbarSearch: false,
        toolbarReload: false,
    },
    autoLoad: false,
    recid: 'author_id',
    advanceOnEdit: true,
    columns: [
        { field: "author_id", text: "ID", sortable: true, editable: { type: 'text' } },
        { field: "author_name", text: "Full Name", sortable: true, editable: { type: 'text' } },
    ],
    records: [
    ],
})

// config_authors.on('*', (evt) => { console.log('config_authors', evt) })
config_authors.on('change', (evt) => {
    if (!evt.detail.value.new) {
        evt.detail.value.new = evt.detail.value.previous
        evt.isCancelled = true
        evt.preventDefault()
    } else
        config_authors.onDirtyCfg()
})
config_authors.on('add', (evt) => {
    const initialID = 'newAuthorID' + new Date().getTime()
    config_authors.add({ author_id: initialID, author_name: 'New Author Full Name' })
    config_authors.scrollIntoView(initialID)
    config_authors.editField(initialID, 0)
    config_authors.onDirtyCfg()
})

config_authors.onGuiMainInited = (gui_main, onDirtyProj, onDirtyCfg) => {
    config_authors.onDirtyCfg = onDirtyCfg
    gui_main.div.on('reloadedcfg', (evt) => {
        config_authors.records = []
        for (const id in appState.config.Authors)
            config_authors.records.push({ author_id: id, author_name: appState.config.Authors[id] })
        config_authors.refresh()
    })
}
