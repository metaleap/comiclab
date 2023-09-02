import van from "/vanjs/van-1.1.3.debug.js";
const html = van.tags;

const Hello = () => html.div(
    html.p("👋Hello"),
    html.ul(
        html.li("🗺️World"),
        html.li(html.a({ "href": "https://vanjs.org/" }, "🍦VanJS")),
    ),
)

van.add(document.body, Hello())
