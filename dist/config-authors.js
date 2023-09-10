import { w2grid } from '/w2ui/w2ui.js'

export const config_authors = new w2grid({
    name: "config_authors",
    show: {
        toolbar: true,
        toolbarAdd: true,
        toolbarDelete: true,
        toolbarEdit: true,
        toolbarSearch: false,
        toolbarReload: false,
    },
    columns: [
        { field: "author_id", text: "ID", sortable: true },
        { field: "author_name", text: "Full Name", sortable: true },
    ],
    records: [
        { author_id: "rsheckley", author_name: "Robert Sheckley" },
        { author_id: "aweir", author_name: "Andy Weir" },
    ],
})
