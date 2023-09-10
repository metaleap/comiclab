import van from "/vanjs/van-1.1.3.debug.js";
const html = van.tags;

export default function GuiCtlTabs(id, tabs) {
    return html.div({ 'style': 'margin:1em;padding:1em;' }, html.div({ 'class': 'tabs', 'id': id },
        ...tabs.map((tab, idx) => html.span({},
            html.input({ 'type': 'radio', 'name': 'tabs_' + id, 'value': idx, 'id': 'tab_' + id + '_' + idx }),
            html.div({ 'class': 'tab-contents' },
                html.label({ 'for': 'tab_' + id + '_' + idx }, tab.title),
                html.div({ 'class': 'tab-content' }, tab._),
            ),
        ))
    ))
}
