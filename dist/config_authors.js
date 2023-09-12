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
        toolbarSave: false,
        toolbarSearch: false,
        toolbarReload: false,
        recordTitles: true,
    },
    autoLoad: false,
    advanceOnEdit: true,
    recid: 'author_id',
    columns: [
        { field: "author_id", text: "ID", sortable: true, editable: { type: 'text' } },
        { field: "author_name", text: "Full Name", sortable: true, editable: { type: 'text' } },
    ],
    records: [],
    dataToUI: () => {
        config_authors.records = []
        if (appState.config && appState.config.authors)
            for (const id in appState.config.authors)
                config_authors.records.push({ author_id: id, author_name: appState.config.authors[id] })
        config_authors.refresh()
    },
    dataFromUI: () => {
        appState.config.authors = {}
        for (const rec of config_authors.records)
            appState.config.authors[rec.author_id] = rec.author_name
    },
})

// config_authors.on('*', (evt) => { console.log('config_authors', evt) })
config_authors.on('delete', (evt) => {
    setTimeout(() => { if (evt.phase == 'after') config_authors.onDirtyCfg(true) }, 1)
})
config_authors.on('add', (evt) => {
    const initialID = 'newAuthorID' + new Date().getTime()
    config_authors.add({ author_id: initialID, author_name: 'New Author Full Name' })
    config_authors.scrollIntoView(initialID)
    config_authors.editField(initialID, 0)
    config_authors.onDirtyCfg(true)
})
config_authors.on('change', (evt) => {
    console.log(evt)
    if (evt.detail.value.new && evt.detail.value.new.length) {
        const rec = config_authors.records[evt.detail.index]
        const col = config_authors.columns[evt.detail.column]
        rec[col.field] = evt.detail.value.new
        config_authors.records[evt.detail.index] = rec
        config_authors.onDirtyCfg(true)
    } else {
        evt.detail.value.new = evt.detail.value.previous
        evt.isCancelled = true
        evt.preventDefault()
    }
})

config_authors.onGuiMainInited = (onDirtyProj, onDirtyCfg, setCount) => {
    config_authors.onDirtyCfg = (dirty) => {
        if (dirty)
            config_authors.dataFromUI()
        setCount(config_authors.records.length)
        onDirtyCfg(dirty)
    }
    guiMain.div.on('reloadedcfg', (evt) => {
        config_authors.dataToUI()
        setCount(config_authors.records.length)
    })
    guiMain.div.on('savedcfg', (evt) => {
        config_authors.refresh()
    })
}
