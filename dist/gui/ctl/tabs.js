import van from "/vanjs/van-1.1.3.debug.js";
const html = van.tags;

export default function GuiCtlTabs(tabs) {
    return html.ul({ class: 'tabs' },
        ...tabs.map((tab, idx) => html.li({},
            html.input({ 'id': 'tab' + idx, 'type': 'radio', 'name': 'tabs', 'checked': idx === 0 }),
            html.label({ 'for': 'tab' + idx }, tab.title),
            html.div({ 'id': 'tab-panel' + idx, 'class': 'tab-panel' }, tab._),
        ))
    )
}
