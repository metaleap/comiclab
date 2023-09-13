import { w2grid } from '/w2ui/w2ui.es6.js'
import { newObjName } from './util.js'

const tab_authors = {
    id: 'tab_authors',
    text: 'Authors',
    ctl: new w2grid({
        name: "tab_authors_ctl",
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
    }),
    dataToUI: () => {
        tab_authors.ctl.records = []
        if (appState.config && appState.config.authors)
            for (const id in appState.config.authors)
                tab_authors.ctl.records.push({ author_id: id, author_name: appState.config.authors[id] })
        tab_authors.ctl.refresh()
    },
    dataFromUI: () => {
        appState.config.authors = {}
        for (const rec of tab_authors.ctl.records)
            appState.config.authors[rec.author_id] = rec.author_name
    },
}

export const config_contentauthoring = {
    name: 'config_contentauthoring',
    tabbed: [
        tab_authors,
    ],
    dataFromUI: () => config_contentauthoring.tabbed.map(_ => _.dataFromUI()),
    dataToUI: () => config_contentauthoring.tabbed.map(_ => _.dataToUI()),
}

tab_authors.ctl.on('keydown', (evt) => {
    if (evt.detail && evt.detail.originalEvent && (evt.detail.originalEvent.key == 'Meta' || evt.detail.originalEvent.key == 'ContextMenu')) {
        evt.isCancelled = true
        evt.preventDefault()
    }
})

tab_authors.ctl.on('delete', (evt) => {
    setTimeout(() => { if (evt.phase == 'after') config_contentauthoring.onDirty(true) }, 1)
})
tab_authors.ctl.on('add', (evt) => {
    const initialID = newObjName('Author', tab_authors.ctl.records.map(_ => _.author_id))
    tab_authors.ctl.add({ author_id: initialID, author_name: 'New Author Full Name' })
    tab_authors.ctl.scrollIntoView(initialID)
    tab_authors.ctl.editField(initialID, 0)
    config_contentauthoring.onDirty(true)
})
tab_authors.ctl.on('change', (evt) => {
    console.log(evt)
    if (evt.detail.value.new && evt.detail.value.new.length) {
        const rec = tab_authors.ctl.records[evt.detail.index]
        const col = tab_authors.ctl.columns[evt.detail.column]
        rec[col.field] = evt.detail.value.new
        tab_authors.ctl.records[evt.detail.index] = rec
        config_contentauthoring.onDirty(true)
    } else {
        evt.detail.value.new = evt.detail.value.previous
        evt.isCancelled = true
        evt.preventDefault()
    }
})
