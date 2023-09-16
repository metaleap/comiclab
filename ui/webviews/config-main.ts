import * as van from './vanjs/van-1.2.0'

export function onInit(vs: { postMessage: (_: any) => any }) {
    const wot = van.default.tags.a('yo')
    vs.postMessage({ "fo": wot.innerHTML })
}
