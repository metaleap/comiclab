import { w2form } from '/w2ui/w2ui.es6.js'

export const proj_series = new w2form({
    name: 'proj_series',
    record: null,
    fields: [
        { field: 'series_id', type: 'text', required: true, html: { label: 'ID' } }
    ],
    dataToUI: () => {
        const series = proj_series.record
        proj_series.setValue('series_id', series ? series.id : '')
        proj_series.refresh()
    },
    dataFromUI: () => {
        const series = proj_series.record
        if (series) {
            series.id = proj_series.getValue('series_id')
        }
    },
    onChange(evt) {
        const errs = proj_series.validate()
        if (!(errs && errs.length && errs.length > 0))
            proj_series.onDirtyProj(true)
    },
    onValidate(evt) {
        const series_id = (proj_series.getValue('series_id') + '').trim()
        if (!(series_id && series_id.length && series_id.length > 0))
            evt.detail.errors.push({
                field: proj_series.get('series_id'),
                error: 'Series ID is required.',
            })
        for (const series of appState.proj.series)
            if (series.id == series_id && series != proj_series.record)
                evt.detail.errors.push({
                    field: proj_series.get('series_id'),
                    error: 'Another Series already has this ID.',
                })
    },
})

proj_series.setRecord = (series) => {
    proj_series.record = series
    proj_series.dataToUI()
}

proj_series.onGuiMainInited = (onDirtyProj, onDirtyCfg) => {
    proj_series.onDirtyProj = (dirty) => {
        if (dirty)
            proj_series.dataFromUI()
        onDirtyProj(dirty)
    }
    guiMain.div.on('reloadedproj', (evt) => {
        proj_series.dataToUI()
    })
    guiMain.div.on('savedproj', (evt) => {
        proj_series.refresh()
    })
}
