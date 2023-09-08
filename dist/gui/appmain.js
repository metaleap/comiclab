import van from "/vanjs/van-1.1.3.debug.js";
const html = van.tags;
import GuiSideBar from "/gui/sidebar.js";

export default function GuiAppMain() {
    return html.div({},
        GuiSideBar(),
        html.p("Main Content")
    );
}
