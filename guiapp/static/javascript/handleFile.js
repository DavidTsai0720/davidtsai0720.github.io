function handleFiles(fileList) {
    let reader = new FileReader();
    reader.onload = function() {
        const fileData = reader.result;
        const wb = XLSX.read(fileData, {type : 'binary'});
        wb.SheetNames.forEach( function (sheetName) {
            const rawData =XLSX.utils.sheet_to_row_object_array(wb.Sheets[sheetName]);
            rawData.forEach( element => {
                validate(element);
            })
            window.source = generateSource(rawData);
        })
    };
    try {
        if ( !fileList ) {
            throw "Please&nbsp;<b>select an excel</b>.";
        }
        const name = fileList[0];
        const success = "Select an excel successfully, Click&nbsp;<b>main method</b>&nbsp;to get more information.";
        reader.readAsBinaryString(name);
        hint(success);
        title(`Current file: ${name.name}`);
    } catch (error) {
        hint(error);
    }
    
    
}