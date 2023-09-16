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

export function imgPath(name: string) {
    return vs.Uri.joinPath(extUri, 'ui', 'svg', name + '.svg')
}
