import van, { ChildDom, Props, State } from '../vanjs/van-1.2.0.js'
import * as º from '../_º.js'
import * as utils from '../utils.js'

const html = van.tags


export function create(ctlId: string, pagePath: string, onDataUserModified: (_: º.Page) => void): { ctl: HTMLElement, onDataChangedAtSource: (_: º.Page) => void } {
    return {
        ctl: html.div("Hello Page Editor for " + JSON.stringify(pagePath) + " AKA " + JSON.stringify(º.pageFromPath(pagePath))),
        onDataChangedAtSource: (sourcePage: º.Page) => {
        }
    }
}
