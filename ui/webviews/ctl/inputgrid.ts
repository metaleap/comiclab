import van, { ChildDom, Props } from '../vanjs/van-1.2.0.js'
import * as utils from '../utils.js'

const html = van.tags

export type Num = { min?: number, max?: number, step?: number }
export type Field = {
    id: string,
    title: string,
    num?: Num,
    readOnly?: boolean,
    validators: ValidateFunc[]
    lookUp?: () => string[]
}
export type Rec = { id: string, [field_id: string]: string }
export type DatasetFunc = (recs: Rec[]) => void
export type ValidateFunc = (curRec: Rec, field: Field, newFieldValue: string) => Error | undefined

export function create(id: string, fields: Field[], onDataUserModified: DatasetFunc): { ctl: ChildDom, onDataChangedAtSource: DatasetFunc } {
    let latestDataset: Rec[] = []

    const recDel = (recID: string) => {
        latestDataset = latestDataset.filter(_ => (_.id != recID))
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

    const th_width = 100 / fields.length
    const ths_and_lists: ChildDom[] = []
    const add_rec_tds: ChildDom[] = []
    for (const field of fields) {
        if (field.lookUp)
            ths_and_lists.push(html.datalist({ 'id': '_list_' + id + '_' + field.id }, ...field.lookUp().map(_ => html.option({ 'value': _ }))))
        ths_and_lists.push(html.th({ 'class': 'inputgrid-header', 'id': id + '_' + field.id, 'data-field-id': field.id, 'width': th_width + '%' }, field.title))
        add_rec_tds.push(html.td({ 'class': 'inputgrid-cell' }, htmlInput(true, id, '', field)))
    }
    ths_and_lists.push(html.th({ 'class': 'inputgrid-header', 'id': id + '_' }, ' '))
    add_rec_tds.push(html.td({ 'class': 'inputgrid-cell' }, html.a(
        { 'onclick': recAdd, 'class': 'btn btn-circle-plus inputgrid-cell', 'id': id + '__', alt: "Add", title: "Add", href: '' })))

    const table = html.table({ 'class': 'inputgrid', 'id': id },
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
                let rec_tr = document.getElementById(id + '_tr_' + rec.id)
                if (!rec_tr) {// new record, is not yet in grid
                    rec_tr = html.tr({ 'class': 'inputgrid-record', 'id': id + '_tr_' + rec.id, 'data-rec-id': rec.id })
                    const cell_tds: ChildDom[] = []
                    for (const field of fields)
                        cell_tds.push(html.td({ 'class': 'inputgrid-cell' }, htmlInput(false, id, rec.id, field, () => { recInput(rec.id, field.id) })))
                    cell_tds.push(html.td({ 'class': 'inputgrid-cell' }, html.a(
                        { 'onclick': () => recDel(rec.id), 'class': 'btn btn-circle-minus inputgrid-cell', 'id': id + '_' + rec.id + '_', 'data-rec-id': rec.id, alt: "Delete", title: "Delete", href: '' })))
                    van.add(rec_tr, ...cell_tds)
                    new_rec_trs.push(rec_tr)
                }

                const rec_inputs: { [id: string]: HTMLInputElement } = {}
                rec_tr.querySelectorAll('td > input').forEach(_ => rec_inputs[_.id] = _ as HTMLInputElement)
                for (const field of fields) {
                    const cell_input = rec_inputs[id + '_' + rec.id + '_' + field.id]
                    const rec_field_value: string = rec[field.id]
                    if (cell_input.value != rec_field_value)
                        cell_input.value = rec_field_value
                }
            })
            if (new_rec_trs.length > 0)
                van.add(table, ...new_rec_trs)
            table.style.visibility = 'visible'
        }
    }
}

function htmlInput(isAddRec: boolean, gridID: string, recID: string, field: Field, onChange?: (evt: Event) => any) {
    const init: Props = {
        'class': 'inputgrid-cell' + (isAddRec ? ' inputgrid-cell-addrec' : ''),
        'id': gridID + '_' + recID + '_' + field.id,
        'data-rec-id': recID,
        'data-field-id': field.id,
        'readOnly': field.readOnly ? (!isAddRec) : false,
        'type': (field.num ? 'number' : 'text'),
        'placeholder': (!isAddRec) ? `(${field.title})` : "(New entry)",
    }
    if (onChange)
        init.onchange = onChange
    if (field.lookUp)
        init.list = '_list_' + gridID + '_' + field.id
    if (field.num) {
        const num: any = field.num as any
        for (const prop of ['min', 'max', 'step'])
            if (num[prop] !== undefined)
                init[prop] = num[prop].toString()
    }
    return html.input(init)
}

function validate(rec: Rec, newValue: string | undefined, ...fields: Field[]) {
    for (const field of fields)
        if (field.validators)
            for (const validator of field.validators) {
                const err = validator(rec, field, (newValue === undefined) ? rec[field.id] : newValue)
                if (err) {
                    utils.alert((err.name ? (err.name + ': ') : '') + err.message)
                    return false
                }
            }
    return true
}

export let validatorNonEmpty: ValidateFunc = (_: Rec, field: Field, newFieldValue: string) => {
    if (newFieldValue.length == 0)
        return { name: 'Required', message: `'${field.title} must not be blank.` }
    return undefined
}

export function validatorUnique(fullDataset: () => Rec[]): ValidateFunc {
    return (curRec: Rec, field: Field, newFieldValue: string) => {
        if (fullDataset().some(_ => (_[field.id] == newFieldValue) && (_ != curRec) && (_.id != curRec.id || field.id == 'id')))
            return { name: 'Uniqueness', message: `another entry with '${field.title}' of '${newFieldValue}' already exists.` }
        return undefined
    }
}

export let validatorLookup: ValidateFunc = (curRec: Rec, field: Field, newFieldValue: string) => {
    if (field.lookUp) {
        const valid_values = field.lookUp()
        if (!valid_values.includes(newFieldValue))
            return { name: 'Invalid', message: `'${field.title} must be one of: '${valid_values.join("' or '")}'` }
    }
    return undefined
}

export function validatorNumeric(min?: number, max?: number, step?: number): ValidateFunc {
    return (curRec: Rec, field: Field, newFieldValue: string) => {
        if (newFieldValue.length == 0)
            return undefined
        let n: number
        try {
            n = parseInt(newFieldValue)
        } catch (err: any) {
            return { name: 'Numeric', message: err.toString() }
        }
        if ((min !== undefined) && n < min)
            return { name: 'Minimum', message: `${n} is less than the minimum of ${min}.` }
        if ((max !== undefined) && n > max)
            return { name: 'Maximum', message: `${n} exceeds the maximum of ${max}.` }
        if ((step !== undefined) && (n % step) != 0)
            return { name: 'Step', message: `${n} is not a multiple of ${step}.` }
        return undefined
    }
}


export function lookupBool() {
    return ['false', 'true']
}
