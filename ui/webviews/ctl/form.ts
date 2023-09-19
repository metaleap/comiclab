import van, { ChildDom } from '../vanjs/van-1.2.0.js'
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
    return {
        ctl: html.div('hello form'),
        onDataChangedAtSource: (sourceObj) => {
        }
    }
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
