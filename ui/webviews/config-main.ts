import van from './vanjs/van-1.2.0.js'
import { Config } from './_shared_types.js'
import * as ctl_tabs from './ctl/tabs.js'
import * as ctl_inputgrid from './ctl/input_grid.js'
import * as utils from './utils.js'


const html = van.tags

let appStateCfg: Config = { contentAuthoring: {} }

let authors_grid = ctl_inputgrid.create('config_authors', [
    { id: 'id', title: "Author ID" }, // validators added by input_grid.create
    { id: 'author_full_name', title: "Full Name", validators: [ctl_inputgrid.validatorNonEmpty(), ctl_inputgrid.validatorUnique(curAuthors)] }
], (recs) => {
    setDisabled(true)
    appStateCfg.contentAuthoring.authors = utils.arrToDict(recs, (rec) => [rec.id, rec['author_full_name']])
    utils.vs.postMessage({ ident: 'appStateCfgModified', payload: appStateCfg })
})

let paperformats_grid = ctl_inputgrid.create('config_paperformats', [
    { id: 'id', title: "Paper Format ID" }, // validators added by input_grid.create
    { id: 'widthMm', title: 'Width (mm)', number: { min: 11, max: 1234 } },
    { id: 'heightMm', title: 'Height (mm)', number: { min: 11, max: 1234 } },
], (recs) => {
    setDisabled(true)
    appStateCfg.contentAuthoring.paperFormats = utils.arrToDict(recs, (rec) => [rec.id, { widthMm: parseInt(rec.widthMm), heightMm: parseInt(rec.heightMm) }])
    utils.vs.postMessage({ ident: 'appStateCfgModified', payload: appStateCfg })
})

let main_tabs = ctl_tabs.create('config_main_tabs', {
    "Paper Formats": html.div({}, paperformats_grid.ctl),
    "Authors": authors_grid.ctl,
    "Localization": html.div("loc content"),
})

export function onInitConfigView(vscode: { postMessage: (_: any) => any }, baseUri: string) {
    utils.onInit(vscode)
    window.addEventListener('message', onMessage)
    van.add(document.body, main_tabs)
}

function setDisabled(disabled: boolean) {
    (main_tabs as HTMLElement).querySelectorAll('input, textarea, select, option, button').forEach(el => {
        if (disabled)
            el.setAttribute("disabled", "disabled")
        else
            el.removeAttribute("disabled")
    })
}

function onMessage(evt: MessageEvent) {
    const msg = evt.data;
    switch (msg.ident) {
        case 'onAppStateCfgRefreshed':
            appStateCfg = msg.payload as Config
            authors_grid.onDataChangedAtSource(curAuthors())
            paperformats_grid.onDataChangedAtSource(curPaperFormats())
            setDisabled(false)
            break
        default:
            utils.vs.postMessage({ 'unknown_msg': msg })
            break
    }
}

function curAuthors() {
    return utils.arrFromDict(appStateCfg.contentAuthoring?.authors, (key, value) => ({
        'id': key, 'author_full_name': value,
    } as ctl_inputgrid.Rec))
}

function curPaperFormats() {
    return utils.arrFromDict(appStateCfg.contentAuthoring?.paperFormats, (key, value) => ({
        'id': key, 'widthMm': value.widthMm.toString(), 'heightMm': value.heightMm.toString(),
    } as ctl_inputgrid.Rec))
}
