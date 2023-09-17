import * as vs from 'vscode'
import * as os from 'os'

export let disp: (...items: { dispose(): any; }[]) => number
export let extUri: vs.Uri
export let homeDirPath = vs.Uri.file(os.homedir())

export function onInit(context: vs.ExtensionContext) {
    disp = (...items) => context.subscriptions.push(...items)
    extUri = context.extensionUri
}

export function iconPath(name: string) {
    return { light: imgPath(name), dark: imgPath(name) }
}

export function noneIn<T>(arr: T[] | null | undefined): boolean {
    return (!arr) || (!arr.length) || (arr.length == 0)
}

export function imgPath(name: string) {
    return vs.Uri.joinPath(extUri, 'ui', 'icons', name + '.svg')
}

export function cssPath(name: string) {
    return vs.Uri.joinPath(extUri, 'ui', 'styles', name + '.css')
}

export function jsPath(name: string) {
    return vs.Uri.joinPath(extUri, 'ui', 'webviews', 'js', name + '.js')
}

export function thenNow<T>(value: T): Thenable<T> {
    return new Promise((resolve, _) => resolve(value))
}
