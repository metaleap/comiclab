import van from './vanjs/van-1.2.1.js'
import * as º from './_º.js'
import * as utils from './utils.js'

import * as ctl_tabs from './ctl/tabs.js'
import * as ctl_inputgrid from './ctl/inputgrid.js'
import * as ctl_inputform from './ctl/inputform.js'
import * as ctl_multipanel from './ctl/multipanel.js'


const html = van.tags

let grid_authors = newGridForStringMap('config_authors', 'Author', 'author_full_name', 'Full Name', curAuthors, (_ => { º.appState.config.contentAuthoring.authors = _ }))
let grid_languages = newGridForStringMap('config_languages', 'Language', 'lang_name', 'Name', curLanguages, (dict) => { º.appState.config.contentAuthoring.languages = dict })
let grid_customfields = ctl_inputgrid.create('config_customfields', [
    { id: 'id', title: "Content Field ID", validators: [] },
    { id: 'localizable', title: "Multi-Language", validators: [ctl_inputform.validatorLookup], lookUp: ctl_inputform.lookupBool },
], (userModifiedRecs) => {
    setDisabled(true)
    º.appState.config.contentAuthoring.customFields = utils.dictFromArr(userModifiedRecs, (rec) => [rec.id, rec['localizable'] == 'true'])
    utils.vs.postMessage({ ident: 'onAppStateCfgModified', payload: º.appState.config })
})
let grid_paperformats = ctl_inputgrid.create('config_paperformats', [
    { id: 'id', title: "Paper Format ID", validators: [/*validators added by input_grid.create*/] },
    { id: 'widthMm', title: 'Width (mm)', num: { min: 11, max: 1234 }, validators: [ctl_inputform.validatorNonEmpty] },
    { id: 'heightMm', title: 'Height (mm)', num: { min: 11, max: 1234 }, validators: [ctl_inputform.validatorNonEmpty] },
], (userModifiedRecs) => {
    setDisabled(true)
    º.appState.config.contentAuthoring.paperFormats = utils.dictFromArr(userModifiedRecs, (rec) => [rec.id, { widthMm: parseInt(rec.widthMm), heightMm: parseInt(rec.heightMm) }])
    utils.vs.postMessage({ ident: 'onAppStateCfgModified', payload: º.appState.config })
})

let main_tabs = ctl_tabs.create('config_editor_main', {
    "Collections": ctl_multipanel.create('config_collections', {
        "Authors": grid_authors.dom,
        "Languages": grid_languages.dom,
        "Custom Content Fields": grid_customfields.dom,
    }),
    "Page Design": ctl_multipanel.create('config_pagedesign', {
        "Foo": html.div("Bar"),
    }),
    "Scans & Paper-Related": ctl_multipanel.create('config_paperrelated', {
        "Paper Formats": grid_paperformats.dom,
    }),
})

export function onInit(_: string, vscode: { postMessage: (_: any) => any }, extUri: string, vscCfgSettings: object, appState: º.AppState) {
    utils.onInit(vscode, extUri, vscCfgSettings, appState)
    onAppStateCfgRefreshed(appState.config)
    van.add(document.body, main_tabs)
    window.addEventListener('message', onMessage)
}

function setDisabled(disabled: boolean) {
    (main_tabs as HTMLElement).style.visibility = disabled ? 'hidden' : 'visible'
}

function onAppStateCfgRefreshed(newConfig: º.Config) {
    º.appState.config = newConfig as º.Config
    grid_authors.onDataChangedAtSource(curAuthors())
    grid_paperformats.onDataChangedAtSource(curPaperFormats())
    grid_languages.onDataChangedAtSource(curLanguages())
    grid_customfields.onDataChangedAtSource(curCustomFields())
    setDisabled(false)
}

function onMessage(evt: MessageEvent) {
    const msg = evt.data
    switch (msg.ident) {
        case 'onAppStateCfgRefreshed':
            onAppStateCfgRefreshed(msg.payload)
            break
        default:
            utils.vs.postMessage({ 'unknown_msg': msg })
            break
    }
}

function newGridForStringMap(id: string, title: string, valueName: string, valueTitle: string, cur: () => ctl_inputform.Rec[], set: (_: { [_: string]: string }) => void) {
    return ctl_inputgrid.create(id, [
        { id: 'id', title: title + " ID", validators: [/*validators added by input_grid.create*/] },
        { id: valueName, title: valueTitle, validators: [ctl_inputform.validatorNonEmpty, ctl_inputgrid.validatorUnique(cur)] },
    ], (userModifiedRecs) => {
        setDisabled(true)
        set(utils.dictFromArr(userModifiedRecs, (rec) => [rec.id, rec[valueName]]))
        utils.vs.postMessage({ ident: 'onAppStateCfgModified', payload: º.appState.config })
    })
}

function curAuthors() {
    return utils.dictToArr(º.appState.config.contentAuthoring.authors, (key, value) => ({
        'id': key, 'author_full_name': value,
    } as ctl_inputform.Rec))
}

function curCustomFields() {
    return utils.dictToArr(º.appState.config.contentAuthoring.customFields, (key, value) => ({
        'id': key, 'localizable': (value ? 'true' : 'false'),
    } as ctl_inputform.Rec))
}

function curLanguages() {
    return utils.dictToArr(º.appState.config.contentAuthoring.languages, (key, value) => ({
        'id': key, 'lang_name': value,
    } as ctl_inputform.Rec))
}

function curPaperFormats() {
    return utils.dictToArr(º.appState.config.contentAuthoring.paperFormats, (key, value) => ({
        'id': key, 'widthMm': value.widthMm.toString(), 'heightMm': value.heightMm.toString(),
    } as ctl_inputform.Rec))
}
