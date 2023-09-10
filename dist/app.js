import { w2layout, w2sidebar, w2grid, query } from '/w2ui/w2ui.js'

const gui_main = {
    layout: {
        name: 'main_layout',
        padding: 4,
        panels: [
            { type: 'left', size: 200, resizable: true, html: 'left' },
            { type: 'main', html: 'main' },
        ]
    },
    sidebar: {
        name: 'sidebar',
        nodes: [
            {
                id: 'project', text: 'Project', icon: 'fa fa-sitemap', group: true, expanded: true, nodes: [
                    { id: 'series', text: 'Series', icon: 'fa fa-sitemap', selected: true },
                    { id: 'ebooks', text: 'eBooks', icon: 'fa fa-tablet' },
                    { id: 'sitegen', text: 'SiteGen', icon: 'fa fa-globe' },
                    { id: 'settings', text: 'Settings', icon: 'fa fa-wrench' }
                ]
            },
            {
                id: 'config', text: 'Config', group: true, expanded: true, nodes: [
                    { id: 'authors', text: 'Authors', icon: 'fa fa-vcard' }
                ],
            }
        ]
    }
}

const gui_main_layout = new w2layout(gui_main.layout)
const gui_main_sidebar = new w2sidebar(gui_main.sidebar)

gui_main_layout.render('#main')
gui_main_layout.html('left', gui_main_sidebar)
gui_main_layout.html('main', 'Welcome')
