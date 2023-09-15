import { newForm } from './util.js'
import { walkCollections } from './proj_collection.js'

const tab_page_details = {
    id: 'tab_page_details',
    icon: 'fa-th-large',
    text: 'Page Info',
    ctl: newForm('tab_page_details_form', (dirty) => proj_page.onDirty(dirty), [
        { field: 'id', type: 'text', required: true, html: { label: 'Page ID' } }
    ], {
        isSidebarObj: true,
        onValidate(evt) {
            const new_id = tab_page_details.ctl.getValue('id')
            if (!(new_id && new_id.length && new_id.length > 0))
                evt.detail.errors.push({
                    field: tab_page_details.ctl.get('id'),
                    error: 'Page ID is required.',
                })
            const parent_coll = proj_page.parentCollection()
            if (parent_coll && parent_coll.pages && parent_coll.pages.length)
                for (const page of parent_coll.pages)
                    if (page.id == new_id && page != proj_page.obj)
                        evt.detail.errors.push({
                            field: tab_page_details.ctl.get('id'),
                            error: `Another '${new_id}' Page already exists in '${parent_coll.id}'.`,
                        })
        },
    }),
    dataToUI: () => tab_page_details.ctl.onDataToUI((_) => ({
        'id': proj_page.obj.id,
    })),
    dataFromUI: () => tab_page_details.ctl.onDataFromUI((recClean) => {
        proj_page.obj.id = recClean.id
    }),
}

export const proj_page = {
    name: 'proj_page',
    tabbed: [
        tab_page_details,
    ],
    parentCollection: () => walkCollections((path) => {
        const coll = path[0]
        if (coll.pages && coll.pages.some(_ => _ == proj_page.obj || _.id == proj_page.obj.id))
            return coll
    }, []),
    setObj: (obj) => {
        proj_page.obj = obj
        proj_page.dataToUI()
    },
    dataFromUI: () => { if (proj_page.obj) proj_page.tabbed.forEach(_ => _.dataFromUI()) },
    dataToUI: () => { if (proj_page.obj) proj_page.tabbed.forEach(_ => _.dataToUI()) },
}
