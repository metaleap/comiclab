import * as van from './vanjs/van-1.2.0.js';
export let vs;
export function onInitConfigView(vscode) {
    vs = vscode;
    const wot = van.default.tags.a('yo');
    vs.postMessage({ "fooBarBazYa": wot.outerHTML });
}
