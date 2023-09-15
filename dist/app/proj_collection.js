import { newForm, newLayout } from './util.js'

const tab_coll_details_form = newForm('tab_coll_details_form', (dirty) => proj_collection.onDirty(dirty), [
    { field: 'id', type: 'text', required: true, html: { label: 'Collection ID' } },
    { field: 'author', type: 'combo', html: { label: 'Author' }, lookupDict: () => appState.config.contentAuthoring.authors },
], {
    isSidebarObj: true,
    onValidate(evt) {
        const new_id = tab_coll_details_form.getValue('id')
        if (!(new_id && new_id.length && new_id.length > 0))
            evt.detail.errors.push({
                field: tab_coll_details_form.get('id'),
                error: 'Collection ID is required.',
            })
        const parent_coll = proj_collection.parentCollection()
        const sibling_colls = parent_coll ? parent_coll.collections : appState.proj.collections
        if (sibling_colls && sibling_colls.length)
            for (const coll of sibling_colls)
                if (coll.id == new_id && coll != proj_collection.obj)
                    evt.detail.errors.push({
                        field: tab_coll_details_form.get('id'),
                        error: `Another '${new_id}' Collection already exists in ` + (parent_coll ? (`'${parent_coll.id}'`) : 'this project') + `.`,
                    })
    },
})

const tab_coll_details = {
    id: 'tab_coll_details',
    icon: 'fa-briefcase',
    text: 'Collection Info',
    ctl: newLayout('tab_coll_details_layout', [
        { type: 'left', size: '50%', resizable: true, html: tab_coll_details_form, },
        { type: 'main', size: '50%', resizable: true, html: 'TODO grid' }
    ]),
    dataToUI: () => tab_coll_details_form.onDataToUI((_) => ({
        'id': proj_collection.obj.id,
        'author': proj_collection.obj.author,
    })),
    dataFromUI: () => tab_coll_details_form.onDataFromUI((recClean) => {
        proj_collection.obj.id = recClean.id
        proj_collection.obj.author = recClean.author
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
        tab_coll_details,
    ],
    parentCollection: () => {
        const path = collectionParents(proj_collection.obj)
        return (path && path.length && path.length > 0) ? path[0] : null
    },
    setObj: (obj) => {
        proj_collection.obj = obj
        proj_collection.dataToUI()
    },
    dataFromUI: () => { if (proj_collection.obj) proj_collection.tabbed.forEach(_ => _.dataFromUI()) },
    dataToUI: () => { if (proj_collection.obj) proj_collection.tabbed.forEach(_ => _.dataToUI()) },
}
