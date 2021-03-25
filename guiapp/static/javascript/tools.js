class Display {
    constructor () {}

    static show ( name, text ) {
        const e = document.querySelector(`div[name=${name}]`);
        e.innerHTML = text;
    }

    static removeAll () {
        const elements = ["left-bar", "sub-results", "hint"];
        elements.forEach( name => {
            this.show(name, "");
        })
    }

    static main ( text ) {
        this.show("main-table", text);
    }

    static leftBar ( text ) {
        this.show("left-bar", text);
    }

    static title ( text ) {
        this.show("title", text);
    }

    static hint ( text ) {
        this.show("hint", text);
    }

    static result ( text ) {
        this.show("sub-results", text);
    }
}

class Tools {
    constructor () {}
    static createMap ( map, keys, lastObj ) {
        if ( keys.length == 0 ) {
            return map;
        }
        const key = keys.shift();
        if ( !map.has(key) ) {
            let obj = ( keys.length == 0 )? lastObj: new Map();
            map.set(key, obj);
        }
        return this.createMap( map.get(key), keys, lastObj );
    }

    static removeActive ( e ) {
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
}

class Table {
    constructor () {}
    static generateHTML ( tag, content, attrs ) {
        let desc = [];
        for (const [key, val] of attrs.entries()) {
            const text = ( val )? `${key}='${val}'`: key;
            desc.push(text);
        }
        const text = `<${[tag, ...desc].join(" ")}>`;
        return ( tag == "input" )? text: `${text}${content}</${tag}>`;
    }

    static defaultHTML ( tag, content ) {
        const empty = new Map();
        const defaultAttrs = new Map([
            ["th", new Map([ ["scope", "col"] ])],
            ["table", new Map([
                ["class", "table table-hover table-bordered table-dark"],
            ])],
            ["form", new Map([ ["class", "form-inline"] ])],
            ["nav", new Map([ ["class", "navbar navbar-light"] ])],
            ["label", new Map([ ["class", "form-check-label"] ])],
        ]);
        const attrs = defaultAttrs.get(tag) || empty;
        return this.generateHTML(tag, content, attrs);
    }

    static head ( arr ) {
        let text = "";
        arr.forEach( element => {
            text += this.defaultHTML("th", element);
        });
        return text;
    }

    static body ( arr, hasTH ) {
        let list = [];
        arr.forEach( rows => {
            let innerText = "";
            rows.forEach( content => {
                const tag = ( hasTH && !list.length )? "th": "td";
                innerText += this.defaultHTML(tag, content);
            });
            list.push( this.defaultHTML("tr", innerText) );
        });
        return list.join("");
    }

    static build ( headArr, bodyArr, hasTH ) {
        const head = this.defaultHTML("thead", this.head(headArr));
        const body = this.defaultHTML("tbody", this.body(bodyArr, hasTH));
        return this.defaultHTML("table", head+body);
    }

    static button ( name, value ) {
        const attrs = new Map([
            ["type", "button"],
            ["class", "list-group-item list-group-item-action"],
            ["name", name]
        ]);
        return this.generateHTML("button", value, attrs);
    }

    static navbar ( content ) {
        const text = this.defaultHTML("form", content);
        return this.defaultHTML("nav", text);
    }

    static checkbox ( name, value, reason ) {
        // input checkbox
        let attrs = new Map([
            ["class", "form-check-input"],
            ["type", "checkbox"],
            ["name", name],
            ["value", value],
        ]);
        if ( reason ) {
            attrs.set("disabled", null);
        }
        return this.generateHTML("input", value, attrs);
    }

    static tips ( map, value ) {
        map.set("data-toggle", "tooltip");
        map.set("data-placement", "top");
        map.set("title", value);
        return map
    }

    static select ( name ) {
        const re = new Map([ ["select-model", new RegExp("([A-Z])\s*.+")] ]);
        const KEY = new Map([
            ["select-model", variable.model],
            ["select-user", variable.user],
            ["select-trail", variable.trail]
        ]);

        const key = KEY.get(name);
        const regex = re.get(name);
        const arr = window.source.get(key);
        let text = "";
        arr.forEach( element => {
            let attrs = new Map([
                ["class", "btn btn-outline-primary"],
                ["name", name],
                ["value", element]
            ]);
            let value = "";
            if ( regex ) {
                const m = element.match(regex);
                value = m[1];
                this.tips(attrs, element);
            } else {
                value = element;
            }
            text += this.generateHTML("div", value, attrs);
        })
        return this.nav(text);
    }
}

function isExcluded( element ) {
    if ( !Source.excluded ) {
        return false;
    }
    const model = element.get(variable.model); 
    if ( !Source.excluded.has(model) ) {
        return false;
    }
    const user = element.get(variable.user);
    return Source.excluded.get(model).has(user);
}

function* getDataFromSource(key) {
    const data = window.source.get(key);
    for ( const values of data.values() ) {
        for ( const arr of values.values() ) {
            for ( const element of arr ) {
                if ( isExcluded(element) ) {
                    continue;
                }
                yield element;
            }
        }
    }
}

function* getValidData() {
    for ( const element of getDataFromSource("valid") ) {
        yield element
    }
}