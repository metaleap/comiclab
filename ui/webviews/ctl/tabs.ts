import van, { ChildDom } from '../vanjs/van-1.2.0.js'

const html = van.tags

export function newTabs(id: string, tabs: Record<string, ChildDom>) {
    const child_nodes: ChildDom[] = []
    let tab_nr = 0
    for (const title in tabs) {
        const tab_id = id + '_' + tab_nr
        child_nodes.push(
            html.input({ 'type': 'radio', 'name': 'tabs_' + id, 'id': tab_id, 'value': title, checked: (tab_nr == 0) }),
            html.div({ 'class': 'tab-page' },
                html.label({ 'for': tab_id }, title),
                html.div({ 'class': 'tab-content' }, tabs[title])))
        tab_nr++
    }
    return html.div({ 'id': id, 'class': 'tab-container' }, ...child_nodes)
}
