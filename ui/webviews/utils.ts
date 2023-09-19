export let vs: { postMessage: (_: any) => any }


export function onInit(vscode: { postMessage: (_: any) => any }) {
    vs = vscode
}

export function alert(msg: string) {
    vs.postMessage({ ident: 'alert', payload: msg })
}

export function dictToArr<TArr, TDict>(dict: { [key: string]: TDict } | undefined, to: ((key: string, v: TDict) => TArr)): TArr[] {
    const ret: TArr[] = []
    if (dict)
        for (const key in dict)
            ret.push(to(key, dict[key]))
    return ret
}

export function dictFromArr<TArr, TDict>(arr: TArr[] | undefined, to: (_: TArr) => [string, TDict]): { [key: string]: TDict } {
    const ret: { [key: string]: TDict } = {}
    if (arr)
        for (const item of arr) {
            const tup = to(item)
            ret[tup[0]] = tup[1]
        }
    return ret
}
