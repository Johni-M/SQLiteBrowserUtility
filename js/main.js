if (!window.FileReader) {
    errorDisplay.innerHTML = '⛔ WARNING: Your browser does not support HTML5 \'FileReader\' function required to open a file.';
    //return;
}

// draw a data table
function renderDatatable(resultset, tableRecordsEle) {
    try {
        tableRecordsEle.innerHTML = '';

        let tableHtmlStr = '';
        tableHtmlStr += '<table class="table table-striped table-condensed small table-bordered">';
        tableHtmlStr += '<thead>';
        tableHtmlStr += '<tr><th></th><th>' + resultset[0]['columns'].join('</th><th>') + '</th></tr>';
        tableHtmlStr += '</thead>';
        tableHtmlStr += '<tbody>';
        let tableValues = resultset[0]['values'];
        for (let v in tableValues) {
            tableHtmlStr += '<tr><th>' + (parseInt(v) + 1) + '</th><td>' + tableValues[v].join('</td><td>') + '</td></tr>';
        }
        tableHtmlStr += '</tbody>';
        tableHtmlStr += '</table>';
        tableHtmlStr += '</div>';
        tableRecordsEle.innerHTML = tableHtmlStr;

        errorDisplay.innerHTML = '';

        return;
    } catch (err) {
        throw new Error(err.message);
    }
}


function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        let fileredr = new FileReader();
        fileredr.onload = () => resolve(fileredr.result);
        fileredr.onerror = () => reject(fileredr);
        fileredr.readAsArrayBuffer(file);
    });
}


// ---- upload ----
var openDatabase = document.getElementById('open_database');

// the database
var db = null;

// SQL query
var stmt = '';
// SQL query result
var resultset = [];

var tableRecords = document.getElementById('tableRecords');

openDatabase.addEventListener('change', async (ev) => {
    errorDisplay.innerHTML = '';

    let file = ev.currentTarget.files[0];
    if (!file) return;

    try {

        let arrayBuffer = await readFileAsArrayBuffer(file);
        let uInt8Array = new Uint8Array(arrayBuffer);
        db = new SQL.Database(uInt8Array);


        // render datatable records
        stmt = 'SELECT * FROM sqlite_master';
        resultset = db.exec(stmt);
        renderDatatable(resultset, tableRecords);


    } catch (err) {
        errorDisplay.innerHTML = '';
        errorDisplay.innerHTML = `⚠ ERROR: ${err.message}`;
    }
}); // upload file change event


document.getElementById('import_html').addEventListener('change', importClinicPlanner)

function importClinicPlanner() {
    let files = this.files;
    if (files.length === 0) {
        console.log('No file is selected');
        return;
    }

    let reader = new FileReader();
    reader.readAsText(files[0], 'ISO-8859-1');

    reader.onload = function (event) {

        let parser = new DOMParser();
        let clinicPlan = parser.parseFromString(event.target.result, "text/html");


        let table = clinicPlan.getElementsByTagName('table')[0];

        // start reading on table row x
        const CLINICPLAN_ROW_START = 2;
        // skip every x lines
        const CLINICPLAN_ROW_OFFSET = 4;
        // start reading on table col x
        const CLINICPLAN_COL_START = 4;

        let clinicPlanName = "";
        let clinicPlanFirstname = "";

        let dienstplan = [];

        // console.log("Anz. Mitarbeiter: " + (table.rows.length-ClinicPlanRowStart)/ClinicPlanRowOffset);

        // get date from upper left corner of the table
        let clinicPlanDate = table.rows[0].cells[0].innerText.trim();
        // format date to YYYY-MM-
        clinicPlanDate = clinicPlanDate.slice(-4) + "-" + clinicPlanDate.slice(3, 5) + "-";


        let dienst = "";
        let dienstIst = "";

        // iterate over staff
        for (let i = CLINICPLAN_ROW_START, row; row = table.rows[i]; i += CLINICPLAN_ROW_OFFSET) {


            clinicPlanName = row.cells[0].innerText.trim();
            clinicPlanFirstname = table.rows[i + 1].cells[0].innerText.trim();

            //console.log(clinicPlanName + ", " + clinicPlanFirstname); // log processed name


            for (let j = CLINICPLAN_COL_START, cell; cell = row.cells[j]; j++) {

                // get dienstIst from row below 
                dienstIst = table.rows[i + 1].cells[j].innerText.trim();
                // overwrite dienst to dienstIst if not empty
                dienst = (dienstIst === "") ? cell.innerText.trim() : dienstIst;

                if (!(dienst === "")) {
                    dienstplan.push(
                        {
                            datum: clinicPlanDate + ("00" + (j + 1 - CLINICPLAN_COL_START)).slice(-2), // get two-digits with leading zero
                            vorname: clinicPlanFirstname,
                            nachname: clinicPlanName,
                            dienst: dienst,
                        }
                    );

                    console.log(dienstplan.slice(-1)[0]); // log last entry
                }
            }


        }

        // console.log("Anzahl Dienste: " + dienstplan.length) // number of entrys

    };

}