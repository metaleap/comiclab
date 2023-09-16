
export function toArray<TIn, TRet>(obj: { [key: string]: TIn } | undefined, to: ((key: string, v: TIn) => TRet)): TRet[] {
    const ret: TRet[] = []
    for (const key in obj)
        ret.push(to(key, obj[key]))
    return ret
}
