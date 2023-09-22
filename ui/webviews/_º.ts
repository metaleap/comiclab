
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
    x: number,
    y: number,
    w: number,
    h: number,
    round: number,
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

export function pageUpdate(pagePath: string, newPage: Page) {
    const cur_page = pageFromPath(pagePath)
    const parent = cur_page ? pageParent(cur_page) : undefined
    if (parent)
        parent.pages[parent.pages.findIndex((_) => (_ == cur_page))] = newPage
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

export function pageSizeMm(page: Page): { wMm: number, hMm: number } {
    const coll = pageParent(page)
    if (coll) {
        const page_format = collPageFormat(coll)
        if (page_format)
            return { wMm: page_format.widthMm, hMm: page_format.heightMm }
    }
    return {} as any
}

export function strPaperFormat(_: PaperFormat): string {
    return _ ? (_.widthMm + "×" + _.heightMm + " mm") : ''
}

export function deepEq(val1: any, val2: any, mustSameArrayOrder?: boolean): boolean {
    if (val1 === val2 || (val1 === null && val2 === undefined) || (val1 === undefined && val2 === null))
        return true
    if ((typeof val1 == 'object') && (typeof val2 == 'object')) {
        const arr1 = Array.isArray(val1), arr2 = Array.isArray(val2)

        if ((arr1 != arr2) || (arr1 && arr2 && val1.length != val2.length))
            return false

        else if (!(arr1 && arr2)) { // 2 objects
            let len1 = 0, len2 = 0
            for (const k in val2)
                len2++
            for (const k in val1)
                if (((++len1) > len2) || !deepEq(val1[k], val2[k], mustSameArrayOrder))
                    return false
            return (len1 == len2)

        } else if (mustSameArrayOrder) { // 2 arrays, in order
            for (let i = 0; i < val1.length; i++)
                if (!deepEq(val1[i], val2[i], mustSameArrayOrder))
                    return false
            return true

        } else { // 2 arrays, ignoring order
            for (const item1 of val1) {
                let found = false
                for (const item2 of val2)
                    if (found = deepEq(item1, item2, mustSameArrayOrder))
                        break
                if (!found)
                    return false
            }
            return true
        }
    }
    return false
}
