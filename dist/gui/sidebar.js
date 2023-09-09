import van from "/vanjs/van-1.1.3.debug.js";
const html = van.tags;
import GuiSideBarProjectPane from "/gui/sidebar_project.js";
import GuiSideBarSettingsPane from "/gui/sidebar_settings.js";
import GuiSideBarLogbookPane from "/gui/sidebar_logbook.js";

const panes = [
    GuiSideBarProjectPane(),
    GuiSideBarSettingsPane(),
    GuiSideBarLogbookPane(),
];

const activeIdx = van.state(0);

van.derive(() => {
    const idx = activeIdx.val;
    for (var i = 0; i < panes.length; i++)
        if (panes[i].cssClassPane && panes[i].cssClassTab) {
            if (i === idx) {
                panes[i].cssClassPane.val = 'sidebar_pane sidebar_pane_active';
                panes[i].cssClassTab.val = 'sidebar_tab sidebar_tab_active';
            } else {
                panes[i].cssClassPane.val = 'sidebar_pane';
                panes[i].cssClassTab.val = 'sidebar_tab';
            }
        }
});

export default function GuiSideBar() {
    return html.span({ class: 'sidebar' },
        html.span({ class: 'sidebar_tabs' }, ...panes.map(SideBarTab)),
        html.span({ class: 'sidebar_panes' }, ...panes.map(SideBarPane)),
    );
}

function SideBarTab(pane, idx) {
    pane.cssClassTab = van.state('sidebar_tab');
    return html.span({
        class: pane.cssClassTab,
        title: pane.title, onclick: () => activeIdx.val = idx,
    }, pane.icon)
}

function SideBarPane(pane, idx) {
    pane.cssClassPane = van.state('sidebar_pane');
    return html.span({
        class: pane.cssClassPane,
    }, pane._)
}
