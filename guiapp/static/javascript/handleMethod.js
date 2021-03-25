class Information {
    constructor () {}
    logResult ( arr, obj ) {
        let start = null;
        let end = null;
        let rec = null;
        let results = [];
        while ( arr.length || start ) {
            const val = arr[0];
            const reason = obj.has(val)? obj.get(val).get(variable): "";
            let log = false;
            let log_end = false;
            let log_reason = false;
            if ( !start ) {
                start = val;
                rec = reason;
                end = val;
            } else if ( arr.length == 0 ) {
                log = true;
            } else if ( rec === reason ) {
                if (end+1 == val)
                    end = val;
                else
                    log_end = true;
            } else
                log_reason = true;
            if ( log || log_end || log_reason ) {
                const trail = ( start == end )? start: `${start}-${end}`;
                results.push([trail, rec]);
                start = ( arr.length==0 ) ? null : val; 
            }
            if ( log_end || log_reason )
                end = val;
            if ( log_reason )
                rec = reason;
            arr.shift();
        }
        return results;
    }
    

    get current () {
        let results = [];
        for ( const model of Source.models ) {
            if ( !Source.excluded.has(model) ) {
                continue;
            }
            for ( const user of Source.users ) {
                if ( !Source.excluded.get(model).has(user) ) {
                    continue;
                }
                let obj = [...Source.excluded.get(model).get(user)];
                obj.sort((a, b) =>  a - b );
                for (const arr of this.logResult(obj, empty)) {
                    results.push([model, user, arr[0]]);
                }
            }
        }
        return results;
    }

    get integrity () {
        var preprocessing = function () {
            let mymap = new Map();
            for ( const element of getValidData() ) {
                const model = element.get(variable.model);
                const user = element.get(variable.user);
                const trail = element.get(variable.trail);
                const reason = element.get(variable.reason);
                Tools.createMap(mymap, [model, user, trail], new Map([
                    [variable.reason, reason]
                ]));
            }
            return mymap;
        }

        const mymap = preprocessing();
        const total = Source.trails.length;
        let results = [];
        for ( const model of Source.models ) {
            if ( !mymap.has(model) ) {
                continue;
            }
            for ( const user of Source.users ) {
                if ( !mymap.get(model).has(user) ) {
                    continue;
                }
                const obj = mymap.get(model).get(user);
                let arr = [...obj.keys()];
                if ( arr.length == total ) {
                    continue;
                }
                arr.sort((a, b) => a - b );
                for ( const res of this.logResult(arr, obj) ) {
                    results.push([model, user, ...res]);
                }
            }
        }
        return results;
    }

    get outlier () {
        var preprocessing = function () {
            let mymap = new Map();
            for ( const element of getValidData() ) {
                const count = element.get(variable.validFail);
                const model = element.get(variable.model);
                const user = element.get(variable.user);
                const val = Tools.createMap(mymap, [model, user], 0);
                let obj = mymap.get(model);
                const c = (count > 0)? 1: 0;
                obj.set(user, val+c);
            }
            return mymap;
        }
        const mymap = preprocessing();
        let arr = [];
        for ( const model of Source.models ) {
            if ( !mymap.has(model) ) {
                continue;
            }
            const current = mymap.get(model);
            let currentValues = [...current.values()];
            const mean = math.mean(currentValues);
            const stdev = math.std(currentValues);
            const outlier = (mean + 2 * stdev).toFixed(2);
            for ( const user of Source.users ) {
                if ( !current.has(user) ) {
                    continue;
                }
                const count = current.get(user); 
                if ( count > outlier ) {
                    arr.push([model, user, count, mean.toFixed(2), outlier]);
                }
            }
        }
        return arr;    
    }

    main ( name ) {
        const basic = [variable.model, variable.user];
        const headMap = new Map([
            ["integrity-check", [...basic, variable.trail, variable.reason]],
            ["outlier", [...basic, "failed counts", "mean", "outlier value"]],
            ["current-exclude", [...basic, variable.trail]]
        ]);
        let bodyArr = [];
        if ( name == "outlier" ) {
            bodyArr = this.outlier;
        } else if ( name == "integrity-check" ) {
            bodyArr = this.integrity;
        } else if ( name == "current-exclude" ) {
            bodyArr = this.current;
        }
        const headArr = headMap.get(name);
        const hasTH = false;
        return { headArr, bodyArr, hasTH };
    }
}

