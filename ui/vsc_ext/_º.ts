
export const appState: AppState = {
    proj: { collections: [] },
    config: { contentAuthoring: {} },
}

export type AppState = {
    proj: Proj
    config: Config
}

export type Config = {
    contentAuthoring: {
        authors?: { [id: string]: string },
        paperFormats?: { [id: string]: PaperFormat },
        languages?: { [id: string]: string },
        contentFields?: { [id: string]: boolean },
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

export function collToPath(coll: Collection): string {
    const coll_path = collParents(coll)
    return [coll].concat(coll_path).reverse().map(_ => _.id).join('/')
}

export function collFromPath(path: string): Collection | undefined {
    let coll: Collection | undefined
    const parts = path.split('/')
    let colls: Collection[] = appState.proj.collections
    for (let i = 0; i < parts.length; i++)
        if (coll = colls.find(_ => (_.id == parts[i])))
            colls = coll.collections
        else
            break
    return coll
}
