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
            const new_id = tab_pagelayout_details.ctl.getValue('id')
            if (!(new_id && new_id.length && new_id.length > 0))
                evt.detail.errors.push({
                    field: tab_pagelayout_details.ctl.get('id'),
                    error: 'Page ID is required.',
                })
            const parent_coll = proj_pagelayout.parentCollection()
            if (parent_coll && parent_coll.pages && parent_coll.pages.length)
                for (const page of parent_coll.pages)
                    if (page.id == new_id && page != proj_pagelayout.obj)
                        evt.detail.errors.push({
                            field: tab_pagelayout_details.ctl.get('id'),
                            error: `Another '${new_id}' Page already exists in '${parent_coll.id}'.`,
                        })
        },
    }),
    dataToUI: () => tab_pagelayout_details.ctl.onDataToUI((_) => ({
        'id': proj_pagelayout.obj.id,
    })),
    dataFromUI: () => tab_pagelayout_details.ctl.onDataFromUI((recClean) => {
        proj_pagelayout.obj.id = recClean.id
    }),
}

export const proj_pagelayout = {
    name: 'proj_pagelayout',
    tabbed: [
        tab_pagelayout_details,
    ],
    parentCollection: () => walkCollections((path) => {
        const coll = path[0]
        if (coll.pages && coll.pages.some(_ => _ == proj_pagelayout.obj || _.id == proj_pagelayout.obj.id))
            return coll
    }, []),
    setObj: (obj) => {
        proj_pagelayout.obj = obj
        proj_pagelayout.dataToUI()
    },
    dataFromUI: () => proj_pagelayout.tabbed.forEach(_ => _.dataFromUI()),
    dataToUI: () => { if (proj_pagelayout.obj) proj_pagelayout.tabbed.forEach(_ => _.dataToUI()) },
}
