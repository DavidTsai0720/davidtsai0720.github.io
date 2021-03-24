class Select {
    constructor () {}

    static get METHODS () {
        return new Map([
            ["main-methods", main_method],
            ["exclude-data", exclude],
            ["exclude", action],
            ["include", action],
            ["details", this.detail],
            ["more-details", this.moreDetail],
        ]);
    }

    static main ( name, element ) {
        var swap = function ( sourceA, sourceB, key ) {
            function* candidates( name ) {
                const selector = document.querySelectorAll(`input[name=${name}]`);
                for ( const e of selector ) {
                    if ( !e.checked ) {
                        continue;
                    }
                    const arr = e.value.split(";");
                    yield arr
                }
            }
            for ( const arr of candidates(key) ) {
                const model = arr[0];
                const user = arr[1];
                const data = sourceA.has(model)? sourceA.get(model): [];
                let member = "";
                if ( data.has(user) ) {
                    member = user;
                } else if ( data.has(parseInt(user)) ) {
                    member = parseInt(user);
                }
                if ( !sourceB.has(model) ) {
                    sourceB.set(model, new Map());
                }
                sourceB.get(model).set(member, data.get(member));
                sourceA.get(model).delete(member);
            }
            return ;
        }

        var reverse = function ( e, name ) {
            const selectAll = e.target.value == "SELECT-ALL";
            const text = selectAll? "DISABLE-ALL": "SELECT-ALL";
            const selector = document.querySelectorAll(`input[name=${name}]`);
            for ( let element of selector ) {
                element.checked = selectAll;
            }
            e.target.value = text;
            e.target.innerText = text;
            return ;
        }
        if ( name == "select-action" ) {
            const value = element.target.value;
            if ( value == "REMOVE" ) {
                swap(window.source.get("valid"), window.source.get("excluded"), "exclude");
            } else {
                swap(window.source.get("excluded"), window.source.get("valid"), "include");
            }
            name = "exclude-data"
        } else if ( name == "remove-all" ) {
            reverse(e, "exclude");
        } else if (name == "recovery-all") {
            reverse(e, "include");
        }

        if ( !this.METHODS.has(name) ) {
            throw `invalid operation`;
        }
        const func = METHODS.get(name);
        const text = func();
        if ( text == "" ) {
            return ;
        }
        Display.result(text);
    }

    static title ( hasActive ) {
        var button = function ( name, val, activeValue ) {
            const another = val == activeValue ? "active" : "";
            const text = val.split(" ", 1)[0];
            const attrs = new Map([
                ["type", "button"],
                ["class", `btn btn-outline-primary col-3 ${another}`],
                ["data-toggle", "tooltip"],
                ["data-placement", "top"],
                ["title", val],
                ["name", name],
                ["value", val]
            ]);
            return Table.generateHTML("button", text, attrs);
        }

        let text = "";
        for ( const m of window.source.get(model) ) {
            text += button("more-details", m, hasActive)
        }
        return text;
    }

    static get moreDetail () {
        const selector = document.querySelectorAll(`button[name=${NAME}]`);
        let currentModel = "";
        for ( const e of selector ) {
            if ( e.classList.contains("active") ) {
                currentModel = e.value;
            }
        }
        let logs = new Map();
        for ( const element of getValidData() ) {
            if ( element.get(model) != currentModel ) {
                continue;
            }
            const count = element.get(variable.validFail);
            const member = element.get(user);
            const id = element.get(hard);
            if ( !logs.has(member) ) {
                logs.set(member, new Map());
            }
            if ( !logs.get(member).has(id) ) {
                logs.get(member).set(id, 0);
            }
            if ( count > 0 ) {
                const current = logs.get(member).get(id);
                logs.get(member).set(id, current+1);
            }
        }
        let array = [];
        let users = [...logs.keys()];
        let total = new Map();
        users.sort((a, b) => parseInt(a) - parseInt(b) );
        users.forEach( member => {
            let row = [member];
            let counts = 0;
            for ( const id of window.source.get(hard) ) {
                const count = logs.get(member).get(id) || 0;
                row.push(count);
                counts+=count;
                if ( !total.has(id) ) {
                    total.set(id, count);
                } else {
                    total.set(id, total.get(id)+count);
                }
            }
            array.push([...row, counts]);
        })
        let arr = ["total"];
        let counts = 0;
        for ( const id of window.source.get(hard) ) {
            const total_count = total.get(id) || 0;
            arr.push(total_count);
            counts+=total_count;
        }
        array.push([...arr, counts]);
        const header = ["#", ...window.source.get(hard), "total"];
        return this.title(currentModel)+Table.build(header, array, true);
    }

    static get detail() {
        return this.title("");
    }

}
