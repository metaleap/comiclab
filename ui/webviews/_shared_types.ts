
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
        authors?: {
            [author_id: string]: string,
        }
    },
}

export type Proj = {
}
