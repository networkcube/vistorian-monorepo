import * as storage from './storage';
import * as vistorian from './vistorian';
import * as utils from './utils';

import * as datamanager from 'vistorian-core/src/datamanager';
import * as main from 'vistorian-core/src/main';

var DATA_TABLE_MAX_LENGTH = 200;

var files = document.getElementById('files');

if (files)
    files.addEventListener('change', getFileInfos, false);

var nodeTableUpload = document.getElementById('nodeTableUpload');

if (nodeTableUpload)
    nodeTableUpload.addEventListener('change', uploadNodeTable, false);

var linkTableUpload = document.getElementById('linkTableUpload');

if (linkTableUpload)
    linkTableUpload.addEventListener('change', uploadLinkTable, false);

var SESSION_NAME = utils.getUrlVars()['session'];
storage.saveSessionId(SESSION_NAME); // save id for later retrieve

var tables = storage.getUserTables(SESSION_NAME);

// user's currently selected network. All visualizations will visualize this network
export var currentNetwork: vistorian.Network;

// visualizations among which the user can chose
// format: [shown name, codename]
var visualizations = [
    ['Node Link', 'nodelink'],
    ['Adjacency Matrix', 'matrix'],
    ['Time Arcs', 'dynamicego'],
    ['Map', 'map'],
]


var messages: string[] = [];


init()

export function init() {

    loadVisualizationList()

    loadNetworkList()

    loadTableList()

    var networkids = storage.getNetworkIds(SESSION_NAME);
    if (networkids.length > 0)
        showNetwork(networkids[0])

}

// loads the list of available visualizations and displays them on the left
export function loadVisualizationList() {
    // create visualization links
    visualizations.forEach(function (v) {
        $('#visualizationList')
            .append('<li class="visLink" title="Show ' + v[0] + ' visualization.">\
                        <button onclick="window.exports.networkcube.dataview.loadVisualization(\'' + v[1] + '\')" class="visbutton hastooltip">\
                            <img src="../static/figures/' + v[1] + '.png" class="visicon"/>\
                            <p>' + v[0] + '</p>\
                        </button>\
                    </li>')
    })
    $('#visualizationList')
        .append('<li class="visLink" title="Show matrix and node-link split-view.">\
            <button onclick="window.exports.networkcube.dataview.loadVisualization(\'mat-nl\')" class="visbutton hastooltip">\
            <img src="../static/figures/nl+mat.png" class="visicon"/><p>Matrix + Node Link</p>\
        </button></li>')
    $('#visualizationList')
        .append('<li class="visLink" title="Show all visualizations.">\
        <button onclick="window.exports.networkcube.dataview.loadVisualization(\'tileview\')" class="visbutton hastooltip">\
        <img src="../static/figures/all.png" class="visicon"/><p>All</p>\
        </button></li>')
}



// loads the list of tables in this session and displays them on the left
export function loadTableList() {
    $('#tableList').empty()
    var tableNames = storage.getTableNames(SESSION_NAME)
    tableNames.forEach(t => {
        var shownName = t;
        if (t.length > 30)
            shownName = t.substring(0, 30) + '..';
        $('#tableList').append('<li>\
            <a onclick="showSingleTable(\'' + t + '\')"  class="underlined">' + shownName + '.csv</a>\
            <img class="controlIcon" title="Delete this table." src="../static/logos/delete.png" onclick="removeTable(\''+ t + '\')"/>\
        </li>')
    })
}

// loads the list of networks for this session and displays them on the left
export function loadNetworkList() {

    $('#networkList').empty()
    var networkNames = storage.getNetworkIds(SESSION_NAME)
    var network: vistorian.Network;
    networkNames.forEach((t: any) => {
        network = storage.getNetwork(t, SESSION_NAME);
        $('#networkList').append('\
            <li>\
                <a onclick="window.exports.networkcube.dataview.showNetwork(\'' + network.id + '\')"  class="underlined">' + network.name + '</a>\
                <img class="controlIcon" title="Delete this network." src="../static/logos/delete.png" onclick="removeNetwork(\''+ network.id + '\')"/>\
                <img class="controlIcon" title="Download this network in .vistorian format." src="../static/logos/download.png" onclick="exportNetwork(\''+ network.id + '\')"/>\
            </li>')
    })
}

// VISUALIZATIONS

// creates a new visualization of the passed type
export function loadVisualization(visType: any) {
    window.open(visType + '.html?session=' + SESSION_NAME + '&datasetName=' + currentNetwork.name);
}

// CREATE NETWORK //

export function createNetwork() {

    var networkIds = storage.getNetworkIds(SESSION_NAME);
    var id = new Date().getTime();

    currentNetwork = new vistorian.Network(id);
    currentNetwork.name = 'Network-' + currentNetwork.id;
    currentNetwork.directed = false;
    storage.saveNetwork(currentNetwork, SESSION_NAME);
    showNetwork(currentNetwork.id);

    loadNetworkList();
}


