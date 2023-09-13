import { w2form } from './w2ui/w2ui.es6.js'

export const proj_episode = new w2form({
    name: 'proj_episode',
    parentSeries: () => appState.proj.series.find(_ => _.episodes.includes(proj_episode.record)),
    fields: [
        { field: 'id', type: 'text', required: true, html: { label: 'Episode ID' } }
    ],
    onChange(evt) {
        const errs = proj_episode.validate()
        if (!(errs && errs.length && errs.length > 0))
            proj_episode.onDirty(true)
    },
    onValidate(evt) {
        const episode_id = (proj_episode.getValue('id') + '').trim()
        if (!(episode_id && episode_id.length && episode_id.length > 0))
            evt.detail.errors.push({
                field: proj_episode.get('id'),
                error: 'Episode ID is required.',
            })
        const parent_series = proj_episode.parentSeries()
        if (parent_series)
            for (const episode of parent_series.episodes)
                if (episode.id == episode_id && episode != proj_episode.record)
                    evt.detail.errors.push({
                        field: proj_episode.get('id'),
                        error: 'Another Episode already has this ID.',
                    })
    },
    tabTitle: () => proj_episode.record.id,
    dataToUI: () => {
        const episode = proj_episode.record
        proj_episode.setValue('id', episode ? episode.id : '')
        proj_episode.refresh()
    },
    dataFromUI: () => {
        const episode = proj_episode.record
        if (episode) {
            const oldID = episode.id
            const newID = proj_episode.getValue('id')
            if (oldID != newID) {
                episode.id = newID
                const parent_series = proj_episode.parentSeries()
                if (parent_series)
                    for (const i in parent_series.episodes)
                        if (parent_series.episodes[i] == episode || parent_series.episodes[i].id == oldID)
                            parent_series.episodes[i] = episode
            }
            proj_episode.record = episode
        }
    },
})
