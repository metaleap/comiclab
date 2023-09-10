import van from "/vanjs/van-1.1.3.debug.js";
const html = van.tags;
import GuiSideBar from "/gui/sidebar.js";
import GuiCtlTabs from "/gui/ctl/tabs.js";

export default function GuiAppMain() {
    return html.div({},
        GuiSideBar(),
        html.p({ style: "padding-left: 22em" }, "Main Content"),
        GuiCtlTabs('test', [
            { title: 'Foo1', _: html.p('Foo1 Content') },
            { title: 'Bar1', _: html.p('Bar1 Content') },
            { title: 'Baz1', _: html.p('Baz1 Content') },
        ]),
        GuiCtlTabs('test2', [
            { title: 'Foo2', _: html.p('Foo2 Content') },
            { title: 'Bar2', _: html.p('Bar2 Content') },
            { title: 'Baz2', _: html.p('Baz2 Content') },
        ]),
    );
}
