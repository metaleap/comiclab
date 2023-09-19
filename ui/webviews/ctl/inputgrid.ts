import van, { ChildDom } from '../vanjs/van-1.2.0.js'
import { htmlInput, htmlDataList, htmlId, Rec, Field, RecsFunc, ValidateFunc, validate, validatorNonEmpty, validatorNumeric } from './inputform.js'


const html = van.tags


export function create(ctlId: string, fields: Field[], onDataUserModified: RecsFunc): { ctl: ChildDom, onDataChangedAtSource: RecsFunc } {
    let latestDataset: Rec[] = []

    const recDel = (recId: string) => {
        latestDataset = latestDataset.filter(_ => (_.id != recId))
        onDataUserModified(latestDataset)
    }
    for (const field of fields) {
        if (field.id == 'id') {
            field.readOnly = true
            field.validators.push(validatorNonEmpty, validatorUnique(() => latestDataset))
        }
        if (field.num)
            field.validators.push(validatorNumeric(field.num.min, field.num.max, field.num.step))
    }

    const recAdd = (_: MouseEvent) => {
        const added_rec: Rec = { id: (document.getElementById(htmlId(ctlId, '')) as HTMLInputElement).value.trim() }
        const input_els: HTMLInputElement[] = []
        for (const field of fields) {
            const input_el: HTMLInputElement = (document.getElementById(htmlId(ctlId, '', field)) as HTMLInputElement)
            input_els.push(input_el)
            const new_value = (input_el.type == 'checkbox') ? input_el.checked.toString() : input_el.value.trim()
            added_rec[field.id] = new_value
        }
        if (!validate(added_rec, undefined, ...fields))
            return
        input_els.forEach(_ => {
            _.value = ''
            _.checked = false
        })
        latestDataset.push(added_rec)
        onDataUserModified(latestDataset)
    }

    const recInput = (recId: string, field: Field) => {
        const input_el: HTMLInputElement = document.getElementById(htmlId(ctlId, recId, field)) as HTMLInputElement
        const new_value = (input_el.type == 'checkbox') ? input_el.checked.toString() : input_el.value.trim()
        const rec = latestDataset.find(_ => (_.id == recId)) as Rec
        if (!validate(rec, new_value, field)) {
            input_el.value = rec[field.id]
            return
        }
        rec[field.id] = new_value
        onDataUserModified(latestDataset)
    }

    const th_width = 100 / fields.length
    const ths_and_lists: ChildDom[] = []
    const add_rec_tds: ChildDom[] = []
    for (const field of fields) {
        if (field.lookUp)
            ths_and_lists.push(htmlDataList(ctlId, field))
        ths_and_lists.push(html.th({ 'class': 'inputgrid-header', 'id': htmlId(ctlId, '', field, '_th'), 'data-field-id': field.id, 'width': th_width + '%' }, field.title))
        add_rec_tds.push(html.td({ 'class': 'inputgrid-cell' }, htmlInput(true, ctlId, '', field)))
    }
    ths_and_lists.push(html.th({ 'class': 'inputgrid-header' }, ' '))
    add_rec_tds.push(html.td({ 'class': 'inputgrid-cell' }, html.a(
        { 'onclick': recAdd, 'class': 'btn btn-circle-plus inputgrid-cell', alt: "Add", title: "Add", href: '' })))

    const table = html.table({ 'class': 'inputgrid', 'id': ctlId },
        html.tr({ 'class': 'inputgrid-header' }, ...ths_and_lists),
        html.tr({ 'class': 'inputgrid-record-add' }, ...add_rec_tds))
    return {
        ctl: table,
        onDataChangedAtSource: (sourceDataset: Rec[]) => {
            latestDataset = sourceDataset
            const rec_trs = table.querySelectorAll('tr.inputgrid-record')
            rec_trs.forEach(tr => {
                const rec_id_attr = tr.getAttributeNode('data-rec-id')
                if (rec_id_attr && !sourceDataset.find(_ => (_.id == rec_id_attr.value)))
                    tr.remove() // old record in grid is no longer in latest source dataset
            })
            const new_rec_trs: ChildDom[] = []
            sourceDataset.forEach(rec => {
                const rec_tr_id = htmlId(ctlId, rec.id, undefined, '_tr')
                let rec_tr = document.getElementById(rec_tr_id)
                if (!rec_tr) {// new record, is not yet in grid
                    rec_tr = html.tr({ 'class': 'inputgrid-record', 'id': rec_tr_id, 'data-rec-id': rec.id })
                    const cell_tds: ChildDom[] = []
                    for (const field of fields)
                        cell_tds.push(html.td({ 'class': 'inputgrid-cell' }, htmlInput(false, ctlId, rec.id, field, () => { recInput(rec.id, field) })))
                    cell_tds.push(html.td({ 'class': 'inputgrid-cell' }, html.a(
                        { 'onclick': () => recDel(rec.id), 'class': 'btn btn-circle-minus inputgrid-cell', 'data-rec-id': rec.id, alt: "Delete", title: "Delete", href: '' })))
                    van.add(rec_tr, ...cell_tds)
                    new_rec_trs.push(rec_tr)
                }

                const rec_inputs: { [id: string]: HTMLInputElement } = {}
                rec_tr.querySelectorAll('td > input').forEach(_ => rec_inputs[_.id] = _ as HTMLInputElement)
                for (const field of fields) {
                    const cell_input = rec_inputs[htmlId(ctlId, rec.id, field)]
                    const rec_field_value: string = rec[field.id]
                    if (cell_input.value != rec_field_value)
                        cell_input.value = rec_field_value
                    if (cell_input.type == 'checkbox')
                        cell_input.checked = (rec_field_value == 'true')
                }
            })
            if (new_rec_trs.length > 0)
                van.add(table, ...new_rec_trs)
            table.style.visibility = 'visible'
        }
    }
}

export function validatorUnique(fullDataset: () => Rec[]): ValidateFunc {
    return (curRec: Rec, field: Field, newFieldValue: string) => {
        if (fullDataset().some(_ => (_[field.id] == newFieldValue) && (_ != curRec) && (_.id != curRec.id || field.id == 'id')))
            return { name: 'Uniqueness', message: `another entry with '${field.title}' of '${newFieldValue}' already exists.` }
        return undefined
    }
}
