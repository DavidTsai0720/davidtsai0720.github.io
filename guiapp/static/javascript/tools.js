function display (name, content) {
    let selector = document.querySelector(`div[name=${name}]`);
    selector.innerHTML = content;
}

function remove_all () {
    ["left-bar", "sub-results", "hint"].forEach(
        name => display(name, "")
    )
}

function display_main (content) {
    display("main-table", content);
}
function left_bar (content) {
    display("left_bar", content);
}
function sub_results (content) {
    display("sub_results", content);
}
function hint (content) {
    display("hint", content);
}

function title (content) {
    display("title", content);
}

function create_map(map, keys, final_obj) {
    if (keys.length == 0) {
        return map;
    }
    const key = keys.shift();
    if (!map.has(key)) {
        let obj = (keys.length) ? new Map(): final_obj;
        map.set(key, obj);
    }
    return create_map(map.get(key), keys, final_obj);
}

function remove_active (e) {
    let siblings = [];
    let node = e.target.parentNode.firstChild;
    while ( node ) {
        if ( node !== e.target && node.nodeType === Node.ELEMENT_NODE ) 
        siblings.push( node );
        node = node.nextElementSibling || node.nextSibling;
    }
    for (const element of siblings) {
        element.classList.remove("active")
    }
    e.target.classList.add("active")
}

const empty = new Map();
const default_attrs = new Map([
    ["th", new Map([ ["scope", "col"] ])],
    ["table", new Map([
        ["class", "table table-hover table-bordered table-dark"],
    ])],
    ["form", new Map([ ["class", "form-inline"] ])],
    ["nav", new Map([ ["class", "navbar navbar-light"] ])],
    ["label", new Map([ ["class", "form-check-label"] ])],
])


function set_tag(tag, content, attrs) {
    let desc = [];
    for (const [key, val] of attrs.entries()) {
        const text = (val) ? `${key}='${val}'` : key;
        desc.push(text);
    }
    const text = `<${[tag, ...desc].join(" ")}>`;
    return (tag == "input") ? text : `${text}${content}</${tag}>`;
}

function set_default(tag, content) {
    const attr = default_attrs.get(tag) || empty;
    return set_tag(tag, content, attr);
}

function build_head(arr) {
    let str = [];
    for (const val of arr) {
        str.push(set_default("th", val));
    }
    return str.join("");
}

function build_body(arr, has_th) {
    let str = [];
    for (const row of arr) {
        let row_arr = [];
        for (const col of row) {
            const tag = (has_th && !row_arr.length) ? "th" : "td";
            row_arr.push(set_default(tag, col));
        }
        str.push(set_default("tr", row_arr.join("")));
    }
    return str.join("");
}

function build_table(head_arr, body_arr, body_th) {
    const head = set_default("thead", build_head(head_arr));
    const body = set_default("tbody", build_body(body_arr, body_th));
    return set_default("table", head+body);
}