import { w2layout } from '/w2ui/w2ui.js'

const main_layout = new w2layout({
    box: '#main',
    name: 'main_layout',
    padding: 4,
    panels: [
        { type: 'left', size: 200, resizable: true, html: 'left' },
        { type: 'main', html: 'main' },
    ]
})
