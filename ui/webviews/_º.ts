export const appState: AppState = {
    proj: { collections: [], collProps: {}, pageProps: {}, panelProps: {}, balloonProps: {} },
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
        customFields?: { [id: string]: boolean },
    },
}

export type PaperFormat = {
    widthMm: number,
    heightMm: number,
}

export type Proj = {
    collections: Collection[]
    collProps: CollProps
    pageProps: PageProps
    panelProps: PanelProps
    balloonProps: BalloonProps
}

export type Collection = {
    name: string
    collections: Collection[]
    pages: Page[]
    collProps: CollProps
    pageProps: PageProps
    panelProps: PanelProps
    balloonProps: BalloonProps
}

export type Page = {
    name: string
    panels: Panel[]
    balloons: Balloon[]
    pageProps: PageProps
    panelProps: PanelProps
    balloonProps: BalloonProps
}

export type Pos = {
    x: number
    y: number
}

export type Size = {
    w: number
    h: number
}

export type Shape = Pos & Size

export type Panel = Shape & {
    text?: string
    panelProps: PanelProps
}

export type Balloon = Shape & {
    balloonProps: BalloonProps
}

export type ShapeRef = {
    idx: number
    isBalloon: boolean
}

export type ProjOrColl = (Proj | Collection) & { name?: string }

export type ProjOrCollOrPage = {
    collProps?: CollProps
    pageProps: PageProps
    panelProps: PanelProps
    balloonProps: BalloonProps
    panels?: Panel[]
    balloons?: Balloon[]
}

export type CollProps = {
    authorId?: string
    customFields?: { [id: string]: { [lang_id: string]: string } }
}

export type PageProps = {
    paperFormatId?: string
}

export type ShapeProps = {
    borderWidthMm?: number
    roundness?: number
}

export type PanelProps = ShapeProps & {
    innerMarginMm?: number
    outerMarginMm?: number
}

