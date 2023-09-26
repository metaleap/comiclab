import van, { ChildDom } from '../vanjs/van-1.2.1.debug.js'

const html = van.tags

export function create(domId: string, tabs: Record<string, ChildDom>): ChildDom {
    const child_nodes: ChildDom[] = []
    let tab_nr = 0, num_actual_tabs = 0
    for (const title in tabs)
        if (tabs[title])
            num_actual_tabs++
        else
            delete tabs[title]
    if (num_actual_tabs === 1)
        for (const title in tabs)
            return tabs[title]
    for (const title in tabs) {
        const tab_id = domId + '_' + tab_nr
        child_nodes.push(
            html.input({ 'type': 'radio', 'name': 'tabs_' + domId, 'id': tab_id, 'value': title, checked: (tab_nr == 0) }),
            html.div({ 'class': 'tab-page' },
                html.label({ 'for': tab_id }, title),
                html.div({ 'class': 'tab-content' }, tabs[title])))
        tab_nr++
    }
    return html.div({ 'id': domId, 'class': 'tab-container' }, ...child_nodes)
}
