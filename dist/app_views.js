import { proj_series } from './proj_series.js'
import { proj_episode } from './proj_episode.js'
import { proj_pagelayout } from './proj_pagelayout.js'
import { config_authors } from './config_authors.js'
import { config_pagelayouts } from './config_pagelayouts.js'

export const appViews = {
    proj_series: proj_series,
    proj_episode: proj_episode,
    proj_pagelayout: proj_pagelayout,
    config_authors: config_authors,
    config_pagelayouts: config_pagelayouts,
}

export let appViewActive = null

export function appViewSet(appView) {
    appViewActive = appView
    guiMain.layout.html('main', appView ? appView : '')
}
