import van from './vanjs/van-1.2.0.js'
import { newTabs } from './ctl/tabs.js'


const html = van.tags

export let vs: { postMessage: (_: any) => any }

export function onInitConfigView(vscode: { postMessage: (_: any) => any }) {
    vs = vscode
    const tabs = newTabs('config_main_tabs', {
        "Authors": html.div("au content"),
        "Page Formats": html.div("pf content"),
        "Localization": html.div("loc content"),
    })
    van.add(document.body, tabs)
}