export function setNodeTable(list: any) {
    var tableName = list.value;
    if (tableName != '---') {
        var table: vistorian.VTable = storage.getUserTable(tableName, SESSION_NAME);
        currentNetwork.userNodeTable = table;
        showTable(table, '#nodeTableDiv', false, currentNetwork.userNodeSchema)
    } else {
        unshowTable('#nodeTableDiv');
        currentNetwork.userNodeTable = undefined;
    }
    updateNetworkStatusIndication();
}

export function setLinkTable(list: any) {
    var tableName = list.value;
    if (tableName != '---') {
        var table: vistorian.VTable = storage.getUserTable(tableName, SESSION_NAME);
        currentNetwork.userLinkTable = table;
        showTable(table, '#linkTableDiv', false, currentNetwork.userLinkSchema);
    } else {
        unshowTable('#linkTableDiv');
        currentNetwork.userLinkTable = undefined;
    }
    updateNetworkStatusIndication();
    saveCurrentNetwork(false);
}

export function setLocationTable(list: any) {
    var tableName = list.value;
    if (tableName != '---') {
        var table: vistorian.VTable = storage.getUserTable(tableName, SESSION_NAME);
        currentNetwork.userLocationTable = table;
        currentNetwork.userLocationSchema = new datamanager.LocationSchema(0, 1, 2, 3, 4);
        showTable(table, '#locationTableDiv', true, currentNetwork.userLocationSchema);
    } else {
        unshowTable('#locationTableDiv');
        currentNetwork.userLocationTable = undefined;
    }
}


// saves/updates and normalizes current network.
export function saveCurrentNetwork(failSilently: boolean) {

    saveCellChanges();

    currentNetwork.name = $('#networknameInput').val();

    if (currentNetwork.userNodeSchema)
        if (currentNetwork.userNodeSchema.time != -1) {
            currentNetwork.timeFormat = $('#timeFormatInput_' + currentNetwork.userNodeSchema.name).val()
        }

    if (currentNetwork.userLinkSchema)
        if (currentNetwork.userLinkSchema.time != -1) {
            currentNetwork.timeFormat = $('#timeFormatInput_' + currentNetwork.userLinkSchema.name).val()
        }

    // check dates if apply
    checkTimeFormatting(currentNetwork);

    storage.saveNetwork(currentNetwork, SESSION_NAME);

    if (!currentNetwork.userNodeTable && !currentNetwork.userLinkTable) {
        if (!failSilently)
            showMessage("Cannot save without a Node table or a Link Table", 2000);
        return;
    }

    var dataset: datamanager.DataSet | undefined = vistorian.importIntoNetworkcube(currentNetwork, SESSION_NAME, failSilently)

    updateNetworkStatusIndication();

    var {normalizedLocationSchema, normalizedLocationTable, locationName, locationLabels} = vistorian.createAndNormaliseLocationTable(currentNetwork)

    if (!currentNetwork.userLocationTable && normalizedLocationTable.length > 2) {
        currentNetwork.userLocationTable = new vistorian.VTable('userLocationTable', normalizedLocationTable);
        // set header
        currentNetwork.userLocationTable.data.splice(0, 0, ['Id', 'User Name', 'Geoname', 'Longitude', 'Latitude'])
        currentNetwork.userLocationSchema = normalizedLocationSchema;
        storage.saveUserTable(currentNetwork.userLocationTable, SESSION_NAME);
        showTable(currentNetwork.userLocationTable, '#locationTableDiv', true, currentNetwork.userLocationSchema)
        $('#locationtableSelect')
            .append('<option value="userLocationTable">User Location Table</option>')
        $('#locationtableSelect').val('userLocationTable');

        loadTableList();
        storage.saveNetwork(currentNetwork, SESSION_NAME);
    }


    loadNetworkList();
}

export function deleteCurrentNetwork() {
    // removes the network from the vistorian front-ed
    storage.deleteNetwork(currentNetwork, SESSION_NAME);

    // deletes the network from the networkcube
    main.deleteData(currentNetwork.name);

    unshowNetwork();
    loadNetworkList();
}


