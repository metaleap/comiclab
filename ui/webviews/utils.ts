
export function arrFromDict<TArr, TDict>(obj: { [key: string]: TDict } | undefined, to: ((key: string, v: TDict) => TArr)): TArr[] {
    const ret: TArr[] = []
    for (const key in obj)
        ret.push(to(key, obj[key]))
    return ret
}

export function arrToDict<TArr, TDict>(arr: TArr[], to: (_: TArr) => [string, TDict]): { [key: string]: TDict } {
    const ret: { [key: string]: TDict } = {}
    for (const item of arr) {
        const tup = to(item)
        ret[tup[0]] = tup[1]
    }
    return ret
}
