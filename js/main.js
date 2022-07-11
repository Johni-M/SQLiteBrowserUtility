if (!window.FileReader) {
    errorDisplay.innerHTML = '⛔ WARNING: Your browser does not support HTML5 \'FileReader\' function required to open a file.';
    //return;
}

let errorDisplay = document.getElementById('errorDisplay');
let openDatabase = document.getElementById('open_database');
let tableRecords = document.getElementById('tableRecords');

// the database
let db = null;

openDatabase.addEventListener('change', async (ev) => {
    errorDisplay.innerHTML = '';

    let file = ev.currentTarget.files[0];
    if (!file) return;

    try {

        let arrayBuffer = await readFileAsArrayBuffer(file);
        let uInt8Array = new Uint8Array(arrayBuffer);
        db = new SQL.Database(uInt8Array);


        // render datatable records
        let stmt = 'SELECT * FROM sqlite_master';
        let resultset = db.exec(stmt);
        renderDatatable(resultset, tableRecords);


    } catch (err) {
        errorDisplay.innerHTML = '';
        errorDisplay.innerHTML = `⚠ ERROR: ${err.message}`;
    }
}); // upload file change event


function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        let fileredr = new FileReader();
        fileredr.onload = () => resolve(fileredr.result);
        fileredr.onerror = () => reject(fileredr);
        fileredr.readAsArrayBuffer(file);
    });
}


// draw a data table
function renderDatatable(resultset, tableRecordsEle) {
    try {
        tableRecordsEle.innerHTML = '';

        let tableHtmlStr = '';
        tableHtmlStr = `<table class="table table-striped table-condensed small table-bordered">
                            <thead>
                                <tr><th>${resultset[0]['columns'].join('</th><th>')}</th></tr>
                            </thead>
                            <tbody>`
        let tableValues = resultset[0]['values'];
        for (let v in tableValues) {
            tableHtmlStr += `<tr><td>${tableValues[v].join('</td><td>')}</td></tr>`;
        }
        tableHtmlStr += '</tbody></table>';

        tableRecordsEle.innerHTML = tableHtmlStr;

        errorDisplay.innerHTML = '';

        return;
    } catch (err) {
        errorDisplay.innerHTML = err.message;
        return;
    }
}



document.getElementById('list_mitarbeiter').addEventListener('click', listMitarbeiter)

function listMitarbeiter() {
    if (!db) {
        errorDisplay.innerHTML = 'noch keine Datenbank geöffnet';
    } else {
        errorDisplay.innerHTML = '';
        let stmt = 'SELECT * FROM mitarbeiter';
        resultset = db.exec(stmt);
        renderDatatable(resultset, tableRecords);
    }
}



document.getElementById('import_html').addEventListener('change', importClinicPlanner)

function importClinicPlanner() {
    let files = this.files;

    if (files.length === 0) {
        errorDisplay.innerHTML = 'keine Datei ausgewählt';
        return;
    }

    errorDisplay.innerHTML = '';

    let reader = new FileReader();
    reader.readAsText(files[0], 'ISO-8859-1');

    reader.onload = function (event) {

        let parser = new DOMParser();
        let clinicPlan = parser.parseFromString(event.target.result, "text/html");

        try {
            let clinicPlanTable = clinicPlan.getElementsByTagName('table')[0];

            // start reading on table row x
            const CLINICPLAN_ROW_START = 2;
            // skip every x lines
            const CLINICPLAN_ROW_OFFSET = 4;
            // start reading on table col x
            const CLINICPLAN_COL_START = 4;

            let dienstplan = [];

            // get date from upper left corner of the table
            let clinicPlanDate = clinicPlanTable.rows[0].cells[0].innerText.trim();
            // format date to YYYY-MM-
            clinicPlanDate = `${clinicPlanDate.slice(-4)}-${clinicPlanDate.substring(3, 5)}-`;

            // console.log("Anz. Mitarbeiter: " + (table.rows.length-ClinicPlanRowStart)/ClinicPlanRowOffset);

            // iterate over staff
            for (let i = CLINICPLAN_ROW_START, row; row = clinicPlanTable.rows[i]; i += CLINICPLAN_ROW_OFFSET) {

                let clinicPlanName = row.cells[0].innerText.trim(); // row = table.rows[i]
                let clinicPlanFirstname = clinicPlanTable.rows[i + 1].cells[0].innerText.trim();
                let clinicPlanPosition = clinicPlanTable.rows[i + 2].cells[0].innerText.trim().substring(0, 2); // OA, FA, As

                //console.log(clinicPlanName + ", " + clinicPlanFirstname); // log processed name
                for (let j = CLINICPLAN_COL_START, cell; cell = row.cells[j]; j++) {

                    // get dienstIst from row below 
                    let dienstIst = clinicPlanTable.rows[i + 1].cells[j].innerText.trim();
                    // overwrite dienst to dienstIst if not empty
                    let dienst = (dienstIst === "") ? cell.innerText.trim() : dienstIst;

                    if (!(dienst === "")) {
                        // add entry to dienstplan
                        dienstplan.push(
                            {
                                datum: clinicPlanDate + (`00${j + 1 - CLINICPLAN_COL_START}`).slice(-2),
                                vorname: clinicPlanFirstname,
                                nachname: clinicPlanName,
                                dienst: dienst,
                                position: clinicPlanPosition
                            }
                        );

                        console.log(dienstplan.slice(-1)[0]); // log last entry
                    }
                }


            }
        } catch (err) {
            errorDisplay.innerHTML = `beim Laden des ClinicPlanners ist ein Fehler aufgetreten: ${err.message}`;
            return;
        }

        // console.log("Anzahl Dienste: " + dienstplan.length) // number of entrys
    };

}