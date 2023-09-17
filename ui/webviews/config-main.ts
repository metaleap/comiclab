import van from './vanjs/van-1.2.0.js'
import { Config } from './_shared_types.js'
import * as utils from './utils.js'

import * as ctl_tabs from './ctl/tabs.js'
import * as ctl_inputgrid from './ctl/inputgrid.js'
import * as ctl_multipanel from './ctl/multipanel.js'


const html = van.tags

let appStateCfg: Config = { contentAuthoring: {} }

let authors_grid = gridStringTupNew('config_authors', 'Author', 'author_full_name', 'Full Name', curAuthors, (_ => { appStateCfg.contentAuthoring.authors = _ }))
let languages_grid = gridStringTupNew('config_languages', 'Language', 'lang_name', 'Name', curLanguages, (dict) => { appStateCfg.contentAuthoring.languages = dict })
let contentfields_grid = gridStringTupNew('config_contentfields', 'Content Field', 'title', 'Title', curContentFields, (dict) => { appStateCfg.contentAuthoring.contentFields = dict })

let paperformats_grid = ctl_inputgrid.create('config_paperformats', [
    { id: 'id', title: "Paper Format ID" }, // validators added by input_grid.create
    { id: 'widthMm', title: 'Width (mm)', number: { min: 11, max: 1234 }, validators: [ctl_inputgrid.validatorNonEmpty()] },
    { id: 'heightMm', title: 'Height (mm)', number: { min: 11, max: 1234 }, validators: [ctl_inputgrid.validatorNonEmpty()] },
], (recs) => {
    setDisabled(true)
    appStateCfg.contentAuthoring.paperFormats = utils.arrToDict(recs, (rec) => [rec.id, { widthMm: parseInt(rec.widthMm), heightMm: parseInt(rec.heightMm) }])
    utils.vs.postMessage({ ident: 'appStateCfgModified', payload: appStateCfg })
})

let main_tabs = ctl_tabs.create('config_main_tabs', {
    "Content Authoring": ctl_multipanel.create('config_contentauthoring', {
        "Authors": authors_grid.ctl,
        "Languages": languages_grid.ctl,
        "Custom Content Fields": contentfields_grid.ctl,
    }),
    "Paper-Related": ctl_multipanel.create('config_paperrelated', {
        "Paper Formats": paperformats_grid.ctl,
    }),
})

export function onInitConfigView(vscode: { postMessage: (_: any) => any }, baseUri: string) {
    utils.onInit(vscode)
    window.addEventListener('message', onMessage)
    van.add(document.body, main_tabs)
}

function setDisabled(disabled: boolean) {
    (main_tabs as HTMLElement).style.visibility = disabled ? 'hidden' : 'visible'
}

function onMessage(evt: MessageEvent) {
    const msg = evt.data;
    switch (msg.ident) {
        case 'onAppStateCfgRefreshed':
            appStateCfg = msg.payload as Config
            authors_grid.onDataChangedAtSource(curAuthors())
            paperformats_grid.onDataChangedAtSource(curPaperFormats())
            languages_grid.onDataChangedAtSource(curLanguages())
            contentfields_grid.onDataChangedAtSource(curContentFields())
            setDisabled(false)
            break
        default:
            utils.vs.postMessage({ 'unknown_msg': msg })
            break
    }
}

function gridStringTupNew(id: string, title: string, valueName: string, valueTitle: string, cur: () => ctl_inputgrid.Rec[], set: (_: { [_: string]: string }) => void) {
    return ctl_inputgrid.create(id, [
        { id: 'id', title: title + " ID" }, // validators added by input_grid.create
        { id: valueName, title: valueTitle, validators: [ctl_inputgrid.validatorNonEmpty(), ctl_inputgrid.validatorUnique(cur)] },
    ], (recs) => {
        setDisabled(true)
        set(utils.arrToDict(recs, (rec) => [rec.id, rec[valueName]]))
        utils.vs.postMessage({ ident: 'appStateCfgModified', payload: appStateCfg })
    })
}

function curAuthors() {
    return utils.arrFromDict(appStateCfg.contentAuthoring?.authors, (key, value) => ({
        'id': key, 'author_full_name': value,
    } as ctl_inputgrid.Rec))
}

function curContentFields() {
    return utils.arrFromDict(appStateCfg.contentAuthoring?.contentFields, (key, value) => ({
        'id': key, 'title': value,
    } as ctl_inputgrid.Rec))
}

function curLanguages() {
    return utils.arrFromDict(appStateCfg.contentAuthoring?.languages, (key, value) => ({
        'id': key, 'lang_name': value,
    } as ctl_inputgrid.Rec))
}

function curPaperFormats() {
    return utils.arrFromDict(appStateCfg.contentAuthoring?.paperFormats, (key, value) => ({
        'id': key, 'widthMm': value.widthMm.toString(), 'heightMm': value.heightMm.toString(),
    } as ctl_inputgrid.Rec))
}
