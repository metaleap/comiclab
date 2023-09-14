import { w2form } from './w2ui/w2ui.es6.js'

import { newForm } from './util.js'

const tab_series_settings = {
    id: 'tab_series_settings',
    icon: 'fa-vcard',
    text: 'Main',
    ctl: newForm('proj_series', (dirty) => proj_series.onDirty(dirty), [
        { field: 'id', type: 'text', required: true, html: { label: 'Series ID' } }
    ], {
        onValidate(evt) {
            const series_id = (tab_series_settings.ctl.getValue('id') + '').trim()
            if (!(series_id && series_id.length && series_id.length > 0))
                evt.detail.errors.push({
                    field: tab_series_settings.ctl.get('id'),
                    error: 'Series ID is required.',
                })
            for (const series of appState.proj.series)
                if (series.id == series_id && series != tab_series_settings.ctl.record)
                    evt.detail.errors.push({
                        field: tab_series_settings.ctl.get('id'),
                        error: 'Another Series already has this ID.',
                    })
        },
    }),
    dataToUI: () => tab_series_settings.ctl.onDataToUI(() => {
        const series = tab_series_settings.ctl.record
        tab_series_settings.ctl.setValue('id', series ? series.id : '')
    }),
    dataFromUI: () => tab_series_settings.ctl.onDataFromUI(() => {
        const series = tab_series_settings.ctl.record
        if (series) {
            const oldID = series.id
            const newID = tab_series_settings.ctl.getValue('id')
            if (oldID != newID) {
                series.id = newID
                for (const i in appState.proj.series)
                    if (appState.proj.series[i] == series || appState.proj.series[i].id == oldID)
                        appState.proj.series[i] = series
            }
            tab_series_settings.ctl.record = series
        }
    }),
}

export const proj_series = {
    name: 'proj_series',
    tabbed: [
        tab_series_settings,
    ],
    setRecord: (rec) => {
        proj_series.record = rec
        proj_series.tabbed.forEach(_ => {
            _.ctl.record = rec
            _.dataToUI()
        })
    },
    dataFromUI: () => proj_series.tabbed.forEach(_ => _.dataFromUI()),
    dataToUI: () => proj_series.tabbed.forEach(_ => _.dataToUI()),
}
