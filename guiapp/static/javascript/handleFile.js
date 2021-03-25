function handleFiles(fileList) {
    let reader = new FileReader();
    reader.onload = function() {
        const fileData = reader.result;
        const wb = XLSX.read(fileData, {type : 'binary'});
        wb.SheetNames.forEach( function (sheetName) {
            const rawData =XLSX.utils.sheet_to_row_object_array(wb.Sheets[sheetName]);
            Source.validateArr(rawData);
            Source.generate(rawData);
        })
    };
    try {
        const name = fileList[0];
        const success = "Select an excel successfully, Click&nbsp;<b>main method</b>&nbsp;to get more information.";
        reader.readAsBinaryString(name);
        Display.removeAll();
        Display.title(`Current file: ${name.name}`);
        Display.hint(success);
    } catch (error) {
        Display.removeAll();
        Display.hint(error);
    }
}