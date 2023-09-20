import van, { ChildDom, Props, State } from '../vanjs/van-1.2.0.js'
import * as utils from '../utils.js'

const html = van.tags

export type Num = { min?: number, max?: number, step?: number }
export type Rec = { id: string, [field_id: string]: string }
export type Lookup = { [_: string]: string }
export type Field = {
    id: string,
    title: string,
    num?: Num,
    readOnly?: boolean,
    validators: ValidateFunc[]
    lookUp?: State<Lookup>
    placeHolder?: State<string>
}
export type ValidateFunc = (curRec: Rec, field: Field, newFieldValue: string) => Error | undefined
export type RecFunc = (rec: Rec) => void
export type RecsFunc = (recs: Rec[]) => void


export function create(ctlId: string, fields: Field[], onDataUserModified: RecFunc, dynFields?: State<Field[]>): { ctl: ChildDom, onDataChangedAtSource: RecFunc } {
    let latest_rec_states: { id: State<string>, [_: string]: State<string> } = { id: van.state('') }
    const latest_rec = () => utils.dictMap(latest_rec_states, (_) => _.val) as Rec
    let fieldRow = (field: Field): ChildDom => {
        return html.div({ 'class': 'inputform-field' },
            html.div({ 'class': 'inputform-field-label' }, field.title + ":"),
            html.div({ 'class': 'inputform-field-input' },
                htmlDataList(ctlId, field),
                htmlInput(false, ctlId, '', field, (evt) => {
                    const input_field = document.getElementById(htmlId(ctlId, '', field)) as HTMLInputElement
                    if (!validate(latest_rec(), input_field.value, field))
                        input_field.value = latest_rec()[field.id] ?? ''
                    else {
                        if (latest_rec_states[field.id] === undefined) // dynFields...
                            latest_rec_states[field.id] = van.state(input_field.value)
                        else
                            latest_rec_states[field.id].val = input_field.value
                        onDataUserModified(latest_rec())
                    }
                }, () => (latest_rec_states[field.id]?.val) ?? '')))
    }
    const table = html.div({ 'class': 'inputform', 'id': ctlId },
        html.span(...fields.map(fieldRow)),
        (!dynFields) ? null : () => html.span(...dynFields.val.map(fieldRow)))
    return {
        ctl: table,
        onDataChangedAtSource: (sourceObj) => {
            for (const field_id in sourceObj)
                if (latest_rec_states[field_id] === undefined) // newly added dynField?
                    latest_rec_states[field_id] = van.state(sourceObj[field_id])
                else
                    latest_rec_states[field_id].val = sourceObj[field_id]
            for (const field_id in latest_rec_states)
                if (sourceObj[field_id] === undefined) // newly deleted dynField
                    delete latest_rec_states[field_id]
        }
    }
}

export function htmlId(ctlId: string, recId: string, field?: Field, prefix?: string) {
    return (prefix ? (prefix + '_') : '') + ctlId + '_' + recId + '_' + (field ? field.id : 'id')
}

export function htmlDataList(ctlId: string, field: Field): ChildDom {
    if (field.lookUp)
        return () => html.datalist({ 'id': htmlId(ctlId, '', field, '_list') }, ...utils.dictToArr(field.lookUp?.val, (k, v) => html.option({ 'value': k }, v)))
    return null
}

export function htmlInput(isAddRec: boolean, ctlId: string, recId: string, field: Field, onChange: (evt: Event) => any, value?: () => string, placeholder?: string): HTMLInputElement {
    const is_bool = (field.lookUp == lookupBool)
    const init: Props = {
        'class': 'inputfield' + (isAddRec ? ' inputfield-addrec' : ''),
        'id': htmlId(ctlId, recId, field),
        'data-rec-id': recId,
        'data-field-id': field.id,
        'readOnly': field.readOnly ? (!isAddRec) : false,
        'type': is_bool ? 'checkbox' : (field.num ? 'number' : 'text'),
        'placeholder': field.placeHolder ? field.placeHolder : (placeholder ?? ''),
    }
    if (value)
        init.value = value
    if (onChange)
        init.onchange = onChange
    if (field.lookUp)
        init.list = htmlId(ctlId, '', field, '_list')
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

export let validatorLookup: ValidateFunc = (_: Rec, field: Field, newFieldValue: string) => {
    if (field.lookUp && newFieldValue.length > 0) {
        const valid_values = utils.dictToArr(field.lookUp.val, (k, v) => k)
        if (!valid_values.includes(newFieldValue))
            return { name: 'Invalid', message: `'${field.title} must be one of: '${valid_values.join("' or '")}'` }
    }
    return undefined
}

export function validatorNumeric(min?: number, max?: number, step?: number): ValidateFunc {
    return (_: Rec, field: Field, newFieldValue: string) => {
        if (newFieldValue.length == 0)
            return undefined
        let n: number
        try {
            n = parseInt(newFieldValue)
            if (n === undefined || n === null || Number.isNaN(n))
                throw `${field.title} must be a numeric value.`
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

export let lookupBool: State<Lookup> = van.state({ 'false': 'No', 'true': 'Yes' } as Lookup)
