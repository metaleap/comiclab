import * as van from './vanjs/van-1.2.0.js'

export let vs: { postMessage: (_: any) => any }

export function onInitConfigView(vscode: { postMessage: (_: any) => any }) {
    vs = vscode
    const wot = van.default.tags.a('yo')
    vs.postMessage({ "fooBarBazYa": wot.outerHTML })
}
