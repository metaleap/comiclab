import van from "/vanjs/van-1.1.3.debug.js";
const html = van.tags;

export default function GuiSideBarLogbookPane() {
    return {
        icon: '🐾',
        title: 'Logbook',
        _: html.span({ style: 'margin: 0.2em; padding: 0.2em;' }, "Content of GuiSideBarLogbookPane at " + Date.now()),
    };
}
