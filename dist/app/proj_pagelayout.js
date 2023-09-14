import { newForm } from './util.js'
import { walkCollections } from './proj_collection.js'

const tab_pagelayout_details = {
    id: 'tab_pagelayout_details',
    icon: 'fa-th-large',
    text: 'Page Info',
    ctl: newForm('tab_pagelayout_details_form', (dirty) => proj_pagelayout.onDirty(dirty), [
        { field: 'id', type: 'text', required: true, html: { label: 'Page ID' } }
    ], {
        onValidate(evt) {
            const page_id = tab_pagelayout_details.ctl.getValue('id')
            if (!(page_id && page_id.length && page_id.length > 0))
                evt.detail.errors.push({
                    field: tab_pagelayout_details.ctl.get('id'),
                    error: 'Page ID is required.',
                })
            const parent_coll = proj_pagelayout.parentCollection()
            if (parent_coll && parent_coll.pages && parent_coll.pages.length)
                for (const page of parent_coll.pages)
                    if (page.id == page_id && page != proj_pagelayout.record)
                        evt.detail.errors.push({
                            field: tab_pagelayout_details.ctl.get('id'),
                            error: 'Another Page in "' + parent_coll.id + '" already has this ID.',
                        })
        },
    }),
    dataToUI: () => tab_pagelayout_details.ctl.onDataToUI(() => {
        const pagelayout = proj_pagelayout.record
        tab_pagelayout_details.ctl.setValue('id', pagelayout ? pagelayout.id : '')
    }),
    dataFromUI: () => tab_pagelayout_details.ctl.onDataFromUI(() => {
        const pagelayout = proj_pagelayout.record
        if (pagelayout) {
            const oldID = pagelayout.id
            const newID = tab_pagelayout_details.ctl.getValue('id')
            if (oldID != newID) {
                pagelayout.id = newID
                const parent_coll = proj_pagelayout.parentCollection()
                if (parent_coll)
                    for (const i in parent_coll.pages)
                        if (parent_coll.pages[i] == proj_pagelayout || parent_coll.pages[i].id == oldID)
                            parent_coll.pages[i] = proj_pagelayout
            }
            proj_pagelayout.setRecord(pagelayout)
        }
    }),
}

export const proj_pagelayout = {
    name: 'proj_pagelayout',
    tabbed: [
        tab_pagelayout_details,
    ],
    parentCollection: () => walkCollections((coll) => {
        if (coll.pages && coll.pages.some(_ => _ == proj_pagelayout.record || _.id == proj_pagelayout.record.id))
            return coll
    }),
    setRecord: (rec) => {
        proj_pagelayout.record = rec
        proj_pagelayout.tabbed.forEach(_ => { _.ctl.record = rec })
        proj_pagelayout.dataToUI()
    },
    dataFromUI: () => proj_pagelayout.tabbed.forEach(_ => _.dataFromUI()),
    dataToUI: () => proj_pagelayout.tabbed.forEach(_ => _.dataToUI()),
}