export function showNetwork(networkId: number) {

    unshowNetwork();
    currentNetwork = storage.getNetwork(networkId.toString(), SESSION_NAME);

    if (currentNetwork == null)
        return;

    // unshow individual tables
    $('#individualTables').css('display', 'none');
    $('#networkTables').css('display', 'inline');

    // set network name
    $('#networknameInput').val(currentNetwork.name);

    // get all tables for this user so that he can select those 
    // he wants to create his network from.
    var tables = storage.getUserTables(SESSION_NAME)

    $('#nodetableSelect').append('<option class="tableSelection">---</option>')
    $('#linktableSelect').append('<option class="tableSelection">---</option>')
    $('#locationtableSelect').append('<option class="tableSelection">---</option>')

    $('#nodeTableContainer').css('display', 'inline')
    $('#linkTableContainer').css('display', 'inline')


    if (currentNetwork.networkConfig.indexOf('node') > -1) {
        $('#linkTableContainer').css('display', 'none')
    }
    if (currentNetwork.networkConfig.indexOf('link') > -1) {
        $('#nodeTableContainer').css('display', 'none')
    }
    if (currentNetwork.networkConfig == undefined) {
        $('#linkTableContainer').css('display', 'none')
        $('#nodeTableContainer').css('display', 'none')
    }


    tables.forEach(t => {
        $('#nodetableSelect')
            .append('<option value="' + t.name + '">' + t.name + '</option>')
        $('#linktableSelect')
            .append('<option value="' + t.name + '">' + t.name + '</option>')
        $('#locationtableSelect')
            .append('<option value="' + t.name + '">' + t.name + '</option>')
    });

    // if this network already has tables, show them
    if (currentNetwork.userNodeTable) {
        showTable(currentNetwork.userNodeTable, '#nodeTableDiv', false, currentNetwork.userNodeSchema);
        $('#nodetableSelect').val(currentNetwork.userNodeTable.name);
    }
    if (currentNetwork.userLinkTable) {
        showTable(currentNetwork.userLinkTable, '#linkTableDiv', false, currentNetwork.userLinkSchema);
        $('#linktableSelect').val(currentNetwork.userLinkTable.name);
    }
    if (currentNetwork.userLocationTable) {
        showTable(currentNetwork.userLocationTable, '#locationTableDiv', true, currentNetwork.userLocationSchema);
        $('#locationtableSelect').val(currentNetwork.userLocationTable.name);
    }


    $('#tileViewLink').attr('href', 'sites/tileview.html?session=' + SESSION_NAME + '&datasetName=' + currentNetwork.name.split(' ').join('___'))
    $('#mat-nlViewLink').attr('href', 'sites/mat-nl.html?session=' + SESSION_NAME + '&datasetName=' + currentNetwork.name.split(' ').join('___'))

    updateNetworkStatusIndication()

}

export function updateNetworkStatusIndication() {
    if (currentNetwork.ready) {
        $('#networkStatus')
            .text('Ready for visualization. Select a visualization from the menu on the top.')
            .css('color', '#fff')
            .css('background', '#2b0')
    }else if("userNodeTable" in currentNetwork && currentNetwork.userNodeTable && currentNetwork.userNodeTable.data.length == 1){
        $('#networkStatus')
            .text('Network not ready for visualization. Uploaded node table is empty.')
            .css('background', '#f63')
            .css('color', '#fff')
    }else if("userLinkTable" in currentNetwork && currentNetwork.userLinkTable && currentNetwork.userLinkTable.data.length == 1){
        $('#networkStatus')
            .text('Network not ready for visualization. Uploaded link table is empty.')
            .css('background', '#f63')
            .css('color', '#fff')
    } else {
        $('#networkStatus')
            .text('Network not ready for visualization. Table or Schema specifications missing.')
            .css('background', '#f63')
            .css('color', '#fff')
    }
}

// removes a displayed table from the DOM
export function unshowNetwork() {
    $('#nodetableSelect').empty();
    $('#linktableSelect').empty();
    $('#locationtableSelect').empty();
    unshowTable('#linkTableDiv');
    unshowTable('#nodeTableDiv');
    unshowTable('#locationTableDiv');
    $('#networkTables').css('display', 'none');
    $('#tileViewLink').attr('href', 'tileview.html?session=' + SESSION_NAME)
    $('#mat-nlViewLink').attr('href', 'mat-nl.html?session=' + SESSION_NAME)
}

// TABLES ///

// removes a displayed table from the DOM
export function unshowTable(elementName: string) {
    $(elementName).empty();
}

export function linkRowMouseOver(tableRow: any){
    var rowID = tableRow.id - 1; //indexed from 1 in showTable function
    var bc = new BroadcastChannel('row_hovered_over_link');
    bc.postMessage({"id": rowID});
}

export function nodeRowMouseOver(tableRow: any){
    var rowID = tableRow.id - 1; //indexed from 1 in showTable function
    var bc = new BroadcastChannel('row_hovered_over_node');
    bc.postMessage({"id": rowID});
}

var currentTable: vistorian.VTable;

export function showSingleTable(tableName: string) {
    currentTable = storage.getUserTable(tableName, SESSION_NAME);
    showTable(currentTable, '#individualTable', false);
    $('#individualTables').css('display', 'inline');
    $('#networkTables').css('display', 'none');
}

