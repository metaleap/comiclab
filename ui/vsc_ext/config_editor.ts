import * as vs from 'vscode'
import * as utils from './utils'
import * as app from './app'
import * as shared from './_shared_types'
import * as base_editor from './base_editor'


let configEditor: ConfigEditor | null = null

class ConfigEditor extends base_editor.WebviewPanel {
    override title(): string {
        return "ComicLab Config" + (app.dirtyCfg ? "*" : "")
    }
    override onRefreshedEventMessage() {
        return { ident: 'onAppStateCfgRefreshed', payload: shared.appState.config }
    }
    override onMessage(msg: any): void {
        switch (msg.ident) {
            case 'appStateCfgModified':
                app.onCfgModified.now(msg.payload as shared.Config)
                break
            default:
                super.onMessage(msg)
        }
    }
    show() {
        super.show(false, true, 'config_editor', 'tools')
    }
}

export function show() {
    if (!configEditor)
        configEditor = new ConfigEditor()
    configEditor.show()
}
