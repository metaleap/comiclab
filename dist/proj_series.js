import { w2form } from '/w2ui/w2ui.es6.js'

export const proj_series = new w2form({
    name: 'proj_series',
    record: null,
    fields: [
        { field: 'id', type: 'text', required: true, html: { label: 'Series ID' } }
    ],
    onChange(evt) {
        const errs = proj_series.validate()
        if (!(errs && errs.length && errs.length > 0))
            proj_series.onDirty(true)
    },
    onValidate(evt) {
        const series_id = (proj_series.getValue('id') + '').trim()
        if (!(series_id && series_id.length && series_id.length > 0))
            evt.detail.errors.push({
                field: proj_series.get('id'),
                error: 'Series ID is required.',
            })
        for (const series of appState.proj.series)
            if (series.id == series_id && series != proj_series.record)
                evt.detail.errors.push({
                    field: proj_series.get('id'),
                    error: 'Another Series already has this ID.',
                })
    },
    dataToUI: () => {
        const series = proj_series.record
        proj_series.setValue('id', series ? series.id : '')
        proj_series.refresh()
    },
    dataFromUI: () => {
        const series = proj_series.record
        if (series) {
            const oldID = series.id
            const newID = proj_series.getValue('id')
            if (oldID != newID) {
                series.id = newID
                for (const i in appState.proj.series)
                    if (appState.proj.series[i] == series || appState.proj.series[i].id == oldID)
                        appState.proj.series[i] = series
            }
            proj_series.record = series
        }
    },
})

proj_series.setRecord = (series) => {
    proj_series.record = series
    proj_series.dataToUI()
}
