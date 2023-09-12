import { w2popup } from '/w2ui/w2ui.es6.js'

export function arrayMoveItem(arr, idxOld, idxNew) {
    var item = arr[idxOld]
    arr.splice(idxOld, 1)
    arr.splice(idxNew, 0, item)
    return arr
}

export function newObjName(what, existingNames) {
    let nn = 'new' + what
    let n = existingNames.length + 1
    let ret = nn + n
    for (let i = 0; i < existingNames.length; i++)
        if (ret == existingNames[i]) {
            n++
            ret = nn + n
            i = -1
        }
    return ret
}

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