// displays a table into the DOM
// - if schema is passed, shows the schema on the dropdown
// - if user selects a time field, displays field to specify time format
var currentTableId: string;
var currentCell: any;
export function showTable(table: vistorian.VTable, elementName: string, isLocationTable: boolean, schema?: vistorian.VTableSchema) {
    var tHead, tBody;

    currentTable = table;

    $(elementName).empty();

    // table name
    var tableId = 'datatable_' + table.name;
    currentTableId = tableId
    $('#' + tableId).remove();

    var tableDiv = $('<div id="div_' + tableId + '"></div>');
    $(elementName).append(tableDiv);

    var tableMenu = $(elementName).prev()
    tableMenu.find('.tableMenuButton').remove();

    var data = table.data
    if (data.length > DATA_TABLE_MAX_LENGTH) {
        var info = $('<p>Table shows first 200 rows out of ' + data.length + ' rows in total.</p>');
        tableDiv.append(info);
    }

    // CREATE TABLE MENU    
    // export button
    var csvExportButton = $('<button class="tableMenuButton" onclick="window.exports.networkcube.dataview.exportCurrentTableCSV(\'' + table.name + '\')">Export as CSV</button>')
    tableMenu.append(csvExportButton);

    // create table

    var tab = $('<table id="' + tableId + '">');
    tableDiv.append(tab);
    tab.addClass('datatable stripe hover cell-border and order-column compact');

    // create head
    tHead = $('<thead>');
    tab.append(tHead);
    var tr = $('<tr></tr>').addClass('tableheader');
    tHead.append(tr);

    for (var c = 0; c < data[0].length; c++) {
        var td = $('<th></th>').addClass('th').attr('contenteditable', 'false');
        tr.append(td);
        td.html(data[0][c]);
    }

    tBody = $('<tbody></tbody>');
    tab.append(tBody);

    // Load data into html table
    for (var r = 1; r < Math.min(data.length, DATA_TABLE_MAX_LENGTH); r++) {

        if(elementName == "#nodeTableDiv"){
            tr = $('<tr></tr>').addClass('tablerow').attr({
                'onmouseover': 'window.exports.networkcube.dataview.nodeRowMouseOver(this)',
                'id': r
            });
        }
        else if(elementName == "#linkTableDiv"){
            tr = $('<tr></tr>').addClass('tablerow').attr({
                'onmouseover': 'window.exports.networkcube.dataview.linkRowMouseOver(this)',
                'id': r
            });
        }
        else{
            tr = $('<tr></tr>').addClass('tablerow');
        }

        tBody.append(tr);
        for (var c = 0; c < data[r].length; c++) {
            if(isLocationTable && data[0][c] == "Geoname"){
                td = $('<td></td>').attr('contenteditable', 'false');
            }else{
                td = $('<td></td>').attr('contenteditable', 'true');
            }
            td.data('row', r);
            td.data('column', c);
            td.data('table', table);


            tr.append(td);
            td.html(data[r][c])
            td.blur(function (this: any) { // ?????
                if ($(this).html().length == 0) {
                    $(this).addClass('emptyTableCell')
                } else {
                    $(this).removeClass('emptyTableCell')
                }
            });
            td.focusin(function (this: any) { //????? e
                saveCellChanges();
                currentCell = $(this);
            });
            td.focusout(function (e: any) {
                saveCellChanges();
            });
            if (typeof data[r][c] == 'string' && data[r][c].trim().length == 0)
                td.addClass('emptyTableCell')
        }
    }

    // turn table into an interactive jQuery table
    var dtable: any = ($('#' + tableId) as any).DataTable({
        "autoWidth": true
    });
    dtable.columns.adjust().draw();

    // Add schema selection to table, if a schema is passed
    if (schema) {

        // add schema header
        var schemaRow = $('<tr class="schemaRow"></tr>');
        $('#' + tableId + ' > thead').append(schemaRow);

        var select, cell, option, timeFormatInput;

        for (var i = 0; i < table.data[0].length; i++) {
            cell = $('<th class="schemaCell" id="schemaCell_' + schema.name + '_' + i + '"></th>')
            schemaRow.append(cell);
            select = $('<select class="schemaSelection" onchange="window.exports.networkcube.dataview.schemaSelectionChanged(this.value, ' + i + ' , \'' + schema.name + '\')"></select>');
            cell.append(select);
            select.append('<option>(Not visualized)</option>')
            for (var field in schema) {
                if (field == 'name'
                    || field == 'constructor'
                    || field == 'timeFormat')
                    continue;

                var fieldName = '';
                // Translate schema names in human readable text
                switch (field) {
                    case 'source': fieldName = 'Source Node'; break;
                    case 'target': fieldName = 'Target Node'; break;
                    case 'source_location': fieldName = 'Source Node Location'; break;
                    case 'target_location': fieldName = 'Target Node Location'; break;
                    case 'linkType': fieldName = 'Link Type'; break;
                    case 'location': fieldName = 'Node Location'; break;
                    case 'label': fieldName = 'Node'; break;
                    default:
                        fieldName = field;
                        fieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
                }


                if(field == 'directed'){
                    option = $('<option value='+field+' class=directionField style=display:block>' + fieldName + '</option>');
                }
                else if(field == 'source'){
                    option = $('<option value='+field+' class=sourceField>' + fieldName + '</option>');
                }
                else if(field == 'target'){
                    option = $('<option value='+field+' class=targetField>' + fieldName + '</option>');
                }
                else{
                    option = $('<option value='+field+'>' + fieldName + '</option>');
                }

                select.append(option);

                if (i == 0 && field == 'id') {
                    $(option).attr('selected', 'selected');
                    (schema as any)[field] = 0;
                }

                if ((schema as any)[field] == i) {
                    $(option).attr('selected', 'selected');
                    if (field == 'time') {
                        var val = '';
                        if (currentNetwork.hasOwnProperty('timeFormat')) {
                            val = "value='" + currentNetwork.timeFormat + "'";
                        }
                        timeFormatInput = $('<span class="nobr"><input title="Enter a date pattern" type="text" size="12" id="timeFormatInput_' + schema.name + '" value="DD/MM/YYYY" ' + val + ' onkeyup="timeFormatChanged()"></input><a href="http://momentjs.com/docs/#/parsing/string-format/" target="_blank" title="Details of the date pattern syntax"><img src="../static/logos/help.png" class="inlineicon"/></a></span>');
                        cell.append(timeFormatInput);
                    }
                }

                // check relations
                if (field == 'relation') {
                    for (var k = 0; k < (schema as any).relation.length; k++) {
                        if ((schema as any).relation[k] == i) {
                            $(option).attr('selected', 'selected');
                        }
                    }
                }
            }
        }
    }
}

