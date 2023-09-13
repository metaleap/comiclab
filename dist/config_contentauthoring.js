import { w2grid } from '/w2ui/w2ui.es6.js'
import { newGrid } from './util.js'

const tab_authors = {
    id: 'tab_authors',
    text: '📇 Authors',
    ctl: newGrid('tab_authors_grid', 'Author', 'author_id', (dirty) => config_contentauthoring.onDirty(dirty), [
        { field: "author_id", text: "ID", sortable: true, editable: { type: 'text' } },
        { field: "author_name", text: "Full Name", sortable: true, editable: { type: 'text' } },
    ]),
    dataToUI: () => {
        tab_authors.ctl.records = []
        if (appState.config && appState.config.authors)
            for (const id in appState.config.authors)
                tab_authors.ctl.records.push({ 'author_id': id, 'author_name': appState.config.authors[id] })
        tab_authors.ctl.refresh()
    },
    dataFromUI: () => {
        appState.config.authors = {}
        for (const rec of tab_authors.ctl.records)
            appState.config.authors[rec.author_id] = rec.author_name
    },
}

const tab_pageformats = {
    id: 'tab_pageformats',
    text: '📐 Page Formats',
    ctl: newGrid('tab_pageformats_grid', 'PageFormat', 'pageformat_id', (dirty) => config_contentauthoring.onDirty(dirty), [
        { field: "pageformat_id", text: "ID", sortable: true, editable: { type: 'text' } },
        { field: "widthMm", text: "Width (mm)", sortable: false, render: 'int', editable: { type: 'int', min: 0, max: 123 } },
        { field: "heightMm", text: "Height (mm)", sortable: false, render: 'int', editable: { type: 'int', min: 0, max: 123 } },
    ]),
    dataToUI: () => {
        tab_pageformats.ctl.records = []
        if (appState.config && appState.config.pageFormats)
            for (const id in appState.config.pageFormats)
                tab_pageformats.ctl.records.push({ 'pageformat_id': id, 'widthMm': appState.config.pageFormats[id].widthMm, 'heightMm': appState.config.pageFormats[id].heightMm })
        tab_pageformats.ctl.refresh()
    },
    dataFromUI: () => {
        appState.config.pageFormats = {}
        for (const rec of tab_pageformats.ctl.records) {
            console.log(rec)
            console.log()
            appState.config.pageFormats[rec.pageformat_id] = { 'widthMm': rec.widthMm, 'heightMm': rec.heightMm }
            console.log(appState.config.pageFormats[rec.pageformat_id])
        }
    },
}

export const config_contentauthoring = {
    name: 'config_contentauthoring',
    tabbed: [
        tab_authors,
        tab_pageformats,
    ],
    dataFromUI: () => config_contentauthoring.tabbed.map(_ => _.dataFromUI()),
    dataToUI: () => config_contentauthoring.tabbed.map(_ => _.dataToUI()),
}
