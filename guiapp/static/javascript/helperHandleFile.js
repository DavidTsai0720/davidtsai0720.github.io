const re = new Map([
    [variable.click, new RegExp("^(?:Start|Else|Target)$")],
    [variable.time, new RegExp("^[0-9]+$")],
    [variable.hard, new RegExp("^[0-9]\.[0-9]$")],
    [variable.user, new RegExp("^[0-9]+\-?$")],
    [variable.trail, new RegExp("^[0-9]+$")],
    [variable.model, new RegExp(".+")],
]);

const check_field = [
    variable.model,
    variable.user,
    variable.hard,
    variable.trail
];

const required_field = [
    variable.model,
    variable.user,
    variable.trail,
];

function validate(map) {
    for (const [key, value] of re.entries()) {
        if (!map.hasOwnProperty(key)) {
            throw `Invalid data: Lost ${key}.`;
        }
        if (!value.test(map[key])) {
            throw `Invalid data type on ${key}`;
        }
    }
}

function converToMap (arr) {
    let rec = new Map();
    for (const key of check_field) {
        rec.set(key, new Set());
    }
    let event = new Map();
    for (const element of arr) {
        for (const field of check_field) {
            rec.get(field).add(element[field]);
        }
        const time = element[variable.time];
        event.set(time, element);
    }
    for (const [key, value] of rec.entries()) {
        if (key != "reason" && [...value].length != 1) {
            rec.set("reason", `invalid value at ${key}`)
        }
    }
    let times = [...event.keys()];
    times.sort(function(a, b) { return a - b; });
    let start = false;
    let end = false;
    let valid_error = 0;
    let invalid_error = 0;
    let start_time = 0;
    for (const time of times) {
        const info = event.get(time);
        const action = info[variable.click];
        if (action == variable.end) {
            if (end) {
                rec.set("reason", "duplicate");
            } else {
                end = true;
            }
        }
        if (start) {
            if (action == variable.start) {
                rec.set("reason", "duplicate");
            } else if (action == variable.fail) {
                valid_error++;
            } else if (action == variable.end) {
                let time = info[variable.time];
                rec.set(variable.duration, time - start_time);
            }
        } else if (action == variable.start) {
            start = true;
            start_time = info[variable.time];
        } else if (action == variable.fail) {
            invalid_error++;
        }
    }
    if (!start || !end) {
        rec.set("reason", "lost data");
    }
    for (const field of check_field) {
        const obj = rec.get(field);
        rec.set(field, [...obj][0]);
    }
    rec.set(variable.invalid_fail, invalid_error);
    rec.set(variable.valid_fail, valid_error);
    return rec;
}

function required_info(arr) {
    let rec = new Map();
    required_field.forEach(val => {
        rec.set(val, new Set());
    })
    for (const element of arr) {
        required_field.forEach(val => {
            let value = element[val];
            rec.get(val).add(value);
        })
    }
    return rec;
}

function* difference(a, b) {
    const A = [...a];
    const B = new Set(b);
    const diff = A.filter(x => !B.has(x));
    for (const val of diff) {
        yield val;
    }
}

function insert_to_map(map, source) {
    const model = source.get(variable.model);
    const user = source.get(variable.user);
    let obj = create_map(map, [model, user], []);
    obj.push(source);
}

function insert_lost_data(data, model, user, trail) {
    let map = new Map([
        [variable.model, model],
        [variable.user, user],
        [variable.trail, trail],
        [variable.reason, "lost data"]
    ]);
    insert_to_map(data, map);
}

function fill_full_info(map, data) {
    for (const key of [...required_field, variable.hard]) {
        let set = new Set()
        for (const element of data) {
            let val = element[key];
            set.add(val);
        }
        let arr = [...set];
        if (key == variable.model)
            arr.sort();
        else
            arr.sort((a, b) => parseFloat(a) - parseFloat(b));
        map.set(key, arr);
    }
    return map;
}

function generateSource (data) {
    const regex = new RegExp('(?:[\'\"\<\>])', 'g');
    let map = new Map();
    let hard = new Set();
    for (const element of data) {
        let arr = [];
        for (const key of required_field) {
            if ( key == 'Model' ) {
                element[key] = element[key].replace(regex, '');
            }
            arr.push(element[key]);
        }
        let obj = create_map(map, arr, []); 
        obj.push(element);
        hard.add(element[variable.hard]);
    }
    let invalid = new Map();
    let valid = new Map();
    const total = required_info(data);
    for (const [model, val] of map.entries()) {
        for (const user of difference(
            total.get(variable.user),
            val.keys()
        )) {
            for (const trail of total.get(variable.trail)) {
                insert_lost_data(invalid, model, user, trail);
            }
        }
        for (const [user, values] of val.entries()) {
            for (const trail of difference(
                total.get(variable.trail),
                values.keys()
            )) {
                insert_lost_data(invalid, model, user, trail); 
            }
            for (const arr of values.values()) {
                const data = converToMap(arr);
                let obj = (data.get(variable.reason)) ? invalid : valid;
                insert_to_map(obj, data);
            }
        }
    }
    return fill_full_info(new Map([
        ["invalid", invalid],
        ["valid", valid],
        ["excluded", new Map()]
    ]), data)
}