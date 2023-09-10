import { w2layout, w2sidebar } from '/w2ui/w2ui.js'
import { config_authors } from '/config-authors.js'

const gui_main = {
    layout: new w2layout({
        name: 'main_layout',
        padding: 4,
        panels: [
            { type: 'left', size: 200, resizable: true, html: 'left' },
            { type: 'main', html: 'main' },
        ]
    }),
    sidebar: new w2sidebar({
        name: 'sidebar',
        nodes: [
            {
                id: 'project', text: 'Project', icon: 'fa fa-sitemap', group: true, expanded: true, nodes: [
                    { id: 'proj_series', text: 'Series', icon: 'fa fa-sitemap', selected: true },
                    { id: 'proj_ebooks', text: 'eBooks', icon: 'fa fa-tablet' },
                    { id: 'proj_sitegen', text: 'SiteGen', icon: 'fa fa-globe' },
                    { id: 'proj_settings', text: 'Settings', icon: 'fa fa-wrench' }
                ]
            },
            {
                id: 'config', text: 'Config', group: true, expanded: true, nodes: [
                    { id: 'cfg_authors', text: 'Authors', icon: 'fa fa-vcard' }
                ],
            }
        ]
    })
}

gui_main.sidebar.on('*', console.log)
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
