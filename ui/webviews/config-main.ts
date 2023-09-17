import van from './vanjs/van-1.2.0.js'
import { Config } from './_shared_types.js'
import { newTabs } from './ctl/tabs.js'
import * as input_grid from './ctl/input_grid.js'
import * as utils from './utils.js'


const html = van.tags

let appStateCfg: Config = { contentAuthoring: {} }

let authors_grid = input_grid.create('config_authors', [
    { id: 'id', title: "Author ID" }, // validators added by input_grid.create
    { id: 'author_full_name', title: "Full Name", validators: [input_grid.validatorNonEmpty(), input_grid.validatorUnique(latestAuthors)] }
], (recs) => {
    setVisible(false)
    appStateCfg.contentAuthoring.authors = utils.arrToDict(recs, (rec) => [rec.id, rec['author_full_name']])
    utils.vs.postMessage({ ident: 'appStateCfgModified', payload: appStateCfg })
})

let main_tabs = newTabs('config_main_tabs', {
    "Authors": html.div({}, authors_grid.ctl),
    "Page Formats": html.div("pf content"),
    "Localization": html.div("loc content"),
})

export function onInitConfigView(vscode: { postMessage: (_: any) => any }, baseUri: string) {
    utils.onInit(vscode)
    window.addEventListener('message', onMessage)
    van.add(document.body, main_tabs)
}

function setVisible(visible: boolean) {
    (main_tabs as HTMLElement).style.visibility = (visible ? 'visible' : 'hidden')
}

function onMessage(evt: MessageEvent) {
    const msg = evt.data;
    switch (msg.ident) {
        case 'onAppStateCfgRefreshed':
            appStateCfg = msg.payload as Config
            authors_grid.onDataChangedAtSource(latestAuthors())
            setVisible(true)
            break
        default:
            utils.vs.postMessage({ 'unknown_msg': msg })
            break
    }
}

function latestAuthors() {
    return utils.arrFromDict(appStateCfg.contentAuthoring?.authors, (key, value) => ({
        'id': key, 'author_full_name': value,
    } as input_grid.Rec))
}