export function timeFormatChanged() {
    if (currentNetwork.userNodeSchema)
        currentNetwork.timeFormat = $('#timeFormatInput_' + currentNetwork.userNodeSchema.name).val()
    saveCurrentNetwork(false);
}

export function deleteCurrentTable() {
    storage.deleteTable(currentTable, SESSION_NAME);
    $('#individualTables').css('display', 'none');
    loadTableList();
}

// called when the user assigns a schema in an table
export function schemaSelectionChanged(field: string, columnNumber: number, schemaName: string, parent: HTMLElement) {

    // reset schema:
    for (var field2 in (currentNetwork as any)[schemaName]) {
        if (field2 == 'relation' && (currentNetwork as any)[schemaName][field2].indexOf(columnNumber) > -1) {
            if (field == '(Not visualized)') {
                (currentNetwork as any)[schemaName][field2].splice((currentNetwork as any)[schemaName][field2].indexOf(columnNumber), 1);
            } else {
                var arr: any = (currentNetwork as any)[schemaName][field]
                    (currentNetwork as any)[schemaName][field2].slice(arr.indexOf(columnNumber), 0);
            }
        } else {
            if ((currentNetwork as any)[schemaName][field2] == columnNumber) {
                (currentNetwork as any)[schemaName][field2] = -1;
            }
        }
    }

    if (field == 'relation') {
        (currentNetwork as any)[schemaName][field].push(columnNumber);
    } else if (field != '---') {
        (currentNetwork as any)[schemaName][field] = columnNumber;
    }

    saveCurrentNetwork(false);
    showNetwork(currentNetwork.id)
}


export function checkTimeFormatting(network: vistorian.Network) {

    var corruptedNodeTimes: number[] = [];
    if (network.userNodeTable && network.userNodeTable && network.userNodeSchema && (network.userNodeSchema as any)['timeFormat']) {
        corruptedNodeTimes = vistorian.checkTime(
            network.userNodeTable,
            network.userNodeSchema['time'],
            (network.userNodeSchema as any)['timeFormat']);
    }

    var corruptedLinkTimes: number[] = [];
    if (network.userLinkTable && network.userLinkSchema && (network.userLinkSchema as any)['timeFormat']) {
        corruptedLinkTimes = vistorian.checkTime(
            network.userLinkTable,
            network.userLinkSchema['time'],
            (network.userLinkSchema as any)['timeFormat']);
    }

    return false;
}

export function removeRow(row: number) {

}


/// FILES


var filesToUpload: any[] = [];

export function getFileInfos(e: any) {
    filesToUpload = [];

    var files: File[] = e.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
        if (f.name.split('.')[1] != 'csv') {
            showMessage("Uploaded file is not a .csv file. Please chose another file.", 4000)
            return;
        } else {
            filesToUpload.push(f);
        }
    }

    uploadFiles(loadTableList);
}

//Checks if uploaded file ends in ".csv", returns boolean
function checkFileType(filesToUpload: any){
    if(!filesToUpload.length){
        return false;
    }
    var filename = filesToUpload[0].name;
    if(filename.substr(filename.length -4) != ".csv"){
        $('#networkStatus')
            .text('Incorrect format, file must be CSV.')
            .css('background', '#f63')
            .css('color', '#fff')
        return false;
    }
    return true
}

