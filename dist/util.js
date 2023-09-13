import { w2popup, w2grid } from '/w2ui/w2ui.es6.js'

export function arrayMoveItem(arr, idxOld, idxNew) {
    var item = arr[idxOld]
    arr.splice(idxOld, 1)
    arr.splice(idxNew, 0, item)
    return arr
}

export function newObjName(what, existingNames) {
    let nn = what.toLowerCase()
    let n = existingNames.length + 1
    let ret = nn + (n < 10 ? '0' : '') + n
    for (let i = 0; i < existingNames.length; i++)
        if (ret == existingNames[i]) {
            n++
            ret = nn + (n < 10 ? '0' : '') + n
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

export function newGrid(name, objName, recid, onDirty, fields, records) {
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
        recid: recid,
        columns: fields,
        records: records ?? [],
    })

    ret.on('keydown', (evt) => {
        if (evt.detail && evt.detail.originalEvent && (evt.detail.originalEvent.key == 'Meta' || evt.detail.originalEvent.key == 'ContextMenu')) {
            evt.isCancelled = true
            evt.preventDefault()
        }
    })
    ret.on('delete', (evt) => {
        setTimeout(() => { if (evt.phase == 'after') onDirty(true) }, 1)
    })
    ret.on('add', (evt) => {
        const initialID = newObjName(objName, ret.records.map(_ => _[recid]))
        const new_obj = {}
        new_obj[recid] = initialID
        ret.add(new_obj)
        ret.scrollIntoView(initialID)
        ret.editField(initialID, 0)
        onDirty(true)
    })
    ret.on('change', (evt) => {
        const col = ret.columns[evt.detail.column]
        if ((!col) || (!col.editable) || (col.editable.type != 'text') || col.editable.allowEmpty) {
            onDirty(true)
            return
        }
        if (evt.detail.value.new && evt.detail.value.new.length) {
            const rec = ret.records[evt.detail.index]
            rec[col.field] = evt.detail.value.new
            ret.records[evt.detail.index] = rec
            onDirty(true)
        } else {
            evt.detail.value.new = evt.detail.value.previous
            evt.isCancelled = true
            evt.preventDefault()
        }
    })

    return ret
}
