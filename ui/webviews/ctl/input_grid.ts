import van, { ChildDom } from '../vanjs/van-1.2.0.js'
import * as utils from '../utils.js'

const html = van.tags

export type Field = {
    id: string,
    title: string,
    readOnly?: boolean,
    lookUp?: () => string[]
}
export type Rec = { id: string, [field_id: string]: string }
export type DatasetFunc = (recs: Rec[]) => void

export function newInputGrid(id: string, fields: Field[], onDataUserModified: DatasetFunc): { ctl: ChildDom, onDataChangedAtSource: DatasetFunc } {
    const ths: ChildDom[] = []
    const add_rec_tds: ChildDom[] = []
    let latestDataset: Rec[] = []

    const addRec = (_: MouseEvent) => {
        const added_rec: Rec = { id: (document.getElementById(id + '__' + 'id') as HTMLInputElement).value.trim() }
        if (added_rec.id.length == 0)
            utils.alert('ID is required.')
        else if (latestDataset.some(rec => (rec.id == added_rec.id)))
            utils.alert('Another record with this ID already exists.')
        else {
            for (const field of fields) {
                const field_input: HTMLInputElement = document.getElementById(id + '__' + field.id) as HTMLInputElement
                added_rec[field.id] = field_input.value.trim()
                field_input.value = ''
            }
            latestDataset.push(added_rec)
            onDataUserModified(latestDataset)
        }
    }
    const delRec = (recID: string) => {
        latestDataset = latestDataset.filter(_ => (_.id != recID))
        onDataUserModified(latestDataset)
    }

    const changeRec = (recID: string, fieldID: string) => {
        const new_value = (document.getElementById(id + '_' + recID + '_' + fieldID) as HTMLInputElement).value.trim()
        const rec = latestDataset.find(_ => (_.id == recID)) as Rec
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
        { 'onclick': addRec, 'class': 'btn btn-circle-plus input-grid-cell', 'id': id + '__', alt: "Add", title: "Add", href: '' })))

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
                            { 'onchange': () => { changeRec(rec.id, field.id) }, 'type': 'text', 'class': 'input-grid-cell', 'id': id + '_' + rec.id + '_' + field.id, 'data-rec-id': rec.id, 'data-field-id': field.id, 'disabled': (field.id == 'id') })))
                    cell_tds.push(html.td({ 'class': 'input-grid-cell' }, html.a(
                        { 'onclick': (_) => delRec(rec.id), 'class': 'btn btn-circle-minus input-grid-cell', 'id': id + '_' + rec.id + '_', 'data-rec-id': rec.id, alt: "Delete", title: "Delete", href: '' })))
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
