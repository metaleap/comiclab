import van, { ChildDom } from '../vanjs/van-1.2.0.js'

const html = van.tags

export type Field = {
    id: string,
    title: string,
    readOnly?: boolean,
    lookUp?: () => string[],
    validate?: (curRec: Rec, fieldID: string, newValue: string) => Error
}
export type Rec = { id: string, [field_id: string]: string }
export type DatasetFunc = (recs: Rec[]) => void

export function newInputGrid(id: string, fields: Field[], onDataUserModified: DatasetFunc): { ctl: ChildDom, onDataChangedAtSource: DatasetFunc } {
    const thr = html.tr({ 'class': 'input-grid-header' })
    const table = html.table({ 'class': 'input-grid', 'id': id }, thr)
    for (const field of fields)
        van.add(thr, html.th({ 'class': 'input-grid-header', 'id': id + '_' + field.id, 'data-field-id': field.id }, field.title))

    const trs = new Map<Element, any>()
    return {
        ctl: table,
        onDataChangedAtSource: (sourceDataset: Rec[]) => {
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
                    for (const field of fields) {
                        const cell_td = html.td({ 'class': 'input-grid-cell' },
                            html.input({ 'type': 'text', 'class': 'input-grid-cell', 'id': id + '_' + rec.id + '_' + field.id, 'data-rec-id': rec.id, 'data-field-id': field.id }))
                        cell_tds.push(cell_td)
                    }
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
        }
    }
}