class Calculate {
    constructor () {}
    generateData( map ) {
        var createMap = function (map, keys) {
            const requireField = [
                variable.total,
                variable.duration,
                variable.validFail,
            ];
            let obj = Tools.createMap(map, keys, new Map());
            requireField.forEach( field => {
                if ( !obj.has(field) ) {
                    obj.set(field, 0);
                }
            })
            return obj 
        }
        let arr = [];
        for ( const element of getValidData() ) {
            const model = element.get(variable.model);
            const hard = element.get(variable.hard);
            let obj = createMap(map, [model, hard]);
            const total = obj.get(variable.total);
            obj.set(variable.total, total+1);
            arr.push({ element: element, current: obj });
        }
        return arr;
    }

    get errorRate() {
        let mymap = new Map();
        let data = this.generateData(mymap);
        for ( let obj of data ) {
            let current = obj.current;
            let element = obj.element;
            let counts = element.get(variable.validFail);
            let fail = current.get(variable.validFail);
            if ( counts ) {
                fail++;
            }
            current.set(variable.validFail, fail);
        }
        return mymap;
    }

    get errorTime() {
        let mymap = new Map();
        let data = this.generateData(mymap);
        for ( let obj of data ) {
            let current = obj.current;
            let element = obj.element;
            let count = element.get(variable.validFail);
            let fail = current.get(variable.validFail);
            current.set(variable.validFail, fail+count);
        }
        return mymap;
    }

    get correct() {
        let mymap = new Map();
        let data = this.generateData(mymap);
        for ( let obj of data ) {
            let current = obj.current;
            let element = obj.element;
            let has_fail = element.get(variable.validFail);
            if ( has_fail ) {
                let trails = current.get(variable.total);
                current.set(variable.total, trails-1);
                continue;
            }
            let time = element.get(variable.duration);
            let curr_time = current.get(variable.duration);
            current.set(variable.duration, curr_time+time);
        }
        return mymap;
    }

    get overall () {
        let mymap = new Map();
        let data = this.generateData(mymap);
        for ( let obj of data ) {
            let current = obj.current;
            let element = obj.element;
            let time = element.get(variable.duration);
            let curr_time = current.get(variable.duration);
            current.set(variable.duration, curr_time+time);
        }
        return mymap;
    }

    get head() {
        const hard = window.source.get(variable.hard);
        return ["#", ...hard];
    }
    
    body ( map ) {
        let results = [];
        for ( const model of Source.models ) {
            if ( !map.has(model) ) {
                continue;
            }
            const obj = map.get(model);
            let arr = [model];
            for ( const id of Source.hard ) {
                if ( !obj.has(id) ) {
                    continue;
                }
                const current = obj.get(id);
                const total = current.get(variable.total);
                if ( current.get(variable.validFail) ) {
                    const count = current.get(variable.validFail);
                    const res = (100 * count/total).toFixed(2);
                    arr.push(`(${count}/${total})<br>${res}%`);
                } else {
                    const count = current.get(variable.duration);
                    const res = (count/total).toFixed(2);
                    arr.push(`(${count}/${total})<br>${res}`);
                }
            }
            results.push(arr);
        }
        return results;
    }

    main ( name ) {
        let mymap = null;
        if ( name == "error-rate" ) {
            mymap = this.errorRate;
        } else if ( name == "error-time" ) {
            mymap = this.errorTime;
        } else if ( name == "overall" ) {
            mymap = this.overall;
        } else if ( name == "correct" ) {
            mymap = this.correct;
        }
        const headArr = this.head;
        const bodyArr = this.body(mymap)
        const hasTH = false;
        return { headArr, bodyArr, hasTH };
    }
}

class Method {
    constructor () {}
    main ( name, e ) {
        const classMap = new Map([
            ["error-rate", Calculate],
            ["error-time", Calculate],
            ["overall", Calculate],
            ["correct", Calculate],
            ["outlier", Information],
            ["integrity-check", Information],
            ["current-exclude", Information],
        ]);

        if ( !classMap.has(name) ) {
            throw `invalid operation`;
        }
        const cls = classMap.get(name);
        c = new cls();
        const result = c.main(name);
        const text = Table.build(result.headArr, result.bodyArr, result.hasTH);
        Display.result(text);
    }
}
