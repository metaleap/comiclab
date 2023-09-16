
export function toArray<TIn, TRet>(obj: { [key: string]: TIn } | undefined, to: ((k: string, v: TIn) => TRet)): TRet[] {
    const ret: TRet[] = []
    for (const k in obj)
        ret.push(to(k, obj[k]))
    return ret
}
