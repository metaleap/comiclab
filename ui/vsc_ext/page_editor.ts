import * as vs from 'vscode'
import * as º from './_º'
import * as utils from './utils'
import * as app from './app'
import * as base_editor from './base_editor'


const viewTypeIdent = 'page_editor'


export function onInit() {
    utils.disp(vs.commands.registerCommand('comiclab.proj.colls.openPage', show))
}


class PageEditor extends base_editor.WebviewPanel {
    readonly pagePath: string
    constructor(pagePath: string) {
        super(true, true, viewTypeIdent, 'file')
        this.pagePath = pagePath
    }
    override title(): string {
        return º.pageFromPath(this.pagePath)?.name ?? '?!bug?!'
    }
    override onRefreshedEventMessage(): any {
        return {
            ident: 'onAppStateRefreshed', payload: º.appState,
        }
    }
    override onMessage(msg: any): void {
        const page = º.pageFromPath(this.pagePath)
        if (!page)
            return utils.alert("NEW BUG: page " + this.pagePath + " not found?!")
        switch (msg.ident) {
            case 'onPageModified':
                page.props = msg.payload.props
                page.panels = msg.payload.panels
                app.events.projModified.now(º.appState.proj)
                break
            default:
                super.onMessage(msg)
        }
    }
}

export function show(pagePath: string) {
    base_editor.show(viewTypeIdent + ':' + pagePath, () => new PageEditor(pagePath))
}

export function close(page: º.Page) {
    base_editor.close(viewTypeIdent + base_editor.reuseKeySep + º.pageToPath(page))
}

export function isOpen(coll: º.Collection) {
    for (const page of coll.pages)
        if (base_editor.isOpen(viewTypeIdent + base_editor.reuseKeySep + º.pageToPath(page)))
            return true
    return false
}