export function uploadNodeTable(e: any) {
    filesToUpload = [e.target.files[0]];
    if(checkFileType(filesToUpload)) {
        uploadFiles(() => {
            var tables = storage.getUserTables(SESSION_NAME)
            var lastTable = tables[tables.length - 1];

            $('#nodetableSelect').append('<option value="' + lastTable.name + '">' + lastTable.name + '</option>')
            $('#nodetableSelect').val(lastTable.name);

            setNodeTable({value: lastTable.name})

            if (currentNetwork.userNodeTable)
                showTable(currentNetwork.userNodeTable, '#nodeTableDiv', false, currentNetwork.userNodeSchema);

            saveCurrentNetwork(false);

            loadTableList();

        });
    }

}

export function uploadLinkTable(e: any) {
    filesToUpload = [e.target.files[0]];
    if(checkFileType(filesToUpload)) {
        uploadFiles(() => {
            var tables = storage.getUserTables(SESSION_NAME)
            var lastTable = tables[tables.length - 1];

            $('#linktableSelect').append('<option value="' + lastTable.name + '">' + lastTable.name + '</option>')
            $('#linktableSelect').val(lastTable.name);

            setLinkTable({value: lastTable.name})

            if (currentNetwork.userLinkTable)
                showTable(currentNetwork.userLinkTable, '#linkTableDiv', false, currentNetwork.userLinkSchema);

            saveCurrentNetwork(false);

            var element = document.getElementById('leaveCode');

            loadTableList();
        });
    }
}

export function uploadFiles(handler: Function) {
    vistorian.loadCSV(filesToUpload, () => {
        handler();
    }, SESSION_NAME);
}

export function exportCurrentTableCSV(tableName: string) {
    saveCellChanges();
    var table: vistorian.VTable | undefined = undefined;

    if (tableName) {
        if (currentNetwork.userLinkTable && currentNetwork.userLinkTable.name == tableName)
            table = currentNetwork.userLinkTable;
        else if (currentNetwork.userNodeTable && currentNetwork.userNodeTable.name == tableName)
            table = currentNetwork.userNodeTable;
        else if (currentNetwork.userLocationTable && currentNetwork.userLocationTable.name == tableName)
            table = currentNetwork.userLocationTable;
    }

    if (!table) {
        table = currentTable;
    }
    vistorian.exportTableCSV(table);
}

export function replaceCellContents(tableId: any) {
    var replace_pattern = $('#div_' + tableId + ' #replace_pattern').val();
    var replace_value = $('#div_' + tableId + ' #replace_value').val();
    var arr: any;

    if (tableId.startsWith('datatable_'))
        tableId = tableId.slice(10, tableId.length)
    var table: vistorian.VTable | undefined = storage.getUserTable(tableId, SESSION_NAME);
    if (table == undefined) {
        table = currentNetwork.userLocationTable;
    }
    if (table && table.data) {
        arr = table.data
    } else {
        arr = table;
    }

    var replaceCount = 0
    for (var i = 0; i < arr.length; i++) {
        for (var j = 0; j < arr[i].length; j++) {
            if (isNaN(arr[i][j])) {
                // for text
                if (arr[i][j].indexOf(replace_pattern) > -1) {
                    arr[i][j] = arr[i][j].replace(replace_pattern, replace_value).trim();
                    replaceCount++;
                }
            } else {
                // for numerals
                if (arr[i][j] == replace_pattern) {
                    arr[i][j] = replace_value;
                    replaceCount++;
                }
            }
        }
    }

    if (table)
        table.data = arr;

    saveCellChanges();
    saveCurrentNetwork(false);
    showMessage('Replaced ' + replaceCount + ' occurrences of ' + replace_pattern + ' with ' + replace_value + '.', 2000);
}

var directedCheckboxToggle = false;
export function directedCheckboxClick(){
    currentNetwork.directed = true;
    $("input[type=checkbox]").prop("checked", !directedCheckboxToggle);
    directedCheckboxToggle = !directedCheckboxToggle;

    var directionFields = document.getElementsByClassName('directionField') as HTMLCollectionOf<HTMLElement>;
    var sourceFields = document.getElementsByClassName('sourceField');
    var targetFields = document.getElementsByClassName('targetField');

    if(directedCheckboxToggle){
        currentNetwork.directed = true;
        for (var i = 0; i < directionFields.length; i ++) {
            directionFields[i].style.display = 'none';
        }
        for (var i = 0; i < sourceFields.length; i ++) {
            sourceFields[i].innerHTML = 'Source Node';
        }
        for (var i = 0; i < targetFields.length; i ++) {
            targetFields[i].innerHTML = 'Target Node';
        }
    }else{
        currentNetwork.directed = false;
        for (var i = 0; i < directionFields.length; i ++) {
            directionFields[i].style.display = 'block';
        }
        for (var i = 0; i < sourceFields.length; i ++) {
            sourceFields[i].innerHTML = 'Node 1';
        }
        for (var i = 0; i < targetFields.length; i ++) {
            targetFields[i].innerHTML = 'Node 2';
        }
    }
    saveCurrentNetwork(true);

}

