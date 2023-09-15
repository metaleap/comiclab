import { newForm, newLayout, newGrid, dictMerge } from './util.js'

const tab_coll_details_form = newForm('tab_coll_details_form', (dirty) => proj_coll.onDirty(dirty), [
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
        const parent_coll = proj_coll.parentCollection()
        const sibling_colls = parent_coll ? parent_coll.collections : appState.proj.collections
        if (sibling_colls && sibling_colls.length)
            for (const coll of sibling_colls)
                if (coll.id == new_id && coll != proj_coll.obj)
                    evt.detail.errors.push({
                        field: tab_coll_details_form.get('id'),
                        error: `Another '${new_id}' Collection already exists in ` + (parent_coll ? (`'${parent_coll.id}'`) : 'this project') + `.`,
                    })
    },
})

const tab_coll_details_grid = newGrid('tab_coll_details_grid', 'recid', 'Foo', (dirty) => proj_coll.onDirty(dirty), [
    { field: 'title', text: 'Custom Content Field', sortable: false, resizable: true, },
    { field: 'name', hidden: true, },
    { field: 'lang', hidden: true, },
    { field: 'language', text: 'Language', sortable: false, resizable: true, },
    { field: 'value', text: 'Value', sortable: false, resizable: true, editable: { type: 'text' }, },
], true)

const tab_coll_details = {
    id: 'tab_coll_details',
    icon: 'fa-briefcase',
    text: 'Collection Info',
    ctl: newLayout('tab_coll_details_layout', [
        { type: 'left', size: '50%', resizable: true, html: tab_coll_details_form, },
        { type: 'main', size: '50%', resizable: true, html: tab_coll_details_grid, }
    ]),
    dataToUI: () => {
        tab_coll_details_form.onDataToUI((_) => ({
            'id': proj_coll.obj.id,
            'author': proj_coll.obj.author,
        }))
        tab_coll_details_grid.onDataToUI((_) => {
            console.log("D2U", proj_coll.obj.id, proj_coll.obj.contentFields)
            const ret = []
            const langs = dictMerge({ '': '' }, appState.config.contentAuthoring.languages)
            for (const content_field of appState.config.contentAuthoring.contentFields)
                for (const lang in langs) {
                    let value = ''
                    if (proj_coll.obj.contentFields && proj_coll.obj.contentFields[content_field] && proj_coll.obj.contentFields[content_field][lang])
                        value = proj_coll.obj.contentFields[content_field][lang]
                    ret.push({ 'recid': content_field + '_' + lang, 'name': content_field, 'title': (lang == '' ? content_field : ''), 'language': langs[lang], 'lang': lang, 'value': value })
                }

            return ret
        })
    },
    dataFromUI: () => {
        tab_coll_details_form.onDataFromUI((recClean) => {
            proj_coll.obj.id = recClean.id
            proj_coll.obj.author = recClean.author
        })
        tab_coll_details_grid.onDataFromUI((recs) => {
            proj_coll.obj.contentFields = {}
            for (const rec of recs)
                if (rec.value && rec.value.length) {
                    if (!proj_coll.obj.contentFields[rec.name])
                        proj_coll.obj.contentFields[rec.name] = {}
                    if (!proj_coll.obj.contentFields[rec.name][rec.lang])
                        proj_coll.obj.contentFields[rec.name][rec.lang] = {}
                    proj_coll.obj.contentFields[rec.name][rec.lang] = rec.value
                }
        })
    },
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

export const proj_coll = {
    name: 'proj_coll',
    tabbed: [
        tab_coll_details,
    ],
    parentCollection: () => {
        const path = collectionParents(proj_coll.obj)
        return (path && path.length && path.length > 0) ? path[0] : null
    },
    setObj: (obj) => {
        proj_coll.obj = obj
        proj_coll.dataToUI()
    },
    dataFromUI: () => { if (proj_coll.obj) proj_coll.tabbed.forEach(_ => _.dataFromUI()) },
    dataToUI: () => { if (proj_coll.obj) proj_coll.tabbed.forEach(_ => _.dataToUI()) },
}
