import { newForm } from './util.js'

const tab_episode_details = {
    id: 'tab_episode_details',
    icon: 'fa-cube',
    text: 'Episode Info',
    ctl: newForm('tab_episode_details_form', (dirty) => proj_episode.onDirty(dirty), [
        { field: 'id', type: 'text', required: true, html: { label: 'Episode ID' } }
    ], {
        onValidate(evt) {
            const episode_id = (tab_episode_details.ctl.getValue('id') + '').trim()
            if (!(episode_id && episode_id.length && episode_id.length > 0))
                evt.detail.errors.push({
                    field: tab_episode_details.ctl.get('id'),
                    error: 'Episode ID is required.',
                })
            const parent_series = proj_episode.parentSeries()
            if (parent_series)
                for (const episode of parent_series.episodes)
                    if (episode.id == episode_id && episode != proj_episode.record)
                        evt.detail.errors.push({
                            field: tab_episode_details.ctl.get('id'),
                            error: 'Another Episode already has this ID.',
                        })
        },
    }),
    dataToUI: () => tab_episode_details.ctl.onDataToUI(() => {
        const episode = tab_episode_details.ctl.record
        tab_episode_details.ctl.setValue('id', episode ? episode.id : '')
    }),
    dataFromUI: () => tab_episode_details.ctl.onDataFromUI(() => {
        const episode = tab_episode_details.ctl.record
        if (episode) {
            const oldID = episode.id
            const newID = tab_episode_details.ctl.getValue('id')
            if (oldID != newID) {
                episode.id = newID
                const parent_series = proj_episode.parentSeries()
                if (parent_series)
                    for (const i in parent_series.episodes)
                        if (parent_series.episodes[i] == episode || parent_series.episodes[i].id == oldID)
                            parent_series.episodes[i] = episode
            }
            tab_episode_details.ctl.record = episode
        }
    }),
}

export const proj_episode = {
    name: 'proj_episode',
    tabbed: [
        tab_episode_details,
    ],
    parentSeries: () => appState.proj.series.find(_ => _.episodes.includes(proj_episode.record)),
    setRecord: (rec) => {
        proj_episode.record = rec
        proj_episode.tabbed.forEach(_ => {
            _.ctl.record = rec
            _.dataToUI()
        })
    },
    dataFromUI: () => proj_episode.tabbed.forEach(_ => _.dataFromUI()),
    dataToUI: () => proj_episode.tabbed.forEach(_ => _.dataToUI()),
}
