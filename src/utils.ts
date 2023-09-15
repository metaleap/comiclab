import * as vs from 'vscode'
import * as path from 'path'

export let disp: (...items: { dispose(): any; }[]) => number

export function onInit(context: vs.ExtensionContext) {
    disp = (...items) => context.subscriptions.push(...items)
}

export function iconPath(name: string) {
    return {
        light: path.join(__filename, '..', '..', 'media', 'svg', name + '.svg'),
        dark: path.join(__filename, '..', '..', 'media', 'svg', name + '.svg')
    }
}
