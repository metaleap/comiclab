import van, { ChildDom, Props, State } from '../vanjs/van-1.2.1.debug.js'
import * as utils from '../utils.js'

const html = van.tags

export type InputForm = { dom: ChildDom, onDataChangedAtSource: RecFunc }
export type FieldLookup = { [_: string]: string }
export type FieldNumeric = { int: boolean, min?: number, max?: number, step?: number }
export type Field = {
    id: string,
    title: string,
    num?: FieldNumeric,
    readOnly?: boolean,
    validators: ValidateFunc[]
    lookUp?: State<FieldLookup>
    placeholder?: State<string>
}
export type Rec = { [_: string]: string }
export type RecFunc = (rec: Rec) => void
export type RecsFunc = (recs: Rec[]) => void
export type ValidateFunc = (curRec: Rec, field: Field, newFieldValue: string) => Error | undefined


export function create(domId: string, fields: Field[], dynFields: State<Field[]> | undefined, onDataUserModified: RecFunc): InputForm {
    for (const field of fields)
        if (field.num)
            field.validators.push(validatorNumeric())

    let latest_rec = van.state({} as Rec)

    let fieldRow = (field: Field, isDyn: boolean): ChildDom => {
        return html.div({ 'class': 'inputform-field' },
            html.div({ 'class': 'inputform-field-label' }, (isDyn ? html.em : html.strong)(field.title + ":")),
            html.div({ 'class': 'inputform-field-input' },
                htmlDataList(domId, field),
                htmlInput(false, domId, '', field, (_) => { // onChange
                    const input_field = document.getElementById(htmlId(domId, '', field)) as HTMLInputElement
                    const new_value = input_field.value.trim()
                    const rec = utils.dictClone(latest_rec.val)
                    if (!validate(rec, new_value, field))
                        input_field.value = rec[field.id] ?? ''
                    else {
                        rec[field.id] = new_value
                        onDataUserModified(rec)
                    }
                }, () => { // value attr of
                    return latest_rec.val[field.id] ?? ''
                })))
    }
    const table = html.div({ 'class': 'inputform', 'id': domId },
        html.span(...fields.map((_) => fieldRow(_, false))),
        (dynFields ? (() => html.span(...dynFields.val.map((_) => fieldRow(_, true)))) : null))
    return {
        dom: table,
        onDataChangedAtSource: (sourceObj) => {
            const rec = utils.dictClone(latest_rec.val)
            let mut = false
            for (const field_id in sourceObj)
                if (rec[field_id] !== sourceObj[field_id])
                    [mut, rec[field_id]] = [true, sourceObj[field_id]]
            for (const field_id in rec)
                if (sourceObj[field_id] === undefined) { // newly deleted dynField
                    mut = true
                    delete rec[field_id]
                }
            if (mut)
                latest_rec.val = rec
        }
    }
}

export function htmlId(domId: string, recId: string, field?: Field, prefix?: string) {
    return (prefix ? (prefix + '_') : '') + domId + '_' + recId + '_' + (field ? field.id : 'id')
}

export function htmlDataList(domId: string, field: Field): ChildDom {
    if (field.lookUp)
        return () => html.datalist({ 'id': htmlId(domId, '', field, '_list') }, ...utils.dictToArr(field.lookUp?.val, (k, v) => html.option({ 'value': k }, v)))
    return null
}

export function htmlInput(isAddRec: boolean, domId: string, recId: string, field: Field, onChange: (evt: Event) => any, value?: () => string, placeholder?: string): HTMLInputElement {
    const is_bool = (field.lookUp == lookupBool)
    const init: Props = {
        'class': 'inputfield' + (isAddRec ? ' inputfield-addrec' : ''),
        'id': htmlId(domId, recId, field),
        'data-rec-id': recId,
        'data-field-id': field.id,
        'readOnly': field.readOnly ? (!isAddRec) : false,
        'type': is_bool ? 'checkbox' : (field.num ? 'number' : 'text'),
        'placeholder': field.placeholder ? field.placeholder : (placeholder ?? ''),
    }
    if (value)
        init.value = value
    if (onChange)
        init.onchange = onChange
    if (field.lookUp)
        init.list = htmlId(domId, '', field, '_list')
    if (field.num) {
        const num: any = field.num as any
        for (const prop of ['min', 'max', 'step'])
            if (num[prop] !== undefined)
                init[prop] = num[prop].toString()
    }
    return html.input(init)
}

export function validate(rec: Rec, newValue: string | undefined, ...fields: Field[]) {
    for (const field of fields) if (field.validators)
        for (const validator of field.validators) {
            const err = validator(rec, field, (newValue === undefined) ? rec[field.id] : newValue)
            if (err) {
                utils.alert((err.name ? (err.name + ' — ') : '') + err.message)
                return false
            }
        }
    return true
}

export let validatorNonEmpty: ValidateFunc = (_: Rec, field: Field, newFieldValue: string) => {
    if (newFieldValue.length == 0)
        return { name: 'Required', message: `'${field.title}' must not be blank.` }
    return undefined
}

export let validatorLookup: ValidateFunc = (_: Rec, field: Field, newFieldValue: string) => {
    if (field.lookUp && newFieldValue.length > 0) {
        const valid_values = utils.dictToArr(field.lookUp.val, (k, v) => k)
        if (!valid_values.includes(newFieldValue))
            return { name: 'Invalid', message: `'${field.title}' must be one of:\n\n— '${valid_values.join("' or\n— '")}'` }
    }
    return undefined
}

export function validatorNumeric(numOptions?: FieldNumeric): ValidateFunc {
    return (_: Rec, field: Field, newFieldValue: string) => {
        const num = numOptions ?? field.num
        if ((num === undefined) || (newFieldValue.length === 0))
            return undefined
        let n: number
        try {
            n = (num.int ? parseInt : parseFloat)(newFieldValue)
            if (n === undefined || n === null || Number.isNaN(n) || (newFieldValue === 'e'))
                throw `'${field.title}' must be a numeric value.`
        } catch (err: any) {
            return { name: 'Numeric', message: err.toString() }
        }
        if ((num.min !== undefined) && n < num.min)
            return { name: 'Minimum', message: `${n} is less than the minimum of ${num.min}.` }
        if ((num.max !== undefined) && n > num.max)
            return { name: 'Maximum', message: `${n} exceeds the maximum of ${num.max}.` }
        if (num.int && (num.step !== undefined) && (n % num.step) != 0)
            return { name: 'Step', message: `${n} is not a multiple of ${num.step}.` }
        return undefined
    }
}

export let lookupBool: State<FieldLookup> = van.state({ 'false': 'No', 'true': 'Yes' } as FieldLookup)
