import van from './vanjs/van-1.2.0.js'
import { Config } from './_shared_types.js'
import { newTabs } from './ctl/tabs.js'
import { newInputGrid, Rec } from './ctl/input_grid.js'
import { arrFromDict, arrToDict } from './utils.js'


const html = van.tags

export let vs: { postMessage: (_: any) => any }

let appStateCfg: Config = { contentAuthoring: {} }

let authors_grid = newInputGrid('config_authors', [
    { id: 'id', title: "Author ID" },
    { id: 'author_full_name', title: "Full Name" }
], (recs) => {
    appStateCfg.contentAuthoring.authors = arrToDict(recs, (rec) => [rec.id, rec['author_full_name']])
    vs.postMessage({ ident: 'appStateCfgModified', payload: appStateCfg })
})

export function onInitConfigView(vscode: { postMessage: (_: any) => any }, baseUri: string) {
    vs = vscode
    window.addEventListener('message', (evt) => {
        const msg = evt.data;
        switch (msg.ident) {
            case 'onAppStateCfgChanged':
                appStateCfg = msg.payload as Config
                let authors = appStateCfg.contentAuthoring?.authors
                authors_grid.onDataChangedAtSource(arrFromDict(authors, (key, value) => ({
                    'id': key, 'author_full_name': value,
                } as Rec)))
                break
            default:
                vs.postMessage({ 'unknown_msg': msg })
        }
    })

    const tabs = newTabs('config_main_tabs', {
        "Authors": html.div({}, authors_grid.ctl),
        "Page Formats": html.div("pf content"),
        "Localization": html.div("loc content"),
    })
    van.add(document.body, tabs)
}
