
export const appState: State = {
    proj: { collections: [] }, config: { contentAuthoring: {} },
    onProjRefreshed: { handlers: [] },
    onCfgRefreshed: { handlers: [] },
    onProjSaved: { handlers: [] },
    onCfgSaved: { handlers: [] },
    onCfgModified: { handlers: [] },
    onProjModified: { handlers: [] },
}

export type Event<T> = {
    handlers: ((_: T) => void)[]
}

export function subscribe<T>(evt: Event<T>, sub: ((_: T) => void)) {
    if (!evt.handlers.includes(sub))
        evt.handlers.push(sub)
}

export function unsubscribe<T>(evt: Event<T>, sub: ((_: T) => void)) {
    evt.handlers = evt.handlers.filter(_ => _ != sub)
}

export function trigger<T>(evt: Event<T>, arg: T) {
    for (const handler of evt.handlers)
        handler(arg)
}

export type State = {
    proj: Proj
    config: Config
    onProjRefreshed: Event<State>
    onCfgRefreshed: Event<State>
    onProjSaved: Event<State>
    onCfgSaved: Event<State>
    onProjModified: Event<Proj>
    onCfgModified: Event<Config>
}

export type Config = {
    contentAuthoring: {
        authors?: { [id: string]: string },
        paperFormats?: { [id: string]: PaperFormat },
        languages?: { [id: string]: string },
        contentFields?: { [id: string]: string },
    },
}

export type PaperFormat = {
    widthMm: number,
    heightMm: number,
}

export type CollOrProj = { id?: string, collections: Collection[] }

export type Proj = {
    collections: Collection[]
}

export type Collection = {
    id: string,
    contentFields: { [id: string]: { [lang_id: string]: string } },
    authorID: string,
    collections: Collection[],
    pages: Page[],
}

export type Page = {
    id: string,
}

export function walkCollections<T>(perColl: (_: Collection[]) => any, parents?: Collection[]) {
    const colls = (parents && parents.length) ? parents[0].collections : appState.proj.collections
    if (colls)
        for (const coll of colls) {
            const cur_path = parents ? [coll].concat(parents) : [coll]
            let ret = perColl(cur_path)
            if (ret || (ret = walkCollections(perColl, cur_path)))
                return ret
        }
    return undefined
}

export function collParent(coll: Collection): CollOrProj {
    const parents_path = collParents(coll)
    return (parents_path.length > 0) ? parents_path[0] : appState.proj
}

export function collParents(coll: Collection): Collection[] {
    return walkCollections((path: Collection[]) => {
        if (path[0] == coll)
            return path.slice(1)
        return undefined
    }) ?? []
}

export function pageParent(page: Page): Collection | undefined {
    const parents_path = pageParents(page)
    return (parents_path && parents_path.length) ? parents_path[0] : undefined
}

export function pageParents(page: Page): Collection[] {
    return walkCollections((path: Collection[]) => {
        if (path[0].pages.includes(page))
            return path
        return undefined
    }) ?? []
}

export function collChildPage(coll: Collection, id: string, ...ignore: Page[]): Page | undefined {
    return coll.pages.find(_ => (_.id == id) && !ignore.includes(_))
}

export function collChildColl(coll: CollOrProj, id: string, ...ignore: Collection[]): Collection | undefined {
    return coll.collections.find(_ => (_.id == id) && !ignore.includes(_))
}
