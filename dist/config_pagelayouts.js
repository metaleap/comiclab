import { w2tabs, query } from '/w2ui/w2ui.es6.js'

export const config_pagelayouts = new w2tabs({
    name: 'config_pagelayouts',
    active: 'tab_paperformats',
    tabs: [
        { id: 'tab_paperformats', text: 'Paper Formats', },
    ],
    dataToUI: () => { },
    dataFromUI: () => { },
})
