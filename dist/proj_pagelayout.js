import { w2form } from '/w2ui/w2ui.es6.js'

export const proj_pagelayout = new w2form({
    name: 'proj_pagelayout',
    record: null,
    parentEpisode: () => {
        for (const series of appState.proj.series) {
            const episode = series.episodes.find(_ => _.pages && _.pages.includes && _.pages.includes(proj_pagelayout.record))
            if (episode)
                return episode
        }
    },
    fields: [
        { field: 'id', type: 'text', required: true, html: { label: 'Page ID' } }
    ],
    onChange(evt) {
        const errs = proj_pagelayout.validate()
        if (!(errs && errs.length && errs.length > 0))
            proj_pagelayout.onDirty(true)
    },
    onValidate(evt) {
        const pagelayout_id = (proj_pagelayout.getValue('id') + '').trim()
        if (!(pagelayout_id && pagelayout_id.length && pagelayout_id.length > 0))
            evt.detail.errors.push({
                field: proj_pagelayout.get('id'),
                error: 'Page ID is required.',
            })
        const parent_episode = proj_pagelayout.parentEpisode()
        if (parent_episode && parent_episode.pages && parent_episode.pages.length)
            for (const pagelayout of parent_episode.pages)
                if (pagelayout.id == pagelayout_id && pagelayout != proj_pagelayout.record)
                    evt.detail.errors.push({
                        field: proj_pagelayout.get('id'),
                        error: 'Another Page already has this ID.',
                    })
    },
    tabTitle: () => proj_pagelayout.record.id,
    dataToUI: () => {
        const pagelayout = proj_pagelayout.record
        proj_pagelayout.setValue('id', pagelayout ? pagelayout.id : '')
        proj_pagelayout.refresh()
    },
    dataFromUI: () => {
        const pagelayout = proj_pagelayout.record
        if (pagelayout) {
            const oldID = pagelayout.id
            const newID = proj_pagelayout.getValue('id')
            if (oldID != newID) {
                pagelayout.id = newID
                const parent_episode = proj_pagelayout.parentEpisode()
                if (parent_episode)
                    for (const i in parent_episode.pages)
                        if (parent_episode.pages[i] == proj_pagelayout || parent_episode.pages[i].id == oldID)
                            parent_episode.pages[i] = proj_pagelayout
            }
            proj_pagelayout.record = pagelayout
        }
    },
})
