import { proj_series } from './proj_series.js'
import { proj_episode } from './proj_episode.js'
import { proj_pagelayout } from './proj_pagelayout.js'
import { config_contentauthoring } from './config_contentauthoring.js'

export const appViews = {
    proj_series: proj_series,
    proj_episode: proj_episode,
    proj_pagelayout: proj_pagelayout,
    config_contentauthoring: config_contentauthoring,
}

export let appViewActive = null

export function appViewSetActive(appView, record) {
    let didSetRecord = false
    if (record && appView && record != appView.record) {
        appView.record = record
        appView.dataToUI()
        didSetRecord = true
    }
    if (appViewActive == appView && appViewActive?.record == appView?.record && !didSetRecord)
        return
    const main_panel = guiMain.layout.panels[1]
    main_panel.tabs.remove(...main_panel.tabs.tabs.map(_ => _.id))
    if (!(appViewActive = appView))
        guiMain.layout.html('main', '?')
    else {
        if (appView.tabbed) {
            main_panel.tabs.insert(null, appView.tabbed)
            main_panel.tabs.click(appView.tabbed[0].id)
        } else {
            main_panel.tabs.insert(null, [{ id: 'tab_' + appView.name, text: appView.tabTitle(), ctl: appView }])
            main_panel.tabs.click('tab_' + appView.name)
        }
    }
}

export function appViewRefresh(appView) {
    if (appView.refresh)
        appView.refresh()
    else if (appView.tabbed)
        for (const tab of appView.tabbed)
            if (tab.ctl.refresh)
                tab.ctl.refresh()
}
