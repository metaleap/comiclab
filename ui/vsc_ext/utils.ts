import * as vs from 'vscode'
import * as os from 'os'

export let disp: (...items: { dispose(): any; }[]) => number
export let extUri: vs.Uri
export let homeDirPath = vs.Uri.file(os.homedir())

export function onInit(context: vs.ExtensionContext) {
    disp = (...items) => context.subscriptions.push(...items)
    extUri = context.extensionUri
}

// export function iconPath(name: string) {
//     return { light: imgPath(name), dark: imgPath(name) }
// }

export function noneIn<T>(arr: T[] | null | undefined): boolean {
    return (!arr) || (!arr.length) || (arr.length == 0)
}

export function extPath(...pathSegments: string[]) {
    return vs.Uri.joinPath(extUri, ...pathSegments)
}

export function codiconPath(name: string) {
    return extPath('node_modules', '@vscode', 'codicons', 'src', 'icons', name + '.svg')
}

export function imgPath(name: string) {
    return extPath('ui', 'icons', name + '.svg')
}

export function cssPath(name: string) {
    return extPath('ui', 'styles', name + '.css')
}

export function jsPath(name: string) {
    return extPath('ui', 'webviews', 'js', name + '.js')
}

export function thenNow<T>(value: T): Thenable<T> {
    return new Promise((resolve, _) => resolve(value))
}
