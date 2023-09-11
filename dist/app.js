import { w2layout, w2sidebar, w2toolbar, w2utils, query } from '/w2ui/w2ui-2.0.es6.js'
import { config_authors } from '/config-authors.js'

const appState = {
    proj: {},
    config: {},
}

const gui_main = {
    layout: new w2layout({
        name: 'main_layout',
        padding: 4,
        panels: [
            {
                type: 'left', size: 200, resizable: true, html: '', toolbar: {
                    tooltip: 'bottom',
                    items: [
                        { type: 'spacer' },
                        {
                            type: 'menu', id: 'menu_proj', tooltip: 'Project: ' + uiProjPath, icon: 'fa fa-spinner', items: [
                                { id: 'menu_proj_save', text: 'Save Changes', icon: 'fa fa-save', disabled: true, },
                                { id: 'menu_proj_reload', text: 'Reload', icon: 'fa fa-refresh', },
                            ]
                        },
                        {
                            type: 'menu', id: 'menu_cfg', tooltip: 'Config: ' + uiCfgPath, icon: 'fa fa-spinner', items: [
                                { id: 'menu_cfg_save', text: 'Save Changes', icon: 'fa fa-save', disabled: true, },
                                { id: 'menu_cfg_reload', text: 'Reload', icon: 'fa fa-refresh', },
                            ]
                        },
                        { type: 'spacer' },
                    ],
                    onClick(evt) {
                        switch (evt.target) {
                            case 'menu_proj:menu_proj_reload':
                                console.log(evt)
                                lockUnlock(true)
                                break
                            case 'menu_proj:menu_proj_save':
                                lockUnlock(true)
                                break
                            case 'menu_cfg:menu_cfg_reload':
                                lockUnlock(true)
                                break
                            case 'menu_cfg:menu_cfg_save':
                                lockUnlock(true)
                                break
                        }
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
                id: 'project', text: 'Project', icon: 'fa fa-sitemap', group: true, expanded: true, groupShowHide: false, nodes: [
                    { id: 'proj_series', text: 'Series', icon: 'fa fa-sitemap', count: 2, selected: true },
                    { id: 'proj_ebooks', text: 'eBooks', count: 0, icon: 'fa fa-tablet' },
                    { id: 'proj_sitegen', text: 'SiteGen', icon: 'fa fa-globe' },
                    { id: 'proj_settings', text: 'Settings', icon: 'fa fa-wrench' }
                ],
            },
            {
                id: 'config', text: 'Config', group: true, expanded: true, groupShowHide: false, nodes: [
                    { id: 'cfg_authors', text: 'Authors', icon: 'fa fa-vcard', count: 11 }
                ],
            },
        ],
    }),
}

function lockUnlock(locked) {
    if (locked)
        w2utils.lock(query('#main'), { spinner: true })
    else
        w2utils.unlock(query('#main'))
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