export type BalloonProps = ShapeProps & {
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

export function collParent(coll: Collection): ProjOrColl {
    const parents_path = collParents(coll)
    return (parents_path.length > 0) ? parents_path[0] : appState.proj
}

export function collParents(coll: Collection): Collection[] {
    return (!coll) ? [] : (walkCollections((path: Collection[]) => {
        if (path[0] == coll)
            return path.slice(1)
        return undefined
    }) ?? [])
}

export function pageParent(page: Page): Collection {
    return pageParents(page)[0]
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

export function collChildColl(coll: ProjOrColl, id: string, ...ignore: Collection[]): Collection | undefined {
    return coll.collections.find(_ => (_.name == id) && !ignore.includes(_))
}

export function collToPath(coll: Collection): string {
    const coll_path = collParents(coll)
    return [coll].concat(coll_path).reverse().map(_ => _.name).join('/')
}

export function collFromPath(path: string): Collection | undefined {
    let coll: Collection | undefined
    if (path === '')
        return undefined
    const parts = path.split('/')
    let colls: Collection[] = appState.proj.collections
    for (let i = 0; i < parts.length; i++)
        if (coll = colls.find(_ => (_.name == parts[i])))
            colls = coll.collections
        else
            break
    return coll
}


export function collProps(it: ProjOrCollOrPage): CollProps {
    return props<CollProps>(it, 'collProps')
}
export function pageProps(it: ProjOrCollOrPage): PageProps {
    return props<PageProps>(it, 'pageProps')
}
export function panelProps(it: ProjOrCollOrPage, panelIdx?: number, panel?: Panel): PanelProps {
    const ret = props<PanelProps>(it, 'panelProps')
    const is_page = (it.panels !== undefined)
    if (is_page && (panel || (panelIdx !== undefined))) {
        const props = (panel ?? ((it as Page).panels[panelIdx!])).panelProps
        for (const k in props)
            if ((props as any)[k] !== undefined)
                (ret as any)[k] = (props as any)[k]
    }
    return ret
}
export function balloonProps(it: ProjOrCollOrPage, balloonIdx?: number): BalloonProps {
    const ret = props<BalloonProps>(it, 'balloonProps')
    const is_page = (it.balloons !== undefined)
    if (is_page && balloonIdx !== undefined) {
        const props = (it as Page).balloons[balloonIdx].balloonProps
        for (const k in props)
            if ((props as any)[k] !== undefined)
                (ret as any)[k] = (props as any)[k]
    }
    return ret
}
export function props<T>(it: ProjOrCollOrPage, propsName: string): T {
    const is_page = (it.panels !== undefined)
    const ret = dictMerge((appState.proj as any)[propsName]) as T
    const colls = (it == appState.proj) ? [] : (is_page ? pageParents(it as Page) : [it as Collection].concat(collParents(it as Collection)))
    for (let i = colls.length - 1; i >= 0; i--) {
        const coll = colls[i]
        for (const k in (coll as any)[propsName] as T) {
            if (((coll as any)[propsName] as T as any)[k] !== undefined)
                (ret as any)[k] = ((coll as any)[propsName] as T as any)[k]
        }
    }
    for (const k in (it as any)[propsName])
        if (((it as any)[propsName][k]) !== undefined)
            (ret as any)[k] = (it as any)[propsName][k]
    return ret
}

export function pageSizeMm(page: Page): Size {
    const paper_format = cfgPaperFormat(pageProps(page).paperFormatId)
    if (paper_format)
        return { w: paper_format.widthMm, h: paper_format.heightMm }
    return { w: 0, h: 0 }
}

export function cfgPaperFormat(name?: string): PaperFormat | undefined {
    return (name && appState.config.contentAuthoring.paperFormats) ? appState.config.contentAuthoring.paperFormats[name] : undefined
}

export type Direction = 0 | 1 | -1 | typeof NaN
export const DirPrev: Direction = -1
export const DirNext: Direction = 1
export const DirStart: Direction = 0
export const DirEnd: Direction = NaN
export const DirLeft = DirPrev
export const DirRight = DirNext
export const DirUp = DirStart
export const DirDown = DirEnd

export function pageReorder(page: Page, panelIdx: number | undefined, balloonIdx: number | undefined, direction: Direction, dontDoIt?: boolean): boolean {
    const idx_new = arrayCanMove(((panelIdx === undefined) ? page.balloons : page.panels) as Shape[], panelIdx ?? balloonIdx!, direction)
    const can_move = (idx_new !== undefined)
    if (can_move && !dontDoIt) {
        if (panelIdx === undefined)
            page.balloons = arrayMoveItem(page.balloons, balloonIdx!, idx_new)
        else
            page.panels = arrayMoveItem(page.panels, panelIdx, idx_new)
    }
    return can_move
}

export function shapesOverlapV(cur: Shape, other: Shape): boolean {
    return ((cur.y + cur.h) > other.y) && (cur.y < (other.y + other.h))
}

export function shapesOverlapH(cur: Shape, other: Shape): boolean {
    return (other.x < (cur.x + cur.w) && (other.x + other.w) > cur.x)
}

export function strPaperFormat(_: PaperFormat): string {
    return _ ? (_.widthMm + "×" + _.heightMm + " mm") : ''
}

export function arrayCanMove<T>(arr: T[], idxOld: number, direction: Direction): number | undefined {
    if (arr.length < 2)
        return undefined
    const idx_new =
        (direction == DirPrev) ? (idxOld - 1)
            : ((direction == DirNext) ? (idxOld + 1)
                : ((direction == DirStart) ? 0
                    : (arr.length - 1)))
    const can_move = (idx_new != idxOld) && (idx_new >= 0) && (idx_new < arr.length)
    return can_move ? idx_new : undefined
}

export function arrayMoveItem<T>(arr: T[], idxOld: number, idxNew: number): T[] {
    const item = arr[idxOld]
    arr.splice(idxOld, 1)
    arr.splice(idxNew, 0, item)
    return arr
}

export function deepEq(val1: any, val2: any, ignoreArrayOrder?: boolean): boolean {
    // deepEq only covers the JSON subset of the JS/TS type-scape
    if (val1 === val2 || (val1 === null && val2 === undefined) || (val1 === undefined && val2 === null))
        return true
    if ((typeof val1) !== (typeof val2))
        return false
    if (((typeof val1) == 'number') && ((typeof val2) == 'number'))
        return fEq(val1, val2)
    if (((typeof val1) == 'object') && ((typeof val2) == 'object')) {
        const arr1 = Array.isArray(val1), arr2 = Array.isArray(val2)

        if ((arr1 != arr2) || (arr1 && arr2 && val1.length != val2.length))
            return false

        else if (!(arr1 && arr2)) { // 2 objects
            let len1 = 0, len2 = 0
            for (const k in val2)
                len2++
            for (const k in val1)
                if (((++len1) > len2) || !deepEq(val1[k], val2[k], ignoreArrayOrder))
                    return false
            return (len1 == len2)

        } else if (!ignoreArrayOrder) { // 2 arrays, in order
            for (let i = 0; i < val1.length; i++)
                if (!deepEq(val1[i], val2[i], ignoreArrayOrder))
                    return false
            return true

        } else { // 2 arrays, ignoring order
            for (const item1 of val1) {
                let found = false
                for (const item2 of val2)
                    if (found = deepEq(item1, item2, ignoreArrayOrder))
                        break
                if (!found)
                    return false
            }
            return true
        }
    }
    return false
}

export function isPosInShape(shape: Shape, pos: Pos): boolean {
    return (pos.x > shape.x) && (pos.y > shape.y) && (pos.x < (shape.x + shape.w)) && (pos.y < (shape.y + shape.h))
}

export function dictMerge<TDict>(...dicts: { [_: string]: TDict }[]): { [_: string]: TDict } {
    return Object.assign({}, ...dicts)
}

export function jsonUnJson(v: any): any {
    return JSON.parse(JSON.stringify(v))
}

export function fEq(a: number, b: number): boolean {
    return (isNaN(a) || isNaN(b))
        ? (isNaN(a) && isNaN(b))
        : ((a === b) || Math.abs(a - b) < (((a > 1) || (b > 1)) ? (Math.max(a, b) * Number.EPSILON) : Number.EPSILON))
}
