import { w2layout, w2sidebar, w2toolbar } from '/w2ui/w2ui-2.0.es6.js'
import { config_authors } from '/config-authors.js'

const gui_main = {
    layout: new w2layout({
        name: 'main_layout',
        padding: 4,
        panels: [
            {
                type: 'left', size: 200, resizable: true, html: '', toolbar: {
                    items: [
                        { type: 'spacer' },
                        { type: 'button', id: 'save', text: document.title, icon: 'fa fa-save', disabled: true },
                        { type: 'spacer' },
                    ],
                    onClick(evt) {
                        alert("foo")
                    }
                }
            },
            { type: 'main', html: 'main' },
        ]
    }),
    sidebar: new w2sidebar({
        name: 'sidebar',
        nodes: [
            {
                id: 'project', text: 'Project', icon: 'fa fa-sitemap', group: true, expanded: true, nodes: [
                    { id: 'proj_series', text: 'Series', icon: 'fa fa-sitemap', count: 2, selected: true },
                    { id: 'proj_ebooks', text: 'eBooks', count: 0, icon: 'fa fa-tablet' },
                    { id: 'proj_sitegen', text: 'SiteGen', icon: 'fa fa-globe' },
                    { id: 'proj_settings', text: 'Settings', icon: 'fa fa-wrench' }
                ],
            },
            {
                id: 'config', text: 'Config', group: true, expanded: true, nodes: [
                    { id: 'cfg_authors', text: 'Authors', icon: 'fa fa-vcard', count: 11 }
                ],
            },
        ],
    }),
}

// gui_main.sidebar.on('*', (evt) => { console.log('gui_main.sidebar', evt) })
gui_main.sidebar.on('click', (evt) => {
    switch (evt.target) {
        case 'cfg_authors':
            gui_main.layout.html('main', config_authors)
            break;
    }
})

gui_main.layout.render('#main')
gui_main.layout.html('left', gui_main.sidebar)
gui_main.layout.html('main', 'Welcome')
