
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

export type Proj = {
    collections: Collection[]
}

export type Collection = {
    name: string,
    collections: Collection[],
    pages: Page[],
    props: {
        authorId?: string,
        pageFormatId?: string,
        contentFields?: { [id: string]: { [lang_id: string]: string } },
    },
}

export type Page = {
    name: string,
    panels: Panel[],
    props: {},
}

export type Panel = {
}

type CollOrProj = { name?: string, collections: Collection[] }

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

export function pageToPath(page: Page): string {
    const page_path = pageParents(page)
    return ([page] as any[]).concat(page_path).reverse().map(_ => _.name).join('/')
}

export function pageFromPath(path: string): Page | undefined {
    const parts = path.split('/')
    let coll = appState.proj.collections.find(_ => (_.name == parts[0]))
    for (let i = 1; coll && (i < parts.length); i++)
        if (i == (parts.length - 1))
            return coll.pages.find(_ => (_.name == parts[i]))
        else
            coll = coll.collections.find(_ => (_.name == parts[i]))
    return undefined
}

export function collChildPage(coll: Collection, id: string, ...ignore: Page[]): Page | undefined {
    return coll.pages.find(_ => (_.name == id) && !ignore.includes(_))
}

export function collChildColl(coll: CollOrProj, id: string, ...ignore: Collection[]): Collection | undefined {
    return coll.collections.find(_ => (_.name == id) && !ignore.includes(_))
}

export function collToPath(coll: Collection): string {
    const coll_path = collParents(coll)
    return [coll].concat(coll_path).reverse().map(_ => _.name).join('/')
}

export function collFromPath(path: string): Collection | undefined {
    let coll: Collection | undefined
    const parts = path.split('/')
    let colls: Collection[] = appState.proj.collections
    for (let i = 0; i < parts.length; i++)
        if (coll = colls.find(_ => (_.name == parts[i])))
            colls = coll.collections
        else
            break
    return coll
}

export function collPageFormat(coll: Collection): PaperFormat | undefined {
    const path = [coll].concat(collParents(coll))
    for (const coll of path)
        if (coll.props.pageFormatId && coll.props.pageFormatId.length > 0)
            return appState.config.contentAuthoring.paperFormats ? appState.config.contentAuthoring.paperFormats[coll.props.pageFormatId] : undefined
    return undefined
}

export function strPaperFormat(_: PaperFormat): string {
    return _ ? (_.widthMm + "×" + _.heightMm + " mm") : ''
}

export function deepEq(v1: any, v2: any, mustSameArrayOrder?: boolean): boolean {
    if (v1 === v2 || (v1 === null && v2 === undefined) || (v1 === undefined && v2 === null))
        return true
    if ((typeof v1 == 'object') && (typeof v2 == 'object')) {
        const a1 = Array.isArray(v1), a2 = Array.isArray(v2)
        if ((a1 != a2) || (a1 && a2 && v1.length != v2.length)) // array vs. object
            return false
        else if (!(a1 && a2)) { // object
            for (const k in v1)
                if (deepEq(v1[k], v2[k], mustSameArrayOrder))
                    return true
        } else if (mustSameArrayOrder) { // array, in order
            for (let i = 0; i < v1.length; i++)
                if (!deepEq(v1[i], v2[i], mustSameArrayOrder))
                    return false
            return true
        } else {  // array, ignoring order
            for (const item1 of v1)
                for (const item2 of v2)
                    if (deepEq(item1, item2, mustSameArrayOrder))
                        return true
        }
    }
    return false
}
