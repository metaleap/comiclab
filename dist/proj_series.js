import { w2form } from '/w2ui/w2ui.es6.js'

export const proj_series = new w2form({
    name: 'proj_series',
    record: null,
    fields: [
        { field: 'name', type: 'text', required: true, html: { label: 'Name' } }
    ],
})

proj_series.onGuiMainInited = (onDirtyProj, onDirtyCfg) => {

}
