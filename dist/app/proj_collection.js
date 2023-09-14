import { newForm } from './util.js'

const tab_collection_details = {
    id: 'tab_collection_details',
    icon: 'fa-briefcase',
    text: 'Collection Info',
    ctl: newForm('tab_collection_details_form', (dirty) => proj_collection.onDirty(dirty), [
        { field: 'id', type: 'text', required: true, html: { label: 'Collection ID' } }
    ], {
        onValidate(evt) {
            const new_id = tab_collection_details.ctl.getValue('id')
            if (!(new_id && new_id.length && new_id.length > 0))
                evt.detail.errors.push({
                    field: tab_collection_details.ctl.get('id'),
                    error: 'Collection ID is required.',
                })
            const parent_coll = proj_collection.parentCollection()
            const sibling_colls = parent_coll ? parent_coll.collections : appState.proj.collections
            if (sibling_colls.length)
                for (const coll of sibling_colls)
                    if (coll.id == new_id && coll != proj_collection.record)
                        evt.detail.errors.push({
                            field: tab_collection_details.ctl.get('id'),
                            error: `Another '${new_id}' Collection already exists in ` + (parent_coll ? (`'${parent_coll.id}'`) : 'this project') + `.`,
                        })
        },
    }),
    dataToUI: () => tab_collection_details.ctl.onDataToUI(() => {
        const collection = tab_collection_details.ctl.record
        tab_collection_details.ctl.setValue('id', collection ? collection.id : '')
    }),
    dataFromUI: () => tab_collection_details.ctl.onDataFromUI(() => {
        const collection = tab_collection_details.ctl.record
        if (collection) {
            const oldID = collection.id
            const newID = tab_collection_details.ctl.getValue('id')
            if (oldID != newID) {
                collection.id = newID
                const parent_collection = proj_collection.parentCollection()
                if (parent_collection)
                    for (const i in parent_collection.collections)
                        if (parent_collection.collections[i] == collection || parent_collection.collections[i].id == oldID)
                            parent_collection.collections[i] = collection
            }
            tab_collection_details.ctl.record = collection
        }
    }),
}

export function walkCollections(perColl, parents) {
    const colls = (parents && parents.length) ? parents[0].collections : appState.proj.collections
    if (colls)
        for (const coll of colls) {
            const cur_path = parents ? [coll].concat(parents) : [coll]
            let ret = perColl(cur_path)
            if (ret || (ret = walkCollections(perColl, cur_path)))
                return ret
        }
}

function collectionParents(coll) {
    return walkCollections((path) => {
        if (path[0] == coll)
            return path.slice(1)
    })
}

export const proj_collection = {
    name: 'proj_collection',
    tabbed: [
        tab_collection_details,
    ],
    parentCollection: () => {
        const path = collectionParents(proj_collection.record)
        return (path && path.length && path.length > 0) ? path[0] : null
    },
    setRecord: (rec) => {
        proj_collection.record = rec
        proj_collection.tabbed.forEach(_ => { _.ctl.record = rec })
        proj_collection.dataToUI()
    },
    dataFromUI: () => proj_collection.tabbed.forEach(_ => _.dataFromUI()),
    dataToUI: () => proj_collection.tabbed.forEach(_ => _.dataToUI()),
}
