import { w2grid } from '/w2ui/w2ui.es6.js'
import { newGrid } from './util.js'

const tab_authors = {
    id: 'tab_authors',
    text: '📇 Authors',
    ctl: newGrid('tab_authors_grid', 'author_id', 'Author', (dirty) => config_contentauthoring.onDirty(dirty), [
        { field: "author_id", text: "ID", sortable: true, },
        { field: "author_name", text: "Full Name", sortable: true, editable: { type: 'text' } },
    ]),
    dataToUI: () => {
        const recs = []
        if (appState.config && appState.config.authors)
            for (const id in appState.config.authors)
                recs.push({ 'author_id': id, 'author_name': appState.config.authors[id] })
        tab_authors.ctl.afterDataToUI(recs)
    },
    dataFromUI: () => {
        tab_authors.ctl.beforeDataFromUI()
        appState.config.authors = {}
        for (const rec of tab_authors.ctl.records)
            appState.config.authors[rec.author_id] = rec.author_name
    },
}

const tab_pageformats = {
    id: 'tab_pageformats',
    text: '📐 Page Formats',
    ctl: newGrid('tab_pageformats_grid', 'pageformat_id', 'PageFormat', (dirty) => config_contentauthoring.onDirty(dirty), [
        { field: "pageformat_id", text: "ID", sortable: true, },
        { field: "widthMm", text: "Width (mm)", sortable: false, render: 'int', editable: { type: 'int', min: 0, max: 1234 } },
        { field: "heightMm", text: "Height (mm)", sortable: false, render: 'int', editable: { type: 'int', min: 0, max: 1234 } },
    ]),
    dataToUI: () => {
        const recs = []
        if (appState.config && appState.config.pageFormats)
            for (const id in appState.config.pageFormats)
                recs.push({ 'pageformat_id': id, 'widthMm': appState.config.pageFormats[id].widthMm, 'heightMm': appState.config.pageFormats[id].heightMm })
        tab_pageformats.ctl.afterDataToUI(recs)
    },
    dataFromUI: () => {
        tab_pageformats.ctl.beforeDataFromUI()
        appState.config.pageFormats = {}
        for (const rec of tab_pageformats.ctl.records)
            appState.config.pageFormats[rec.pageformat_id] = { 'widthMm': rec.widthMm, 'heightMm': rec.heightMm }
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
