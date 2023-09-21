import * as vs from 'vscode'
import * as º from './_º'
import * as utils from './utils'
import * as app from './app'
import * as base_editor from './base_editor'


const viewTypeIdent = 'config_editor'


class ConfigEditor extends base_editor.WebviewPanel {
    constructor() {
        super(false, true, viewTypeIdent, 'tools')
    }
    override title(): string {
        return "ComicLab Config"
    }
    override onRefreshedEventMessage() {
        return { ident: 'onAppStateCfgRefreshed', payload: º.appState.config }
    }
    override onMessage(msg: any): void {
        switch (msg.ident) {
            case 'onAppStateCfgModified':
                app.events.cfgModified.now(msg.payload as º.Config)
                break
            default:
                super.onMessage(msg)
        }
    }
}

export function show() {
    base_editor.show(viewTypeIdent + ':', () => new ConfigEditor())
}
