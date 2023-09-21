import van, { ChildDom } from '../vanjs/van-1.2.0.js'
import * as utils from '../utils.js'
import * as º from '../_º.js'

const html = van.tags
const svg = van.tagsNS("http://www.w3.org/2000/svg")

export type PageCanvas = {
    dom: HTMLElement & SVGElement
    render: (_: º.Page) => void,
}

export function create(domId: string, page: º.Page, style: { [_: string]: string }): PageCanvas {
    const ret = {} as PageCanvas
    const page_size = º.pageSizeMm(page)
    let style_css = ''
    if (style) for (const k in style)
        style_css += `${k}:${style[k]};`

    ret.render = (page: º.Page): void => {
        const panels: SVGElement[] = []
        for (const panel of page.panels) {
            panels.push(svg.rect({
                'x': `${panel.x}mm`, 'y': `${panel.y}mm`, 'width': `${panel.w}mm`, 'height': `${panel.h}mm`,
                'stroke-width': '0.77mm', 'fill': '#ffffff', 'stroke': '#000000',
            }) as SVGElement)
        }
        const dom = svg.svg({
            'id': domId,
            'width': `${page_size.wMm}mm`,
            'height': `${page_size.hMm}mm`,
            'style': style_css,
        }, ...panels)

        if (!ret.dom)
            ret.dom = dom as any
        else {
            // TODO diffing
            ret.dom = dom as any
        }
    }

    ret.render(page)
    return ret
}
