import van from "/vanjs/van-1.1.3.debug.js";
const html = van.tags;

export function GuiAppFrame() {
    return html.div(
        html.p("App"),
        html.ul(
            html.li("Frame"),
        ),
    );
}
