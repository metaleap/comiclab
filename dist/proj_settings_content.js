import { dictKeys, newForm } from './util.js'

const tab_contentauthoring = {
    id: 'tab_contentauthoring',
    icon: 'fa-map',
    text: 'Content Authoring',
    ctl: newForm('tab_contentauthoring_form', (dirty) => proj_settings_content.onDirty(dirty), [
        {
            field: 'defaultLanguage', type: 'combo', options: {
                items: () => dictKeys(appState.config?.contentAuthoring?.languages)
            }, html: { label: 'Default Language', }
        },
    ]),
    dataToUI: () => tab_contentauthoring.ctl.onDataToUI(() => {
        tab_contentauthoring.ctl.setValue('defaultLanguage', appState.proj.settings.defaultLanguage, true)
    }),
    dataFromUI: () => tab_contentauthoring.ctl.onDataFromUI(() => {
        const rec = tab_contentauthoring.ctl.getCleanRecord()
        appState.proj.settings.defaultLanguage = rec.defaultLanguage
    }),
}

export const proj_settings_content = {
    name: 'proj_settings_content',
    tabbed: [
        tab_contentauthoring,
    ],
    dataFromUI: () => proj_settings_content.tabbed.forEach(_ => _.dataFromUI()),
    dataToUI: () => proj_settings_content.tabbed.forEach(_ => _.dataToUI()),
}
