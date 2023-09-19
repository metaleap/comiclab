import van, { ChildDom, Props, State } from '../vanjs/van-1.2.0.js'
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
    placeHolder?: State<string>
}
export type ValidateFunc = (curRec: Rec, field: Field, newFieldValue: string) => Error | undefined
export type RecFunc = (rec: Rec) => void
export type RecsFunc = (recs: Rec[]) => void


export function create(ctlId: string, fields: Field[], onDataUserModified: RecFunc): { ctl: ChildDom, onDataChangedAtSource: RecFunc } {
    const trs: HTMLTableRowElement[] = []
    let latest: Rec
    for (const field of fields)
        trs.push(html.tr({},
            html.td({ 'class': 'inputform-field-label' }, ([field.title] as any[]).concat(
                field.lookUp ? [htmlDataList(ctlId, field)] : [])),
            html.td({ 'class': 'inputform-field-input' }, htmlInput(false, ctlId, '', field, (evt) => {
                const input_field = document.getElementById(htmlId(ctlId, '', field)) as HTMLInputElement
                if (!validate(latest, input_field.value, field)) {
                    input_field.value = latest[field.id]
                    return
                }
                latest[field.id] = input_field.value
                onDataUserModified(latest)
            })),
        ))
    const table = html.table({ 'class': 'inputform', 'id': ctlId }, ...trs)
    return {
        ctl: table,
        onDataChangedAtSource: (sourceObj) => {
            latest = sourceObj
            for (const field of fields) {
                const field_value = sourceObj[field.id]
                const input_field = document.getElementById(htmlId(ctlId, '', field)) as HTMLInputElement
                input_field.value = field_value
                if (field.lookUp) {
                    const new_datalist = htmlDataList(ctlId, field) as HTMLDataListElement
                    const old_datalist = document.getElementById(new_datalist.id) as HTMLDataListElement
                    old_datalist.innerHTML = new_datalist.innerHTML
                }
            }
        }
    }
}

export function htmlId(ctlId: string, recId: string, field: Field, prefix?: string) {
    return (prefix ? (prefix + '_') : '') + ctlId + '_' + recId + '_' + field.id
}

export function htmlDataList(ctlId: string, field: Field) {
    const dict = (field.lookUp as () => { [_: string]: string })()
    return html.datalist({ 'id': htmlId(ctlId, '', field, '_list') }, ...utils.dictToArr(dict, (k, v) => html.option({ 'value': k }, v)))
}

export function htmlInput(isAddRec: boolean, ctlId: string, recId: string, field: Field, onChange?: (evt: Event) => any) {
    const init: Props = {
        'class': 'inputfield' + (isAddRec ? ' inputfield-addrec' : ''),
        'id': htmlId(ctlId, recId, field),
        'data-rec-id': recId,
        'data-field-id': field.id,
        'readOnly': field.readOnly ? (!isAddRec) : false,
        'type': (field.num ? 'number' : 'text'),
        'placeholder': field.placeHolder ? field.placeHolder : htmlInputDefaultPlaceholder(field, isAddRec),
    }
    if (onChange)
        init.onchange = onChange
    if (field.lookUp)
        init.list = htmlId(ctlId, recId, field, '_list')
    if (field.num) {
        const num: any = field.num as any
        for (const prop of ['min', 'max', 'step'])
            if (num[prop] !== undefined)
                init[prop] = num[prop].toString()
    }
    return html.input(init)
}

export function htmlInputDefaultPlaceholder(field: Field, isAddRec?: boolean) {
    return (!isAddRec) ? `(${field.title})` : "(New entry)"
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