/** Extracts locations from node and link tabe**/
export function extractLocations() {

    showMessage('Extracting locations...', false);

    if (currentNetwork.userLocationTable == undefined) {
        var tableName = currentNetwork.name.replace(/ /g, "_");
        currentNetwork.userLocationTable = new vistorian.VTable(tableName + '-locations', []);
        currentNetwork.userLocationSchema = new datamanager.LocationSchema(0, 1, 2, 3, 4);
        currentNetwork.userLocationTable.data.push(['Id', 'User Label', 'Geo Name', 'Longitude', 'Latitude']);

        // save table as a user's table 
        storage.saveUserTable(currentNetwork.userLocationTable, SESSION_NAME);
        tables = storage.getUserTables(SESSION_NAME);
    }

    var locationTable = currentNetwork.userLocationTable;
    var locationSchema = currentNetwork.userLocationSchema;

    // if location table is empty, add header as first column
    if (locationTable.data.length == 0) {
        var schemaStrings: string[] = [];
        locationTable.data.push(['Id', 'User Label', 'Geoname', 'Longitude', 'Latitude']);
    }
    var locationsFound: number = 0;

    var linkTable: any;
    // check link table
    if (currentNetwork.userLinkSchema)
        if (datamanager.isValidIndex(currentNetwork.userLinkSchema.location_source)) {
            if (currentNetwork.userLinkTable)
                linkTable = currentNetwork.userLinkTable.data;
            if (linkTable != undefined) {
                // check if location table exists
                for (var i = 1; i < linkTable.length; i++) {
                    // @ts-ignore
                    createLocationEntry(linkTable[i][currentNetwork.userLinkSchema.location_target], locationTable.data)
                }
            }
        }

    var nodeTable: any;
    // check node table for locations
    if (currentNetwork.userNodeSchema)
        if (datamanager.isValidIndex(currentNetwork.userNodeSchema.location)) {

            if (currentNetwork.userNodeTable)
                nodeTable = currentNetwork.userNodeTable.data;
            if (nodeTable != undefined) {
                for (var i = 1; i < nodeTable.length; i++) {
                    createLocationEntry(linkTable[i][currentNetwork.userNodeSchema.location], locationTable.data)
                }
            }
        }

    if (currentNetwork.userLinkSchema)
        if (datamanager.isValidIndex(currentNetwork.userLinkSchema.location_target)) {
            // check if location table exists
            if (linkTable != undefined) {
                // locationsFound = true;
                for (var i = 1; i < linkTable.length; i++) {
                    createLocationEntry(linkTable[i][currentNetwork.userLinkSchema.location_target], locationTable.data)
                }
            }
        }

    locationsFound = locationTable.data.length;

    loadTableList();
    storage.saveNetwork(currentNetwork, SESSION_NAME);


    saveCurrentNetwork(false);
    showNetwork(currentNetwork.id);

    if (locationsFound > 0)
        showMessage(locationsFound + ' locations found.', 2000);
    else {
        updateLocations();
    }
}

export function createLocationEntry(name: string, rows: any[]) {

    // check validity
    if (name == undefined
        || name.length == 0)
        return;

    // check if location entry exists already.     
    for (var i = 0; i < rows.length; i++) {
        if (rows[i][1].length == name.length
            && rows[i][1].indexOf(name) > -1)
            return;
    }

    rows.push([rows.length - 1, name, name, undefined, undefined]);
}

/** Updates long/lat for geonames field in the location table**/
export function updateLocations() {
    showMessage('Retrieving and updating location coordinates...', false);

    if (currentNetwork.userLocationTable)
        updateLocationTable(currentNetwork.userLocationTable, currentNetwork.userLocationSchema,
            function (nothingImportant: any) {
                saveCurrentNetwork(false);
                showNetwork(currentNetwork.id);
                showMessage('Locations updated successfully!', 2000);
            });
}

var msgBox;
export function showMessage(message: string, timeout: any) {
    if ($('.messageBox'))
        $('.messageBox').remove();

    msgBox = $('<div class="messageBox"></div>');
    msgBox.append('<div><p>' + message + '</p></div>');
    $('body').append(msgBox);
    msgBox.click(function () {
        $('.messageBox').remove();
    })

    if (timeout) {
        // Automatically disappear
        window.setTimeout(function () {
            $('.messageBox').fadeOut(1000);
        }, timeout);
    }

}

export function saveCellChanges() {
    if (currentCell == undefined)
        return;

    var selectedCell_row = currentCell.data('row'),
        selectedCell_col = currentCell.data('column'),
        data = currentCell.data('table').data,
        value;


    if (selectedCell_row != undefined && selectedCell_col != undefined) {
        value = currentCell.text().trim();
        data[selectedCell_row][selectedCell_col] = value;
    }
    currentCell = undefined;
}

