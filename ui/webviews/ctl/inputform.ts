import van, { ChildDom, Props } from '../vanjs/van-1.2.0.js'
import * as utils from '../utils.js'

const html = van.tags

export type Num = { min?: number, max?: number, step?: number }
export type Rec = { id: string, [field_id: string]: string }
export type Field = {
    id: string,
    title: string,
    num?: Num,
    readOnly?: boolean,
    validators: ValidateFunc[]
    lookUp?: () => { [_: string]: string }
}
export type ValidateFunc = (curRec: Rec, field: Field, newFieldValue: string) => Error | undefined
export type RecFunc = (rec: Rec) => void
export type RecsFunc = (recs: Rec[]) => void


export function create(id: string, fields: Field[], onDataUserModified: RecFunc): { ctl: ChildDom, onDataChangedAtSource: RecFunc } {
    const trs: HTMLTableRowElement[] = []
    for (const field of fields)
        trs.push(html.tr({},
            html.td({ 'class': 'inputform-field-label' }, ([field.title] as any[]).concat(field.lookUp ? [htmlDataList(id, field)] : [])),
            html.td({ 'class': 'inputform-field-input' }, htmlInput(false, id, '', field)),
        ))
    const table = html.table({ 'class': 'inputform', 'id': id }, ...trs)
    return {
        ctl: table,
        onDataChangedAtSource: (sourceObj) => {
            for (const field of fields) {
                const field_value = sourceObj[field.id]
                const input_field = document.getElementById(id + '__' + field.id) as HTMLInputElement
                input_field.value = field_value
                if (field.lookUp) {
                    const new_datalist = htmlDataList(id, field) as HTMLDataListElement
                    const old_datalist = document.getElementById(new_datalist.id) as HTMLDataListElement
                    old_datalist.innerHTML = new_datalist.innerHTML
                }
            }
        }
    }
}

export function htmlDataList(ctlID: string, field: Field) {
    const dict = (field.lookUp as () => { [_: string]: string })()
    return html.datalist({ 'id': '_list_' + ctlID + '_' + field.id }, ...utils.dictToArr(dict, (k, v) => html.option({ 'value': k }, v)))
}

export function htmlInput(isAddRec: boolean, ctlID: string, recID: string, field: Field, onChange?: (evt: Event) => any) {
    const init: Props = {
        'class': 'inputfield' + (isAddRec ? ' inputfield-addrec' : ''),
        'id': ctlID + '_' + recID + '_' + field.id,
        'data-rec-id': recID,
        'data-field-id': field.id,
        'readOnly': field.readOnly ? (!isAddRec) : false,
        'type': (field.num ? 'number' : 'text'),
        'placeholder': (!isAddRec) ? `(${field.title})` : "(New entry)",
    }
    if (onChange)
        init.onchange = onChange
    if (field.lookUp)
        init.list = '_list_' + ctlID + '_' + field.id
    if (field.num) {
        const num: any = field.num as any
        for (const prop of ['min', 'max', 'step'])
            if (num[prop] !== undefined)
                init[prop] = num[prop].toString()
    }
    return html.input(init)
}

export function validate(rec: Rec, newValue: string | undefined, ...fields: Field[]) {
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

export let validatorLookup: ValidateFunc = (curRec: Rec, field: Field, newFieldValue: string) => {
    if (field.lookUp && newFieldValue.length > 0) {
        const valid_values = utils.dictToArr(field.lookUp(), (k, v) => k)
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
    return { 'false': 'No', 'true': 'Yes' }
}
