import van, { ChildDom } from '../vanjs/van-1.2.0.js'
import * as utils from '../utils.js'

const html = van.tags

export type Field = {
    id: string,
    title: string,
    number?: { min: number, max: number, step?: number },
    readOnly?: boolean,
    validators?: ValidateFunc[]
    lookUp?: () => string[]
}
export type Rec = { id: string, [field_id: string]: string }
export type DatasetFunc = (recs: Rec[]) => void
export type ValidateFunc = (curRec: Rec, field: Field, newFieldValue: string) => Error | undefined

export function create(id: string, fields: Field[], onDataUserModified: DatasetFunc): { ctl: ChildDom, onDataChangedAtSource: DatasetFunc } {
    const ths: ChildDom[] = []
    const add_rec_tds: ChildDom[] = []
    let latestDataset: Rec[] = []

    const recDel = (recID: string) => {
        latestDataset = latestDataset.filter(_ => (_.id != recID))
        onDataUserModified(latestDataset)
    }
    const id_field = fields.find(_ => _.id == 'id') as Field
    if (!id_field.validators)
        id_field.validators = []
    id_field.validators.push(validatorNonEmpty(), validatorUnique(() => latestDataset))

    const recAdd = (_: MouseEvent) => {
        const added_rec: Rec = { id: (document.getElementById(id + '__' + 'id') as HTMLInputElement).value.trim() }
        const input_els: HTMLInputElement[] = []
        for (const field of fields) {
            const input_el: HTMLInputElement = (document.getElementById(id + '__' + field.id) as HTMLInputElement)
            input_els.push(input_el)
            const new_value = input_el.value.trim()
            added_rec[field.id] = new_value
        }
        if (!validate(added_rec, undefined, ...fields))
            return
        input_els.forEach(_ => _.value = '')
        latestDataset.push(added_rec)
        onDataUserModified(latestDataset)
    }

    const recInput = (recID: string, fieldID: string) => {
        const input_el: HTMLInputElement = document.getElementById(id + '_' + recID + '_' + fieldID) as HTMLInputElement
        const new_value = input_el.value.trim()
        const rec = latestDataset.find(_ => (_.id == recID)) as Rec
        const field: Field = fields.find(_ => (_.id == fieldID)) as Field
        if (!validate(rec, new_value, field)) {
            input_el.value = rec[fieldID]
            return
        }
        rec[fieldID] = new_value
        onDataUserModified(latestDataset)
    }

    for (const field of fields) {
        ths.push(html.th({ 'class': 'input-grid-header', 'id': id + '_' + field.id, 'data-field-id': field.id }, field.title))
        add_rec_tds.push(html.td({ 'class': 'input-grid-cell' },
            html.input({ 'type': 'text', 'class': 'input-grid-cell input-grid-cell-addrec', 'id': id + '__' + field.id, 'placeholder': '(Add Another Here)', 'data-field-id': field.id })))
    }
    ths.push(html.th({ 'class': 'input-grid-header', 'id': id + '_' }, ' '))
    add_rec_tds.push(html.td({ 'class': 'input-grid-cell' }, html.a(
        { 'onclick': recAdd, 'class': 'btn btn-circle-plus input-grid-cell', 'id': id + '__', alt: "Add", title: "Add", href: '' })))

    const table = html.table({ 'class': 'input-grid', 'id': id },
        html.tr({ 'class': 'input-grid-header' }, ...ths),
        html.tr({ 'class': 'input-grid-record-add' }, ...add_rec_tds))
    return {
        ctl: table,
        onDataChangedAtSource: (sourceDataset: Rec[]) => {
            latestDataset = sourceDataset
            const rec_trs = table.querySelectorAll('tr.input-grid-record')
            rec_trs.forEach(tr => {
                const rec_id_attr = tr.getAttributeNode('data_id')
                if (!sourceDataset.find(_ => _.id == rec_id_attr?.value))
                    tr.remove() // old record in grid is no longer in latest source dataset
            })
            const new_rec_trs: ChildDom[] = []
            sourceDataset.forEach(rec => {
                let rec_tr = table.querySelector(`tr.input-grid-record[data-rec-id='${rec.id}']`)
                if (!rec_tr) {// new record, is not yet in grid
                    rec_tr = html.tr({ 'class': 'input-grid-record', 'data-rec-id': rec.id })
                    const cell_tds: ChildDom[] = []
                    for (const field of fields)
                        cell_tds.push(html.td({ 'class': 'input-grid-cell' }, html.input(
                            { 'onchange': () => { recInput(rec.id, field.id) }, 'type': 'text', 'class': 'input-grid-cell', 'id': id + '_' + rec.id + '_' + field.id, 'data-rec-id': rec.id, 'data-field-id': field.id, 'disabled': (field.id == 'id') })))
                    cell_tds.push(html.td({ 'class': 'input-grid-cell' }, html.a(
                        { 'onclick': (_) => recDel(rec.id), 'class': 'btn btn-circle-minus input-grid-cell', 'id': id + '_' + rec.id + '_', 'data-rec-id': rec.id, alt: "Delete", title: "Delete", href: '' })))
                    van.add(rec_tr, ...cell_tds)
                    new_rec_trs.push(rec_tr)
                }
                for (const field of fields) {
                    const cell_input = rec_tr.querySelector('input#' + id + '_' + rec.id + '_' + field.id) as HTMLInputElement
                    const rec_field_value: string = rec[field.id]
                    if (cell_input.value != rec_field_value)
                        cell_input.value = rec_field_value
                }
            })
            van.add(table, ...new_rec_trs)
            table.style.visibility = 'visible'
        }
    }
}

function validate(rec: Rec, newValue: string | undefined, ...fields: Field[]) {
    for (const field of fields)
        if (field?.validators)
            for (const validator of field.validators) {
                const err = validator(rec, field, (newValue === undefined) ? rec[field.id] : newValue)
                if (err) {
                    utils.alert((err.name ? (err.name + ': ') : '') + err.message)
                    return false
                }
            }
    return true
}

export function validatorNonEmpty(): ValidateFunc {
    return (_: Rec, field: Field, newFieldValue: string) => {
        if (newFieldValue.length == 0)
            return { name: '', message: `'${field.title} is required and must not be left blank.` }
        return undefined
    }
}

export function validatorUnique(fullDataset: () => Rec[]): ValidateFunc {
    return (curRec: Rec, field: Field, newFieldValue: string) => {
        const full_dataset = fullDataset()
        const already_existing = full_dataset.find(_ => (_[field.id] == newFieldValue) && (_ != curRec) && (_.id != curRec.id || field.id == 'id'))
        console.log("FDS:", full_dataset)
        console.log("AE:", already_existing)
        if (already_existing)
            return { name: '', message: `Another entry with '${field.title}' of '${newFieldValue}' already exists.` }
        return undefined
    }
}
