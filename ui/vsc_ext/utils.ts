import * as vs from 'vscode'
import * as os from 'os'

export let disp: (...items: { dispose(): any; }[]) => number
export let extUri: vs.Uri
export let homeDirPath = vs.Uri.file(os.homedir())

export class Event<T>  {
    private handlers: ((_: T) => void)[] = []
    do(eventHandler: (_: T) => void, first?: boolean) {
        if (first)
            this.handlers = [eventHandler].concat(this.handlers.filter(_ => (_ != eventHandler)))
        else
            this.handlers.push(eventHandler)
    }
    dont(eventHandler: (_: T) => void) {
        this.handlers = this.handlers.filter(_ => (_ != eventHandler))
    }
    now(arg: T) {
        for (const handler of this.handlers)
            handler(arg)
    }
}

export function onInit(context: vs.ExtensionContext) {
    disp = (...items) => context.subscriptions.push(...items)
    extUri = context.extensionUri
}

export function alert(msg: any, detail?: string) {
    vs.window.showWarningMessage(msg ? msg.toString() : JSON.stringify(msg), { detail: detail, modal: true })
}

export function arrayMoveItem<T>(arr: T[], idxOld: number, idxNew: number): T[] {
    const item = arr[idxOld]
    arr.splice(idxOld, 1)
    arr.splice(idxNew, 0, item)
    return arr
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
