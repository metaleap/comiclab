import { proj_collection } from './proj_collection.js'
import { proj_pagelayout } from './proj_pagelayout.js'
import { proj_settings_content } from './proj_settings_content.js'
import { config_contentauthoring } from './config_contentauthoring.js'

export const appViews = {
    proj_collection: proj_collection,
    proj_pagelayout: proj_pagelayout,
    proj_settings_content: proj_settings_content,
    config_contentauthoring: config_contentauthoring,
}

export let appViewActive = null

export function appViewSetActive(appView, record) {
    let didSetRecord = false
    if (record && appView && record != appView.record) {
        if (appView.setRecord)
            appView.setRecord(record)
        else
            appView.record = record
        appView.dataToUI()
        didSetRecord = true
    }
    if (appViewActive == appView && appViewActive?.record == appView?.record && !didSetRecord)
        return
    const main_panel = guiMain.layout.panels[1]
    main_panel.tabs.remove(...main_panel.tabs.tabs.map(_ => _.id))
    if (!(appViewActive = appView)) {
        guiMain.sidebar.unselect()
        guiMain.layout.html('main', '')
    } else if (appView.tabbed) {
        for (const tab of appView.tabbed)
            if (tab.icon) {
                tab.text = '<span class="fa ' + tab.icon + '">&nbsp;</span>&nbsp;' + tab.text
                tab.icon = null
            }
        main_panel.tabs.insert(null, appView.tabbed)
        main_panel.tabs.click(appView.tabbed[0].id)
    } else {
        main_panel.tabs.insert(null, [{ id: 'tab_' + appView.name, text: appView.tabTitle(), ctl: appView }])
        main_panel.tabs.click('tab_' + appView.name)
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
