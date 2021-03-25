class Select {
    constructor () {}

    get mainMethod () {
        const methods = new Map([
            ["exclude-data", "exclude data"],
            ["integrity-check", "integrity check"],
            ["outlier", "outlier"],
            ["error-rate", "error rate"],
            ["error-time", "error times"],
            ["correct", "correct travel time"],
            ["overall", "overall travel time"],
            ["details", "error rate (frequency)"]
        ])
        let text = "";
        for ( const [name, value] of methods.entries() ) {
            const attrs = new Map([
                ["type", "button"],
                ["class", "list-group-item list-group-item-action"],
                ["name", name]
            ]);
            text += Table.generateHTML("button", value, attrs);
        }
        Display.leftBar(text);
        Display.hint("");
        Display.result("If there is any <b>dirty data</b>, please exclude them via <b>exclude-data</b>.");
        return ;
    }

    title ( hasActive ) {
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
        Source.models.forEach( model => {
            text += button("more-details", model, hasActive)
        })
        return text;
    }

    get moreDetail () {
        const selector = document.querySelectorAll("button[name=more-details]");
        let currentModel = "";
        for ( const e of selector ) {
            if ( e.classList.contains("active") ) {
                currentModel = e.value;
            }
        }
        let logs = new Map();
        for ( const element of getValidData() ) {
            if ( element.get(variable.model) != currentModel ) {
                continue;
            }
            const count = element.get(variable.validFail);
            const member = element.get(variable.user);
            const id = element.get(variable.hard);
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
            Source.hard.forEach( id => {
                const count = logs.get(member).get(id) || 0;
                row.push(count);
                counts+=count;
                if ( !total.has(id) ) {
                    total.set(id, count);
                } else {
                    total.set(id, total.get(id)+count);
                }
            })
            array.push([...row, counts]);
        })
        let arr = ["total"];
        let counts = 0;
        Source.hard.forEach( id => {
            const total_count = total.get(id) || 0;
            arr.push(total_count);
            counts+=total_count;
        })
        array.push([...arr, counts]);
        const header = ["#", ...Source.hard, "total"];
        return this.title(currentModel)+Table.build(header, array, true);
    }

    get detail() {
        return this.title(false);
    }

    get exclude () {
        function* groupby() {
            for ( const user of Source.users ) {
                for ( const model of Source.models ) {
                    yield { user, model };
                }
            }
        }
        var candidates = function ( name, data, other ) {
            let arr = [];
            for ( const cur of groupby() ) {
                if ( !data.has(cur.model) || !data.get(cur.model).has(cur.user) ) {
                    continue;
                }
                if ( other && other.has(cur.model) && other.get(cur.model).has(cur.user) ) {
                    continue;
                }
                const box = Table.checkbox(name, `${cur.model};${cur.user}`, false);
                arr.push([box, cur.user, cur.model]); 
            }
            return arr;
        }

        var buildTable = function ( isExclude ) {
            let head = "";
            let bodyArr = [];
            if ( isExclude ) {
                head = Table.head(["EXCLUDE", variable.user, variable.model]);
                bodyArr = candidates("exclude", Source.valid, Source.excluded);
            } else {
                head = Table.head(["INCLUDE", variable.user, variable.model]);;
                bodyArr = candidates("include", Source.excluded, false);
            }
            const body = Table.body(bodyArr, false);
            const tableAttr = new Map([ ["class", "table table-hover"] ]);
            return Table.generateHTML("table", head+body, tableAttr)
        }
        var button = function ( name, value ) {
            const attrs = new Map([
                ["type", "button"],
                ["class", "btn btn-outline-primary col-3"],
                ["name", name],
                ["value", value]
            ]);
            return Table.generateHTML("button", value, attrs);
        }
        const divAttr = new Map([ ["class", "row"] ]);
        const removeText = button("select-action", "REMOVE")+button("remove-all", "SELECT-ALL");
        const recoveryText = button("select-action", "RECOVERY")+button("recovery-all", "SELECT-ALL");
        return [
            buildTable(true),
            Table.generateHTML("div", removeText, divAttr),
            buildTable(false),
            Table.generateHTML("div", recoveryText, divAttr),
        ].join("");
    }

    main ( name, element ) {
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
                swap(Source.valid, Source.excluded, "exclude");
            } else {
                swap(Source.excluded, Source.valid, "include");
            }
            name = "exclude-data"
        } else if ( name == "remove-all" ) {
            reverse(element, "exclude");
        } else if ( name == "recovery-all" ) {
            reverse(element, "include");
        }

        let text = "";
        if ( name == "main-methods" ) {
            text = this.mainMethod;
        } else if ( name == "details" ) {
            text = this.detail;
        } else if ( name == "more-details" ) {
            text = this.moreDetail;
        } else if ( name == "exclude-data" ) {
            text = this.exclude;
        } else if ( name == "exclude" || name == "include" ) {
            this.action();
        }
        if ( text ) {
            Display.result(text);
        }
    }

    action () {
        var activeElementValue = function ( name ) {
            const elements = document.querySelectorAll(`div[name=${name}]`);
            for ( const element of elements ) {
                if ( element.classList.contains("active") )
                    return element.getAttribute("value");
            }
        }

        function* enableTrails () {
            const elements = document.querySelectorAll("input[name=select-trail]");
            for ( const element of elements ) {
                if ( !element.disabled ) {
                    yield element;
                }
            }
        }

        var setChecked = function ( bool ) {
            for ( const element of enableTrails() ) {
                element.checked = bool;
            }
        }

        var getCheckedValue = function () {
            let results = []; 
            for ( const element of enableTrails() ) {
                if ( element.checked ) {
                    const value = element.getAttribute("value");
                    results.push(parseInt(value));
                }
            }
            return results;
        }

        var save = function () {
            const model = activeElementValue("select-model");
            const user = activeElementValue("select-user");
            const trails = getCheckedValue();
            if ( !Source.excluded.has(model) ) {
                Source.excluded.set(model, new Map());
            }
            Source.excluded.get(model).set(user, new Set(trails));
        }

        const event = activeElementValue("excluded-action");
        if ( event == "exclude-all" ) {
            setChecked(true);
        } else if ( event == "include-all" ) {
            setChecked(false);
        } else if ( event == "save" ) {
            save();
        }
    }
}
