import { w2popup, w2grid, w2form, w2prompt, w2alert, w2layout } from '../w2ui/w2ui.es6.js'

import { app_sidebar } from './app_sidebar.js'

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

export function dictMerge(...dicts) {
    const ret = {}
    for (const dict of dicts)
        for (const k in dict)
            ret[k] = dict[k]
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

export function newGrid(name, recID, objName, onDirty, fields, noAddDelete) {
    const init = {
        name: name,
        selectType: 'row',
        multiSelect: true,
        show: {
            columnMenu: false,
            footer: false,
            toolbar: !noAddDelete,
            toolbarAdd: !noAddDelete,
            toolbarDelete: !noAddDelete,
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
        const recs = f ? f(ret.records) : ret.records
        ret.clear(true)
        ret.add(recs)
    }
    ret.onDataFromUI = (f) => {
        ret.mergeChanges()
        f(ret.records)
    }
    return ret
}

export function newForm(name, onDirty, fields, extras) {
    const init = {
        name: name,
        fields: fields,
        record: {},
        onChange(evt) {
            const errs = this.validate(false)
            if (errs && errs.length && errs.length > 0) {
                evt.preventDefault()
                this.setValue(errs[0].field.field, evt.detail?.value?.previous)
                this.refresh()
                w2alert(errs[0].error, errs[0].field.field)
            } else {
                onDirty(true)
                if (evt.detail.field == 'id' && extras?.isSidebarObj && evt.detail.value?.current != evt.detail.value?.previous)
                    setTimeout(() => { app_sidebar.dataToUI(true) }, 22)
            }
        },
    }
    for (const field of fields) {
        let v
        switch (field.type) {
            case 'array', 'check', 'checks', 'enum':
                v = []
                break
            case 'map':
                v = {}
                break
            case 'checkbox', 'toggle':
                v = false
                break
            case 'float', 'int', 'hex', 'money', 'currency', 'percent':
                v = 0
                break
            case 'text', 'alphanumeric', 'pass', 'password', 'color', 'radio', 'select', 'textarea', 'combo', 'div', 'html', 'email', 'list':
                v = ''
                break
        }
        init.record[field.field] = v
        if (field.type == 'combo' && field.lookupDict && !(field.options && field.options.items)) {
            if (!field.options)
                field.options = {}
            field.options.items = () => dictKeys(field.lookupDict())
        }
    }
    if (extras)
        for (const key in extras)
            init[key] = extras[key]

    const ret = new w2form(init)
    ret.refreshLookupHints = (recClean) => {
        for (const field of ret.fields)
            if (field && field.type == 'combo' && field.lookupDict && field.el) {
                const dict = field.lookupDict()
                if (dict)
                    field.el.title = dict[recClean[field.field] ?? '']
            }
    }
    ret.onDataToUI = (f) => {
        const rec_clean = ret.getCleanRecord(true)
        const rec = f ? f(rec_clean) : rec_clean
        for (const field in rec)
            ret.setValue(field, rec[field], true)
        setTimeout(() => {
            ret.refreshLookupHints(rec_clean)
            ret.refresh()
        }, 44)
    }
    ret.onDataFromUI = (f) => {
        ret.refresh()
        setTimeout(() => {
            const rec_clean = ret.getCleanRecord(true)
            ret.refreshLookupHints(rec_clean)
            f(rec_clean)
        }, 44)
    }
    return ret
}

export function newLayout(name, panels) {
    const init = { name: name, panels: panels, padding: 0, resizer: 4 }
    const ret = new w2layout(init)
    return ret
}
