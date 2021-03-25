class Source {
    constructor () {}
    static get checkField() {
        return [
            variable.model,
            variable.user,
            variable.hard,
            variable.trail,
        ];
    }

    static validateArr( arr ) {
        var validate = function(map) {
            const re = new Map([
                [variable.click, new RegExp("^(?:Start|Else|Target)$")],
                [variable.time, new RegExp("^[0-9]+$")],
                [variable.hard, new RegExp("^[0-9]\.[0-9]$")],
                [variable.user, new RegExp("^[0-9]+\-?$")],
                [variable.trail, new RegExp("^[0-9]+$")],
                [variable.model, new RegExp(".+")],
            ]);

            for ( const [key, value] of re.entries() ) {
                if ( !map.hasOwnProperty(key) ) {
                    throw `Invalid data: Lost ${key}.`;
                }
                if ( !value.test(map[key]) ) {
                    throw `Invalid data type on ${key}`;
                }
            }
        }
        arr.forEach( map => {
            validate(map);
        });
    }

    static generate( data ) {
        const requiredField = [
            variable.model,
            variable.user,
            variable.trail,
        ];

        var converToMap = function ( arr ) {
            const checkField = [
                variable.model,
                variable.user,
                variable.hard,
                variable.trail,
            ];
            let result = new Map();
            let timeEvents = new Map();
            checkField.forEach( field => {
                result.set(field, new Set());
            })
    
            arr.forEach( element => {
                const time = element[variable.time];
                timeEvents.set(time, element);
    
                checkField.forEach( field => {
                    const value = element[field];
                    result.get(field).add(value);
                })
            })
    
            for ( const [key, value] of result.entries() ) {
                if ( key != "reason" && [...value].length != 1 ) {
                    result.set("reason", `invalid value at ${key}`)
                }
            }
            let events = [...timeEvents.keys()];
            events.sort(function(a, b) { return a - b; });
            let start = false;
            let end = false;
            let validError = 0;
            let invalidError = 0;
            let startTime = 0;
    
            events.forEach( time => {
                const currentEvent = timeEvents.get(time);
                const action = currentEvent[variable.click];
                if ( action == variable.end ) {
                    if  ( end ) {
                        result.set("reason", "duplicate");
                    } else {
                        end = true;
                    }
                }
                if ( start ) {
                    if ( action == variable.start ) {
                        result.set("reason", "duplicate");
                    } else if ( action == variable.fail ) {
                        validError++;
                    } else if ( action == variable.end ) {
                        let time = currentEvent[variable.time];
                        result.set(variable.duration, time - startTime);
                    }
                } else if ( action == variable.start ) {
                    start = true;
                    startTime = currentEvent[variable.time];
                } else if ( action == variable.fail ) {
                    invalidError++;
                }
            })
            if ( !start || !end ) {
                result.set("reason", "lost data");
            }
    
            checkField.forEach( field => {
                const arr = result.get(field);
                result.set(field, [...arr][0]);
            })
    
            result.set(variable.invalidFail, invalidError);
            result.set(variable.validFail, validError);
            return result;
        }

        var requireInfo = function ( arr ) {
            let mymap = new Map();
            requiredField.forEach( field => {
                mymap.set(field, new Set());
            })
            arr.forEach( element => {
                requiredField.forEach( field => {
                    const value = element[field];
                    mymap.get(field).add(value);
                })
            })
            return mymap;
        }

        function* difference( a, b ) {
            const A = [...a];
            const B = new Set(b);
            const diff = A.filter(x => !B.has(x));
            for (const val of diff) {
                yield val;
            }
        }

        var UpdateMap = function ( map, source ) {
            const model = source.get(variable.model);
            const user = source.get(variable.user);
            let obj = Tools.createMap(map, [model, user], []);
            obj.push(source);
            return ;
        }

        var UpdateLostData = function ( data, model, user, trail ) {
            let mymap = new Map([
                [variable.model, model],
                [variable.user, user],
                [variable.trail, trail],
                [variable.reason, "lost data"]
            ]);
            UpdateMap(data, map);
            return;
        }

        var fillRequireInfo = function ( map, arr ) {
            for (const key of [...requiredField, variable.hard]) {
                let myset = new Set();
                arr.forEach( element => {
                    const value = element[key];
                    myset.add(value);
                })
                let array = [...myset];
                if ( key == variable.model ) {
                    array.sort();
                } else {
                    array.sort((a, b) => parseFloat(a) - parseFloat(b));
                }
                map.set(key, array);
            }
            return map;
        }

        let map = new Map();
        let hard = new Set();
        data.forEach( element => {
            let arr = [];
            requiredField.forEach( field => {
                if ( field == "Model" ) {
                    // remove html
                    const regex = new RegExp('(?:[\'\"\<\>])', 'g');
                    element[field] = element[field].replace(regex, '');
                }
                arr.push(element[field]);
            })
            let obj = Tools.createMap( map, arr, [] );
            obj.push(element);
            hard.add(element[variable.hard]);
        })
        let invalid = new Map();
        let valid = new Map();
        const total = requireInfo(data);

        for ( const [model, val] of map.entries() ) {
            const users = total.get(variable.user);
            for ( const user of difference(users, val.keys()) ) {
                const trails = total.get(variable.trail);
                trails.forEach( trail => {
                    UpdateLostData(invalid, model, user, trail);
                })
            }

            for ( const [user, values] of val.entries() ) {
                const trails = total.get(variable.trail);
                for ( const trail of difference(trails, values.keys()) ) {
                    UpdateLostData(invalid, model, user, trail);
                }

                for ( const arr of values.values() ) {
                    const mymap = converToMap(arr);
                    let obj = mymap.get(variable.reason)? invalid: valid;
                    UpdateMap(obj, mymap);
                }
            }
        }
        return fillRequireInfo(new Map([
            ["invalid", invalid],
            ["valid", valid],
            ["excluded", new Map()]
        ]), data)
    }

    static get models () {
        return window.source.get(variable.model);
    }

    static get users () {
        return window.source.get(variable.user);
    }

    static get hard () {
        return window.source.get(variable.hard);
    }

    static get trails () {
        return window.source.get(variable.trail);
    }

    static get valid () {
        return window.source.get("valid");
    }

    static get invalid () {
        return window.source.get("invalid");
    }

    static get excluded () {
        return window.source.get("excluded");
    }
}
