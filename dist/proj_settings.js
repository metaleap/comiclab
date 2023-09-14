import { w2form } from './w2ui/w2ui.es6.js'

import { dictKeys } from './util.js'

const tab_contentauthoring = {
    id: 'tab_contentauthoring',
    icon: 'fa-vcard',
    text: 'Content-Authoring',
    ctl: new w2form({
        name: 'tab_contentauthoring_form',
        fields: [
            {
                field: 'defaultLanguage', type: 'combo', options: {
                    items: () => dictKeys(appState.config?.contentAuthoring?.languages)
                }, html: { label: 'Default Language', }
            },
        ],
        record: {
            'defaultLanguage': '',
        },
        onChange(evt) {
            const errs = tab_contentauthoring.ctl.validate()
            if (!(errs && errs.length && errs.length > 0))
                proj_settings.onDirty(true)
        },
        onValidate(evt) {
        },
    }),
    dataToUI: () => {
        tab_contentauthoring.ctl.setValue('defaultLanguage', appState.proj.settings.defaultLanguage, true)
        tab_contentauthoring.ctl.refresh()
    },
    dataFromUI: () => {
        tab_contentauthoring.ctl.refresh()
        setTimeout(() => {
            const rec = tab_contentauthoring.ctl.getCleanRecord()
            appState.proj.settings.defaultLanguage = rec.defaultLanguage
        }, 123)
    },
}

export const proj_settings = {
    name: 'proj_settings',
    tabbed: [
        tab_contentauthoring,
    ],
    dataFromUI: () => proj_settings.tabbed.forEach(_ => _.dataFromUI()),
    dataToUI: () => proj_settings.tabbed.forEach(_ => _.dataToUI()),
}
