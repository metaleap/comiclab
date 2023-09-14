import { w2form } from './w2ui/w2ui.es6.js'

import { newGrid, newForm, dictCopy } from './util.js'

const tab_authors = {
    id: 'tab_authors',
    icon: 'fa-vcard',
    text: 'Authors',
    ctl: newGrid('tab_authors_grid', 'author_id', 'Author', (dirty) => config_contentauthoring.onDirty(dirty), [
        { field: "author_id", text: "ID", sortable: true, },
        { field: "author_name", text: "Full Name", sortable: true, editable: { type: 'text' } },
    ]),
    dataToUI: () => {
        const recs = []
        if (appState.config && appState.config.contentAuthoring.authors)
            for (const id in appState.config.contentAuthoring.authors)
                recs.push({ 'author_id': id, 'author_name': appState.config.contentAuthoring.authors[id] })
        tab_authors.ctl.afterDataToUI(recs)
    },
    dataFromUI: () => {
        tab_authors.ctl.beforeDataFromUI()
        appState.config.contentAuthoring.authors = {}
        for (const rec of tab_authors.ctl.records)
            appState.config.contentAuthoring.authors[rec.author_id] = rec.author_name
    },
}

const tab_pageformats = {
    id: 'tab_pageformats',
    icon: 'fa-file',
    text: 'Page Formats',
    ctl: newGrid('tab_pageformats_grid', 'pageformat_id', 'PageFormat', (dirty) => config_contentauthoring.onDirty(dirty), [
        { field: "pageformat_id", text: "ID", sortable: true, },
        { field: "widthMm", text: "Width (mm)", sortable: false, render: 'int', editable: { type: 'int', min: 0, max: 1234 } },
        { field: "heightMm", text: "Height (mm)", sortable: false, render: 'int', editable: { type: 'int', min: 0, max: 1234 } },
    ]),
    dataToUI: () => {
        const recs = []
        if (appState.config && appState.config.contentAuthoring.pageFormats)
            for (const id in appState.config.contentAuthoring.pageFormats)
                recs.push({ 'pageformat_id': id, 'widthMm': appState.config.contentAuthoring.pageFormats[id].widthMm, 'heightMm': appState.config.contentAuthoring.pageFormats[id].heightMm })
        tab_pageformats.ctl.afterDataToUI(recs)
    },
    dataFromUI: () => {
        tab_pageformats.ctl.beforeDataFromUI()
        appState.config.contentAuthoring.pageFormats = {}
        for (const rec of tab_pageformats.ctl.records)
            appState.config.contentAuthoring.pageFormats[rec.pageformat_id] = { 'widthMm': rec.widthMm, 'heightMm': rec.heightMm }
    },
}

const tab_localization = {
    id: 'tab_localization',
    icon: 'fa-language',
    text: 'Localization',
    ctl: newForm('tab_localization_form', (dirty) => config_contentauthoring.onDirty(dirty), [
        { field: 'languages', type: 'map', html: { label: 'Languages', key: { text: '=', attr: 'style="width: 44px"' }, value: { attr: 'style="width: 77px"' } } },
        { field: 'contentFields', type: 'array', html: { label: 'Custom Localizable<br/>Content Fields' } },
    ]),
    dataToUI: () => tab_localization.ctl.onDataToUI(() => {
        tab_localization.ctl.setValue('languages', dictCopy(appState.config.contentAuthoring.languages), true) // dictCopy because w2ui inserts `_order` dict entry
        tab_localization.ctl.setValue('contentFields', appState.config.contentAuthoring.contentFields, true)
    }),
    dataFromUI: () => tab_localization.ctl.onDataFromUI(() => {
        const rec = tab_localization.ctl.getCleanRecord(true)
        appState.config.contentAuthoring.languages = rec.languages
        appState.config.contentAuthoring.contentFields = rec.contentFields
    }),
}

export const config_contentauthoring = {
    name: 'config_contentauthoring',
    tabbed: [
        tab_authors,
        tab_pageformats,
        tab_localization,
    ],
    dataFromUI: () => config_contentauthoring.tabbed.forEach(_ => _.dataFromUI()),
    dataToUI: () => config_contentauthoring.tabbed.forEach(_ => _.dataToUI()),
}
