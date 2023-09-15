import * as vs from 'vscode'
import * as path from 'path'

export let disp: (...items: { dispose(): any; }[]) => number

export function onInit(context: vs.ExtensionContext) {
    disp = (...items) => context.subscriptions.push(...items)
}

export function iconPath(name: string) {
    return {
        light: vs.Uri.file(path.join(__filename, '..', '..', 'media', 'svg', name + '.svg')),
        dark: vs.Uri.file(path.join(__filename, '..', '..', 'media', 'svg', name + '.svg'))
    }
}