export function clearCache() {
    unshowNetwork();
    localStorage.clear();
    location.reload()
}

export function removeNetwork(networkId: string) {
    currentNetwork = storage.getNetwork(networkId, SESSION_NAME);
    deleteCurrentNetwork();
}

export function removeTable(tableId: string) {
    var table = storage.getUserTable(tableId, SESSION_NAME);
    unshowTable('#individualTables')

    if (currentNetwork.userNodeTable != undefined
        && currentNetwork.userNodeTable.name == table.name) {
        currentNetwork.userNodeTable = undefined;
        currentNetwork.userNodeSchema = undefined;
        $('#nodetableSelect').val(0);
        $("#nodetableSelect option[value='" + table.name + "']").remove()
        $('#nodeTableDiv').empty()
    }

    if (currentNetwork.userLinkTable
        && currentNetwork.userLinkTable.name == table.name) {
        currentNetwork.userLinkTable = undefined;
        currentNetwork.userLinkSchema = undefined;
        $('#linktableSelect').val(0);
        $("#linktableSelect option[value='" + table.name + "']").remove()
        $('#linkTableDiv').empty()
    }

    if (currentNetwork.userLocationTable != undefined
        && currentNetwork.userLocationTable.name == table.name) {
        currentNetwork.userLocationTable = undefined;
        currentNetwork.userLinkSchema = undefined;
        $('#locationtableSelect').val(0);
        $("#locationtableSelect option[value='" + table.name + "']").remove()
        $('#locationTableDiv').empty()
    }

    storage.deleteTable(table, SESSION_NAME)
    loadTableList();
    saveCurrentNetwork(true);
}

export function exportNetwork(networkId: number) {
    vistorian.exportNetwork(storage.getNetwork(networkId.toString(), SESSION_NAME))
}

export function setNetworkConfig(string: string) {

    currentNetwork.networkConfig = string;

    storage.saveNetwork(currentNetwork, SESSION_NAME);
    loadNetworkList();

    showNetwork(currentNetwork.id)

}


// CHANGE FROM VISTORIAN.TS TO DATAVIEW.TS

export var requestTimer: any;
export var requestsRunning: number = 0;
export var fullGeoNames: any = [];

export function checkRequests(callBack: any, locationsFound: any) {
    if (requestsRunning == 0) {
        clearInterval(requestTimer);
        callBack(locationsFound);
    }
}

export function updateEntryToLocationTableOSM(index: number, geoname: string, locationTable: vistorian.VTable, locationSchema: datamanager.LocationSchema) {
    if(geoname) {
        geoname = geoname.trim();
        fullGeoNames.push(geoname);
        var xhr: any = $.ajax({
            url: "https://nominatim.openstreetmap.org/search",
            data: {format: "json", limit: "1", q: geoname.split(',')[0].trim()},
            dataType: 'json'
        })
            .done(function (data: any, text: any, XMLHttpRequest: any) {
                var entry: any;
                var length: any;
                var rowIndex: number = XMLHttpRequest.uniqueId + 1;
                var userLocationLabel: any = locationTable.data[rowIndex][locationSchema.label];
                if (data.length != 0) {
                    var validResults: any[] = [];
                    var result: any;
                    for (var i = 0; i < data.length; i++) {
                        entry = data[i];
                        if (entry == undefined)
                            continue;
                        if ('lon' in entry &&
                            'lat' in entry &&
                            typeof entry.lon === 'string' &&
                            typeof entry.lat === 'string') {
                            validResults.push(entry);
                        }
                    }
                    if (validResults.length == 0) {
                        locationTable.data[rowIndex] = [rowIndex - 1, userLocationLabel, geoname, undefined, undefined];
                        return;
                    }
                    locationTable.data[rowIndex] = [rowIndex - 1, userLocationLabel, geoname, validResults[0].lon, validResults[0].lat];
                } else {
                    if (geoname == '')
                        return;
                    locationTable.data[rowIndex] = [rowIndex - 1, userLocationLabel, geoname, undefined, undefined];
                }
            })
            .always(function () {
                requestsRunning--;
            });
        xhr['uniqueId'] = requestsRunning++;
    }else{
        requestsRunning++;
    }
}

export function updateLocationTable(userLocationTable: vistorian.VTable, locationSchema: datamanager.LocationSchema, callBack: Function) {
    saveCurrentNetwork(false);
    var data: any = userLocationTable.data;
    requestsRunning = 0;
    fullGeoNames = [];
    for (var i = 1; i < data.length; i++) {
        updateEntryToLocationTableOSM(i, data[i][locationSchema.geoname], userLocationTable, locationSchema);
    }
    // wait for all requests to be returned, until continue
    requestTimer = setInterval(function () {
        currentNetwork.userLocationTable = userLocationTable;
        checkRequests(callBack, [])
    }, 500);

}