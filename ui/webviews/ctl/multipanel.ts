import van, { ChildDom } from '../vanjs/van-1.2.0.js'

const html = van.tags

export function create(id: string, sections: Record<string, ChildDom>): ChildDom {
    const child_nodes: ChildDom[] = []
    for (const title in sections)
        child_nodes.push(html.h3({}, title),
            html.span({ 'class': 'multipanel-section' }, sections[title]))
    return html.div({ 'class': 'multipanel', 'id': id }, ...child_nodes)
}