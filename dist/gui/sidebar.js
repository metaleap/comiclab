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
    console.log(idx);
    setTimeout(() => {
        for (var i = 0; i < panes.length; i++) {
            const panetag = document.getElementById('sidebarpane_' + i);
            const tabtag = document.getElementById('sidebartab_' + i);
            setTagClass(panetag, 'sidebar_pane_active', idx === i);
            setTagClass(tabtag, 'sidebar_tab_active', idx === i);
        }
    }, 100);
});

export default function GuiSideBar() {
    return html.span({ class: 'sidebar' },
        html.span({ class: 'sidebar_tabs' }, ...panes.map(SideBarTab)),
        html.span({ class: 'sidebar_panes' }, ...panes.map(SideBarPane)),
    );
}

function SideBarTab(pane, idx) {
    return html.span({
        id: 'sidebartab_' + idx, class: 'sidebar_tab',
        title: pane.title, onclick: () => activeIdx.val = idx,
    }, pane.icon)
}

function SideBarPane(pane, idx) {
    return html.span({
        id: 'sidebarpane_' + idx, class: 'sidebar_pane',
    }, pane._)
}

function setTagClass(tag, className, isToExist) {
    if (!tag)
        return;
    if (isToExist && !tag.classList.contains(className))
        tag.classList.add(className);
    else if (tag.classList.contains(className) && !isToExist)
        tag.classList.remove(className);
}
