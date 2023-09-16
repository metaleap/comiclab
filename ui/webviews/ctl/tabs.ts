import van, { ChildDom } from '../vanjs/van-1.2.0.js'

const html = van.tags

export function newTabs(id: string, tabs: Record<string, ChildDom>) {
    const child_nodes: ChildDom[] = []
    for (const title in tabs) {
        const tab_id = 'tabs_' + id + '_' + child_nodes.length.toString()
        const radio = html.input({ 'type': 'radio', 'name': 'tabs_' + id, 'id': tab_id, 'value': title })
        if (child_nodes.length == 0)
            radio.checked = true
        child_nodes.push(radio, html.div({ 'class': 'tab-page' },
            html.label({ 'for': tab_id }, title),
            html.div({ 'class': 'tab-content' }, tabs[title])))
    }
    return html.div({ 'class': 'tab-container' }, ...child_nodes)
}
