import van from "/vanjs/van-1.1.3.debug.js";
const html = van.tags;

export default function GuiSideBarProjectPane() {
    return {
        icon: '🗂️',
        title: 'Project',
        _: html.span({ style: 'margin: 0.2em; padding: 0.2em;' }, "Content of GuiSideBarProjectPane at " + Date.now()),
    };
}
