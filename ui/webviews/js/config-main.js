import van from './vanjs/van-1.2.0.js';
const html = van.tags;
export let vs;
export function onInitConfigView(vscode) {
    vs = vscode;
    const wot = html.a({ href: 'https://metaleap.net' }, 'yo');
    van.add(document.body, wot);
    vs.postMessage({ "fooBarBazYoar": wot.outerHTML });
}
