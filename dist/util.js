import { w2popup } from '/w2ui/w2ui-2.0.es6.js'


export function setToolbarIcon(toolbar, id, icon) {
    const item = toolbar.get(id)
    if (item) {
        item.icon = icon
        toolbar.refresh()
    }
}

function strTime(t) {
    return t.toLocaleTimeString(undefined, { hour12: false })
}

export function logErr(err) { logMsg(true, err) }
export function logInfo(msg) { logMsg(false, msg) }
export function logMsg(isErr, msg) {
    const now = new Date()
    logMsg.mostRecentItem = guiMain.sidebar.insert('log', logMsg.mostRecentItem,
        {
            id: 'log_item_' + now.getTime(), count: strTime(now), text: msg, tooltip: msg, icon: 'fa ' + (isErr ? 'fa-exclamation-triangle' : 'fa-info-circle'),
            onClick(evt) {
                w2popup.open({ title: strTime(now), text: msg })
            }
        },
    ).id
    guiMain.sidebar.expand('log')
    if (isErr)
        w2popup.open({ title: strTime(now), text: msg })
}
