import { w2popup, w2grid, w2prompt } from './w2ui/w2ui.es6.js'

export function arrayMoveItem(arr, idxOld, idxNew) {
    var item = arr[idxOld]
    arr.splice(idxOld, 1)
    arr.splice(idxNew, 0, item)
    return arr
}

export function newObjName(what, currentCount) {
    const n = currentCount + 1
    return what.toLowerCase() + (n < 10 ? '0' : '') + n
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
    logMsg.mostRecentItemID = guiMain.sidebar.insert('log', logMsg.mostRecentItemID,
        {
            id: 'log_item_' + now.getTime(), count: strTime(now), text: msg, tooltip: msg, icon: 'fa ' + (isErr ? 'fa-exclamation-triangle' : 'fa-info-circle'),
            onClick(evt) { w2popup.open({ title: strTime(now), text: msg }) },
        },
    ).id
    guiMain.sidebar.expand('log')
    if (isErr)
        w2popup.open({ title: strTime(now), text: msg })
}

export function newGrid(name, recID, objName, onDirty, fields) {
    const ret = new w2grid({
        name: name,
        selectType: 'row',
        multiSelect: true,
        show: {
            columnMenu: false,
            footer: false,
            toolbar: true,
            toolbarAdd: true,
            toolbarDelete: true,
            toolbarEdit: false,
            toolbarSave: false,
            toolbarSearch: false,
            toolbarReload: false,
            recordTitles: true,
        },
        autoLoad: false,
        advanceOnEdit: false,
        recid: recID,
        columns: fields,
    })
    ret.afterDataToUI = (records) => {
        ret.clear(true)
        ret.add(records)
    }
    ret.beforeDataFromUI = ret.mergeChanges

    ret.on('keydown', (evt) => {
        if (evt.detail && evt.detail.originalEvent && (evt.detail.originalEvent.key == 'Meta' || evt.detail.originalEvent.key == 'ContextMenu')) {
            evt.isCancelled = true
            evt.preventDefault()
        }
    })
    ret.on('delete', (evt) => {
        setTimeout(() => {
            if (evt.phase == 'after') {
                ret.mergeChanges()
                onDirty(true)
            }
        }, 1)
    })
    ret.on('add', (evt) => {
        const num_recs = ret.records.length
        const proposal = newObjName(objName, num_recs)
        w2prompt({
            title: 'Add new ' + objName,
            label: recID + ':',
            value: proposal,
        })
            .ok((evt) => {
                if (evt?.detail?.value && evt.detail.value.length) {
                    const new_obj = {}
                    new_obj[recID] = evt.detail.value
                    if (ret.add(new_obj)) {
                        ret.selectNone(true)
                        ret.mergeChanges()
                        onDirty(true)
                        ret.scrollIntoView(new_obj[recID])
                        ret.select(new_obj[recID])
                    }
                }
            })
    })
    ret.on('change', (evt) => {
        ret.mergeChanges()
        onDirty(true)
        ret.refresh() // yes, needed again despite mergeChanges...
    })

    return ret
}
