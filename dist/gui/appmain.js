import van from "/vanjs/van-1.1.3.debug.js";
const html = van.tags;
import GuiSideBar from "/gui/sidebar.js";
import GuiCtlTabs from "/gui/ctl/tabs.js";

export default function GuiAppMain() {
    return html.div({},
        GuiSideBar(),
        html.p({ style: "padding-left: 22em" }, "Main Content"),
        GuiCtlTabs([
            { title: 'Foo Tab', _: html.p('Foo Content') },
            { title: 'Bar Tab', _: html.p('Bar Content') },
            { title: 'Baz Tab', _: html.p('Baz Content') },
        ]),
    );
}
