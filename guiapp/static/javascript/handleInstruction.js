class Instruction {
    constructor () {}

    static get HTML () {
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
        const tableAttr = new Map([
            ["class", "table table-hover table-bordered"],
            ["style", "text-align: left;"]
        ]);
        const tdAttr = new Map([ ["colspan", "2"] ]);

        let output = "";
        description.forEach( arr => {
            const isSingle = arr.length == 1;
            let content = [];
            arr.forEach( element => {
                if ( isSingle ) {
                    const text = `<h2>${element}</h2>`;
                    content.push(Table.generateHTML("th", text, tdAttr));
                } else if ( !content.length ) {
                    content.push(Table.defaultHTML("th", element));
                } else {
                    content.push(Table.defaultHTML("td", element));
                }
            });
            output += Table.defaultHTML("tr", content.join(""));
        });
        return Table.generateHTML("table", output, tableAttr);
    }
}

function handleInstruction () {
    Display.removeAll();
    Display.hint(Instruction.HTML);
}
