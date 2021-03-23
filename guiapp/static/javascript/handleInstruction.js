const description = [
    ["How to use"],
    ["select an excel", `You must click <b>select an excel</b> 
    at beginning.<br>After the dialog pops up, please select an excel.<br>
    If the text valued <b>Select an excel successfully</b> appears, 
    you can click <b>main method</b> to get more information.`],
    ["exclude-data", `You can exclude data via the function.<br>
    For instance:<br> If you don't want to count outliers, 
    excluded them via this function.`],
    ["integrity-check", `View the invalid trail's information. 
    By the way, it doesn't appear excluded data.`],
    ["outlier", `It's equal to <b>mean plus double standard deviation</b>.`],
    ["note", `All calculation based on <b>valid trail</b>. 
    In other word, it doesn't count invalid and excluded data.`],
];

const extend_td = new Map([
    ["colspan", "2"]
]);

const table = new Map([
    ["class", "table table-hover table-bordered"],
    ["style", "text-align: left;"]
])


function to_string() {
    let output = [];
    for (const arr of description) {
        const single = arr.length == 1;
        let content = [];
        for (const val of arr) {
            if (single)
                content.push(set_tag("th", `<h2>${val}</h2>`, extend_td));
            else if (!content.length)
                content.push(set_default("th", val));
            else
                content.push(set_default("td", val));
        }
        output.push(set_default("tr", content.join("")));
    }
    return set_tag("table", output.join(""), table);
}

function handleInstruction () {
    const text = to_string();
    remove_all();
    hint(text);
}
