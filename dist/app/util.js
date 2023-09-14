import { w2popup, w2grid, w2form, w2prompt } from '../w2ui/w2ui.es6.js'

export function arrayMoveItem(arr, idxOld, idxNew) {
    var item = arr[idxOld]
    arr.splice(idxOld, 1)
    arr.splice(idxNew, 0, item)
    return arr
}

export function dictCopy(dict) {
    const ret = {}
    if (dict)
        for (const key in dict)
            ret[key] = dict[key]
    return ret
}

export function dictKeys(dict) {
    const ret = []
    if (dict)
        for (const key in dict)
            ret.push(key)
    return ret
}

export function newObjName(what, currentCount, ok) {
    const n = currentCount + 1
    const ret = what.toLowerCase() + (n < 10 ? '0' : '') + n
    return ok(ret) ? ret : (what.toLowerCase() + (new Date().getTime()))
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
    const init = {
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
        onChange(evt) {
            this.mergeChanges()
            onDirty(true)
            setTimeout(this.refresh, 345) // yes, needed again (AND delayed) despite mergeChanges...
        },
        onKeydown(evt) {
            if (['Meta', 'ContextMenu'].includes(evt?.detail?.originalEvent?.key)) {
                evt.isCancelled = true
                evt.preventDefault()
            }
        },
        onDelete(evt) {
            setTimeout(() => {
                if (evt.phase == 'after') {
                    this.mergeChanges()
                    onDirty(true)
                }
            }, 1)
        },
        onAdd(evt) {
            const num_recs = this.records.length
            const proposal = newObjName(objName, num_recs, (name) => !this.get(name))
            w2prompt({
                title: 'Add new ' + objName,
                label: recID + ':',
                value: proposal,
            })
                .ok((evt) => {
                    if (evt?.detail?.value && evt.detail.value.length) {
                        const new_obj = {}
                        new_obj[recID] = evt.detail.value
                        if (this.add(new_obj)) {
                            this.selectNone(true)
                            this.mergeChanges()
                            onDirty(true)
                            this.scrollIntoView(new_obj[recID])
                            this.select(new_obj[recID])
                        }
                    }
                })
        }
    }

    const ret = new w2grid(init)
    ret.onDataToUI = (f) => {
        const recs = f()
        ret.clear(true)
        ret.add(recs)
    }
    ret.onDataFromUI = (f) => {
        ret.mergeChanges()
        f()
    }
    return ret
}

export function newForm(name, onDirty, fields, extras) {
    const init = {
        name: name,
        fields: fields,
        record: {},
        onChange(evt) {
            const errs = this.validate()
            console.log("OC", errs)
            if (!(errs && errs.length && errs.length > 0))
                onDirty(true)
            else
                evt.preventDefault()
        },
    }
    if (extras)
        for (const key in extras)
            init[key] = extras[key]
    for (const field of fields) {
        let v = undefined
        switch (field.type) {
            case 'array', 'check', 'checks', 'enum':
                v = []
            case 'map':
                v = {}
            case 'checkbox', 'toggle':
                v = false
            case 'float', 'int', 'hex', 'money', 'currency', 'percent':
                v = 0
            case 'text', 'alphanumeric', 'pass', 'password', 'color', 'radio', 'select', 'textarea', 'combo', 'div', 'html', 'email', 'list':
                v = ''
        }
        init.record[field.field] = v
    }

    const ret = new w2form(init)
    ret.onDataToUI = (f) => {
        f()
        ret.refresh()
    }
    ret.onDataFromUI = (f) => {
        ret.refresh()
        setTimeout(f, 123)
    }
    return ret
}
