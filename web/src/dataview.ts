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
    ['Matrix', 'matrix'],
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
        showNetworkTables(networkids[0])

}

// loads the list of available visualizations and displays them on the left
export function loadVisualizationList() 
{
    // create visualization links
    visualizations.forEach(function (v) {
        $('#visualizationList')
            .append('<li class="visLink" title="Show ' + v[0] + ' visualization.">\
                        <button onclick="window.exports.networkcube.dataview.loadVisualization(\'' + v[1] + '\');trace.event(\'vis_1\',\'data view\',\'Vis Creation Link Clicked\',\'' + v[1] + '\');" class="visbutton hastooltip">\
                            <img src="../static/figures/' + v[1] + '.png" class="visicon"/>\
                            <p>' + v[0] + '</p>\
                        </button>\
                    </li>')
    })
    $('#visualizationList')
        .append('<li class="visLink" title="Show matrix and node-link split-view.">\
            <button onclick="window.exports.networkcube.dataview.loadVisualization(\'mat-nl\');trace.event(\'vis_1\',\'data view\',\'Vis Creation Link Clicked\',\'Matrix & Node Link\');" class="visbutton hastooltip">\
            <img src="../static/figures/nl+mat.png" class="visicon"/><p>Matrix + Node Link</p>\
        </button></li>')
    // $('#visualizationList')
    //     .append('<li class="visLink" title="Show all visualizations.">\
    //     <button onclick="window.exports.networkcube.dataview.loadVisualization(\'tileview\');trace.event(\'vis_1\',\'data view\',\'Vis Creation Link Clicked\',\'Tile View Link\');" class="visbutton hastooltip">\
    //     <img src="../static/figures/all.png" class="visicon"/><p>All</p>\
    //     </button></li>')
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
            <img class="controlIcon" title="Delete this table." src="../static/logos/delete.png" onclick="deleteCurrentNetworkBookmarks();window.exports.networkcube.dataview.removeTable(\''+ t + '\');trace.event(\'dat_4\',\'data view\',\'selected table\',\'deleted\')"/>\
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
        var networkDisplayName = network.name;
        if (networkDisplayName.length > 18){
            networkDisplayName = networkDisplayName.slice(0,18) + '...';
        }

        $('#networkList').append('\
            <li>\
                <a onclick="window.exports.networkcube.dataview.showNetworkTables(\'' + network.id + '\')"  class="underlined">' + networkDisplayName+  '</a>\
                <img class="controlIcon" title="Delete this network." src="../static/logos/delete.png" onclick="window.exports.networkcube.dataview.removeNetwork(\''+ network.id + '\');trace.event(\'dat_4\',\'data view\',\'selected network\',\'deleted\')"/>\
                <img class="controlIcon" title="Download this network in .vistorian format." src="../static/logos/download.png" onclick="window.exports.networkcube.dataview.exportNetwork(\''+ network.id + '\');trace.event(\'dat_7\',\'data view\',\'selected network\',\'downloaded\')"/>\
            </li>')
    })
}

// VISUALIZATIONS

// creates a new visualization of the passed type
export function loadVisualization(visType: any) 
{
    saveCurrentNetwork(false);
    window.open(visType + '.html?session=' + SESSION_NAME + '&datasetName=' + currentNetwork.name);
}

// CREATE NETWORK //

export function createNetwork() {

    var networkIds = storage.getNetworkIds(SESSION_NAME);
    var id = new Date().getTime();

    currentNetwork = new vistorian.Network(id);
    currentNetwork.name = 'Network-' + currentNetwork.id;
    currentNetwork.directed = true;
    storage.saveNetwork(currentNetwork, SESSION_NAME);
    showNetworkTables(currentNetwork.id);

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
// does no extract or update locations
export function saveCurrentNetwork(failSilently: boolean, saveButton?:boolean) 
{
    console.log('SAVE NETWORK')
    saveCurrentTableCellEdits();

    // update network name from input field
    currentNetwork.name = $('#networknameInput').val();

    // update time format, if any
    // only one timeformat is currently allowd, either on the node or on the link table
    if (currentNetwork.userNodeSchema)
    {
        if (currentNetwork.userNodeSchema.time != -1) {
            currentNetwork.timeFormat = $('#timeFormatInput_' + currentNetwork.userNodeSchema.name).val()
        }
    }
    if (currentNetwork.userLinkSchema)
    {
        if (currentNetwork.userLinkSchema.time != -1) {
            currentNetwork.timeFormat = $('#timeFormatInput_' + currentNetwork.userLinkSchema.name).val()
        }
    }

    // check dates if apply
    // function currently not used?
    checkTimeFormatting(currentNetwork);

    
    if (!currentNetwork.userNodeTable && !currentNetwork.userLinkTable) 
    {
        if (!failSilently)
        showMessage("Cannot save without a Node table or a Link Table", 2000);
        return;
    }
    
    var dataset: datamanager.DataSet | undefined = vistorian.importIntoNetworkcube(currentNetwork, SESSION_NAME, failSilently)
    
    updateNetworkStatusIndication();
    
    // var {normalizedLocationSchema, normalizedLocationTable, locationName, locationLabels} = vistorian.createAndNormaliseLocationTable(currentNetwork)
    // ben: trying this old function
    // extractLocations();
    // updateLocationCoordinates();

    // // >1 ?
    // if (!currentNetwork.userLocationTable && normalizedLocationTable.length > 2) 
    // {
    //     currentNetwork.userLocationTable = new vistorian.VTable('userLocationTable', normalizedLocationTable);
    //     // set header
    //     currentNetwork.userLocationTable.data.splice(0, 0, ['Id', 'User Name', 'Geoname', 'Longitude', 'Latitude'])
    //     currentNetwork.userLocationSchema = normalizedLocationSchema;
    //     storage.saveUserTable(currentNetwork.userLocationTable, SESSION_NAME);
    //     showTable(currentNetwork.userLocationTable, '#locationTableDiv', true, currentNetwork.userLocationSchema)
    //     $('#locationtableSelect')
    //         .append('<option value="userLocationTable">User Location Table</option>')
    //     $('#locationtableSelect').val('userLocationTable');
        
    //     loadTableList();
    //     storage.saveNetwork(currentNetwork, SESSION_NAME);        
    // }

    // save network to storage
    storage.saveNetwork(currentNetwork, SESSION_NAME);
    
    if (saveButton){
        showMessage("Network changes saved successfully", 1500);
    }
    
    loadNetworkList();
}

export function deleteCurrentNetwork() {
    // removes the network from the vistorian front-ed
    storage.deleteNetwork(currentNetwork, SESSION_NAME);

    // deletes the network from the networkcube
    main.deleteData(currentNetwork.name);

    unshowNetworkTables();
    loadNetworkList();
}

// Shows all tables for this network
//
export function showNetworkTables(networkId: number) {

    unshowNetworkTables();
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
            .text('Network ready for visualization. Select a visualization from the menu on the top.')
            .css('color', '#fff')
            .css('background', '#6b6')
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
export function unshowNetworkTables() {
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


/////////////
// TABLES ///
/////////////

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

    console.log('SHOW TABLE',elementName, schema )

    currentTable = table;

    $(elementName).empty();

    // table name
    var tableId = 'datatable_' + table.name;
    currentTableId = tableId
    $('#' + tableId).remove();

    var tableDiv = $('<div id="div_' + tableId + '"></div>');
    $(elementName).append(tableDiv);

    var tableMenu = $(elementName).prev()
    tableMenu.find('.exportButton').remove();

    var data = table.data
    if (data.length > DATA_TABLE_MAX_LENGTH) {
        var info = $('<p>Table shows first 200 rows out of ' + data.length + ' rows in total.</p>');
        tableDiv.append(info);
    }

    // CREATE TABLE MENU    
    // export button
    var csvExportButton = $('<button class="menuButton exportButton" onclick="window.exports.networkcube.dataview.exportCurrentTableCSV(\'' + table.name + '\');trace.event(\'dat_8\', \'data view\', \'export as CSV file\',\'' + elementName +'\' )">Export Table as CSV</button>')
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
        var td = $('<th></th>').addClass('th').attr('contenteditable', 'false').attr('onclick','trace.event(\'dat_16\',\'data view\',\'column\',\'Sorted\')');
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
        for (var c = 0; c < data[r].length; c++) 
        {
            if(isLocationTable && data[0][c] == "User Name")
            {
                td = $('<td></td>').attr('contenteditable', 'false');
            }else{
                td = $('<td onchange="trace.event(\'dat_10\', \'data view\',\'' + elementName +' table \', \'cell edited\' )"></td>').attr('contenteditable', 'true');
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
                saveCurrentTableCellEdits();
                currentCell = $(this);
            });
            td.focusout(function (e: any) {
                saveCurrentTableCellEdits();
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

        for (var i = 0; i < table.data[0].length; i++) 
        {

            cell = $('<th class="schemaCell" id="schemaCell_' + schema.name + '_' + i + '"></th>')
            schemaRow.append(cell);
            select = $('<select class="schemaSelection" onchange="window.exports.networkcube.dataview.schemaSelectionChanged(this.value, ' + i + ' , \'' + schema.name + '\');trace.event(\'dat_11\',\'data view\',\'Column Data Type Specified\', this.value);"></select>');
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
                    case 'location_source': fieldName = 'Location Source Node'; break;
                    case 'location_target': fieldName = 'Location Target Node'; break;
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
                    option = $('<option value='+field+' class='+field+'>' + fieldName + '</option>');
                }

                select.append(option);

                if (i == 0 && field == 'id') {
                    $(option).attr('selected', 'selected');
                    cell.addClass('schemaCellSet');
                    (schema as any)[field] = 0;
                }
                
                if ((schema as any)[field] == i) 
                {
                    $(option).attr('selected', 'selected');
                    cell.addClass('schemaCellSet');
                
                    if (field == 'time') {
                        var val = '';
                        if (currentNetwork.hasOwnProperty('timeFormat') 
                            && currentNetwork.timeFormat != undefined
                            && currentNetwork.timeFormat != 'undefined') 
                            {
                            val = "value='" + currentNetwork.timeFormat + "'";
                        }else{
                            val = 'value=""';
                        }
            
                        timeFormatInput = $('<span class="nobr"><input title="Enter a date pattern" type="text" size="12" id="timeFormatInput_' + schema.name + '" ' + val + '></input><a href="http://momentjs.com/docs/#/parsing/string-format/" target="_blank" title="Details of the date pattern syntax"><img src="../static/logos/help.png" class="inlineicon"/></a></span>');
                        cell.append(timeFormatInput);
                    }
                }

                // check relations
                if (field == 'relation') {
                    for (var k = 0; k < (schema as any).relation.length; k++) {
                        if ((schema as any).relation[k] == i) {
                            $(option).attr('selected', 'selected');
                            cell.addClass('schemaCellSet')
                        }
                    }
                }
            }
        }
    }
}

export function deleteCurrentTable(){
    storage.deleteTable(currentTable, SESSION_NAME);
    $('#individualTables').css('display', 'none');
    loadTableList();
}


// Called when the user changes a schema assignmnet in one of the tables
//
export function schemaSelectionChanged(field: string, columnNumber: number, schemaName: string, parent: HTMLElement) 
{
    console.log('SCHEMA-SELECTION-CHANGED', field,schemaName)

    // console.log('field', field)
    // if(field != '(Not visualized)')
    // {
    //     console.log('adding class')
    //     $('#schemaCell_' + schemaName + '_' + columnNumber).addClass('schemaCellSet')
    // }

    // reset schema:
    for (var field2 in (currentNetwork as any)[schemaName]) 
    {
        if (field2 == 'relation' && (currentNetwork as any)[schemaName][field2].indexOf(columnNumber) > -1) 
        {
            if (field == '(Not visualized)') 
            {
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

    if (field == 'relation') 
    {
        (currentNetwork as any)[schemaName][field].push(columnNumber);
    } else if (field != '---') {
        (currentNetwork as any)[schemaName][field] = columnNumber;
    }

    // if the user has selected a location in the schema, extract and update locations
    if(field == 'location_source' 
    || field == 'location_target')
    {
        extractLocations()
        updateLocationCoordinatesWrapper()
    }else{
        saveCurrentNetwork(false);
        showNetworkTables(currentNetwork.id)
    }

}

// gets a list of entries that do not match the given time format
// results currently not used, but useful in future
export function checkTimeFormatting(network: vistorian.Network) {

    var corruptedNodeTimes: number[] = [];
    if (network.userNodeTable 
        && network.userNodeSchema 
        && (network.userNodeSchema as any)['timeFormat']) {
        corruptedNodeTimes = vistorian.checkTime(
            network.userNodeTable,
            network.userNodeSchema['time'],
            (network.userNodeSchema as any)['timeFormat']);
    }

    var corruptedLinkTimes: number[] = [];
    if (network.userLinkTable 
        && network.userLinkSchema 
        && (network.userLinkSchema as any)['timeFormat']) {
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
    saveCurrentTableCellEdits();
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

    saveCurrentTableCellEdits();
    saveCurrentNetwork(false);
    showMessage('Replaced ' + replaceCount + ' occurrences of ' + replace_pattern + ' with ' + replace_value + '.', 2000);
}

var directedCheckboxToggle = true;
export function directedCheckboxClick()
{
    directedCheckboxToggle = !directedCheckboxToggle;

    $("#directedNetworkCheckBox").prop("checked", directedCheckboxToggle);    

    currentNetwork.directed = directedCheckboxToggle;

    var directionFields = document.getElementsByClassName('directionField') as HTMLCollectionOf<HTMLElement>;
    var sourceFields = document.getElementsByClassName('sourceField');
    var targetFields = document.getElementsByClassName('targetField');
    var locSourceFields = document.getElementsByClassName('location_source');
    var locTargetFields = document.getElementsByClassName('location_target');

    if(directedCheckboxToggle)
    {
        for (var i = 0; i < directionFields.length; i ++) {
            directionFields[i].style.display = 'none';
        }
        for (var i = 0; i < sourceFields.length; i ++) {
            sourceFields[i].innerHTML = 'Source Node';
        }
        for (var i = 0; i < targetFields.length; i ++) {
            targetFields[i].innerHTML = 'Target Node';
        }
        for (var i = 0; i < locSourceFields.length; i ++) {
            locSourceFields[i].innerHTML = 'Location Source Node';
        }
        for (var i = 0; i < locTargetFields.length; i ++) {
            locTargetFields[i].innerHTML = 'Location Source Node';
        }
    }else
    {
        for (var i = 0; i < directionFields.length; i ++) {
            directionFields[i].style.display = 'block';
        }
        for (var i = 0; i < sourceFields.length; i ++) {
            sourceFields[i].innerHTML = 'Node 1';
        }
        for (var i = 0; i < targetFields.length; i ++) {
            targetFields[i].innerHTML = 'Node 2';
        }
        for (var i = 0; i < locSourceFields.length; i ++) {
            locSourceFields[i].innerHTML = 'Location Node 1';
        }
        for (var i = 0; i < locTargetFields.length; i ++) {
            locTargetFields[i].innerHTML = 'Location Node 2';
        }
    }
    saveCurrentNetwork(true);

}

/** Extracts locations from node and link tabe**/
export function extractLocations() {

    // showMessage('Extracting locations..', false);
    console.log("EXTRACT LOCATIONS")

    // if no location table exist, create one
    if (currentNetwork.userLocationTable == undefined) 
    {
        var tableName = currentNetwork.name.replace(/ /g, "_");
        currentNetwork.userLocationTable = new vistorian.VTable(tableName + '-locations', []);
        currentNetwork.userLocationSchema = new datamanager.LocationSchema(0, 1, 2, 3, 4);
        currentNetwork.userLocationTable.data.push(['Id', 'User Label', 'Geo Name', 'Longitude', 'Latitude']);

        // save table as a user's table 
        storage.saveUserTable(currentNetwork.userLocationTable, SESSION_NAME);
        tables = storage.getUserTables(SESSION_NAME);
    }

    // if location table is empty, add header as first column
    if (currentNetwork.userLocationTable.data.length == 0) {
        var schemaStrings: string[] = [];
        currentNetwork.userLocationTable.data.push(['Id', 'User Label', 'Geoname', 'Longitude', 'Latitude']);
    }

    var locationsFound: number = 0;

    // var linkTable: any;
    // check link table
    if (currentNetwork.userLinkSchema && currentNetwork.userLinkTable){
        for (var row = 1; row < currentNetwork.userLinkTable.data.length; row++) 
        {
            if(currentNetwork.userLinkSchema.location_target 
            && currentNetwork.userLinkSchema.location_target > -1){
                createLocationEntry(currentNetwork.userLinkTable.data[row][currentNetwork.userLinkSchema.location_target], currentNetwork.userLocationTable.data)
            }
            if(currentNetwork.userLinkSchema.location_source 
            && currentNetwork.userLinkSchema.location_source > -1){
                createLocationEntry(currentNetwork.userLinkTable.data[row][currentNetwork.userLinkSchema.location_source], currentNetwork.userLocationTable.data)
            }
        }
    }

    var nodeTable: any;
    if (currentNetwork.userNodeSchema && currentNetwork.userNodeTable){
        for (var row = 1; row < currentNetwork.userNodeTable.data.length; row++) 
        {
            if(currentNetwork.userNodeSchema.location 
            && currentNetwork.userNodeSchema.location > -1){
                createLocationEntry(currentNetwork.userNodeTable.data[row][currentNetwork.userNodeSchema.location], currentNetwork.userLocationTable.data)
            }
        }
    }

    console.log("\tlocations:", currentNetwork.userLocationTable.data.length, currentNetwork.userLocationTable.data)

    // locationsFound = locationTable.data.length;

    storage.saveNetwork(currentNetwork, SESSION_NAME);
    loadTableList();

    // saveCurrentNetwork(false);
    showNetworkTables(currentNetwork.id);
}

export function createLocationEntry(name: string, locationTableData: any[]) {

    // console.log('CREATE LOCATION ENTRY', name, locationTableData)

    // check validity
    if (name == undefined
        || name.length == 0
        || !name.replace(/\s/g, '').length) // contains only whitespace
        return;

    // check if location entry exists already.     
    for (var i = 0; i < locationTableData.length; i++) 
    {
        if (locationTableData[i][1] == name)
            return;
    }

    locationTableData.push([locationTableData.length - 1, name, name, undefined, undefined]);
}

/** Updates long/lat for geonames field in the location table**/
export function updateLocationCoordinatesWrapper() 
{
    console.log('UPDATE LOCATION COORDINATES')
    // showMessage('Retrieving and updating location coordinates...', false);

    if (currentNetwork.userLocationTable)
    {
        updateLocationCoordinates(
            (currentNetwork as any).userLocationTable, 
            currentNetwork.userLocationSchema, 
            function(){
                // showNetworkTables(currentNetwork.id);
                showTable((currentNetwork.userLocationTable as vistorian.VTable), '#locationTableDiv', true, currentNetwork.userLocationSchema);
                saveCurrentNetwork(false);
            }
        )
    }
}

var msgBox;
export function showMessage(message: string, timeout: any) {

    // $( "#dialogBox" ).dialog();

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

// Saves the content from the last cell edited
//
export function saveCurrentTableCellEdits() 
{
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
    unshowNetworkTables();
    localStorage.clear();
    location.reload()
}

export function removeNetwork(networkId: string) {
    currentNetwork = storage.getNetwork(networkId, SESSION_NAME);
    deleteCurrentNetwork();
}

export function removeTable(tableId: string) 
{
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

    showNetworkTables(currentNetwork.id)

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

export function updateLocationCoordinates(
    userLocationTable: vistorian.VTable, 
    locationSchema: datamanager.LocationSchema, 
    callBack: Function) 
{
    console.log('UPDATE-LOCATION-TABLE-COORDINATES')
    // saveCurrentNetwork(false);
    // var data: any = userLocationTable.data;
    requestsRunning = 0;
    fullGeoNames = [];
    for (var i = 1; i < userLocationTable.data.length; i++) 
    {
        getOpenStreetMapCoordinatesForLocation(i, userLocationTable.data[i][locationSchema.geoname], userLocationTable, locationSchema);
    }

    // wait for all requests to be returned, until continue
    requestTimer = setInterval(function () 
    {
        currentNetwork.userLocationTable = userLocationTable;
        checkRequests(callBack, [])
    }, 500);
}


export function getOpenStreetMapCoordinatesForLocation(index: number, geoname: string, locationTable: vistorian.VTable, locationSchema: datamanager.LocationSchema) {
    if(geoname) {
        geoname = geoname.trim();
        fullGeoNames.push(geoname);
        var xhr: any = $.ajax({
            url: 'https://api.maptiler.com/geocoding/'+geoname.split(',')[0].trim()+'.json?key=4JfMdMSpqOnXq9pxP8x4',
            // headers: {  'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials':'true' , 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS','Access-Control-Allow-Headers' :'Authorization,DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type'},
            data: {output: "json", limit: "1", },
            dataType: 'json'
        })
            .done(function (data, text, XMLHttpRequest) {
                var entry;
                var rowIndex = XMLHttpRequest.uniqueId + 1;
                var userLocationLabel = locationTable.data[rowIndex][locationSchema.label];
                if (data.features.length > 0) {
                    entry = data.features[0]
                    console.log('ENTRY RECEIVED', entry, entry.center[0], entry.center[1])
                    // var validResults = [];
                    // var result;
                    // for (var i = 0; i < data.features.length; i++) {
                    //     entry = data.features[i];
                    //     if (entry == undefined)
                    //         continue;
                    //     if ('longitude' in entry &&
                    //         'latitude' in entry 
                    //         // typeof entry.longitude === 'string' &&
                    //         // typeof entry.latitude === 'string'
                    //         ) {
                    //         validResults.push(entry);
                    //     }
                    // }
                    // if (validResults.length == 0) {
                    locationTable.data[rowIndex] = [rowIndex - 1, userLocationLabel, geoname, entry.center[0], entry.center[1]];
                    console.log('locationTable.data', locationTable.data); 
                }else{
                    locationTable.data[rowIndex] = [rowIndex - 1, userLocationLabel, geoname, undefined, undefined];
                }
                // return;
                // } else {
                //     if (geoname == '')
                //         return;
                //     locationTable.data[rowIndex] = [rowIndex - 1, userLocationLabel, geoname, undefined, undefined];
                // }
            })
            .always(function () {
                requestsRunning--;
            });
        xhr['uniqueId'] = requestsRunning++;
    }
}
// export function getOpenStreetMapCoordinatesForLocation(index: number, geoname: string, locationTable: vistorian.VTable, locationSchema: datamanager.LocationSchema) {
//     if(geoname) {
//         geoname = geoname.trim();
//         fullGeoNames.push(geoname);
//         var xhr: any = $.ajax({
//             url: 'https://api.positionstack.com/v1/forward?access_key=8597937ec81294b94fb84e42b4c2f2fc',
//             headers: {  'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials':'true' , 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS','Access-Control-Allow-Headers' :'Authorization,DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type'},
//             data: {output: "json", limit: "1", query: geoname.split(',')[0].trim()},
//             dataType: 'json'
//         })
//             .done(function (data, text, XMLHttpRequest) {
//                 var entry;
//                 var rowIndex = XMLHttpRequest.uniqueId + 1;
//                 var userLocationLabel = locationTable.data[rowIndex][locationSchema.label];
//                 if (data.results != 0) {
//                     var validResults = [];
//                     var result;
//                     for (var i = 0; i < data.results.length; i++) {
//                         entry = data.results[i];
//                         if (entry == undefined)
//                             continue;
//                         if ('longitude' in entry &&
//                             'latitude' in entry 
//                             // typeof entry.longitude === 'string' &&
//                             // typeof entry.latitude === 'string'
//                             ) {
//                             validResults.push(entry);
//                         }
//                     }
//                     if (validResults.length == 0) {
//                         locationTable.data[rowIndex] = [rowIndex - 1, userLocationLabel, geoname, undefined, undefined];
//                         return;
//                     }
//                     locationTable.data[rowIndex] = [rowIndex - 1, userLocationLabel, geoname, validResults[0].longitude, validResults[0].latitude];
//                 } else {
//                     if (geoname == '')
//                         return;
//                     locationTable.data[rowIndex] = [rowIndex - 1, userLocationLabel, geoname, undefined, undefined];
//                 }
//             })
//             .always(function () {
//                 requestsRunning--;
//             });
//         xhr['uniqueId'] = requestsRunning++;
//     }
// }
// export function getOpenStreetMapCoordinatesForLocation(index: number, geoname: string, locationTable: vistorian.VTable, locationSchema: datamanager.LocationSchema) {
//     if(geoname) {
//         geoname = geoname.trim();
//         fullGeoNames.push(geoname);
//         var xhr: any = $.ajax({
//             url: "http://nominatim.openstreetmap.org/search",
//             headers: {  'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials':'true' , 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS','Access-Control-Allow-Headers' :'Authorization,DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type'},
//             data: {format: "json", limit: "1", q: geoname.split(',')[0].trim()},
//             dataType: 'json'
//         })
//             .done(function (data, text, XMLHttpRequest) {
//                 var entry;
//                 var rowIndex = XMLHttpRequest.uniqueId + 1;
//                 var userLocationLabel = locationTable.data[rowIndex][locationSchema.label];
//                 if (data.length != 0) {
//                     var validResults = [];
//                     var result;
//                     for (var i = 0; i < data.length; i++) {
//                         entry = data[i];
//                         if (entry == undefined)
//                             continue;
//                         if ('lon' in entry &&
//                             'lat' in entry &&
//                             typeof entry.lon === 'string' &&
//                             typeof entry.lat === 'string') {
//                             validResults.push(entry);
//                         }
//                     }
//                     if (validResults.length == 0) {
//                         locationTable.data[rowIndex] = [rowIndex - 1, userLocationLabel, geoname, undefined, undefined];
//                         return;
//                     }
//                     locationTable.data[rowIndex] = [rowIndex - 1, userLocationLabel, geoname, validResults[0].lon, validResults[0].lat];
//                 } else {
//                     if (geoname == '')
//                         return;
//                     locationTable.data[rowIndex] = [rowIndex - 1, userLocationLabel, geoname, undefined, undefined];
//                 }
//             })
//             .always(function () {
//                 requestsRunning--;
//             });
//         xhr['uniqueId'] = requestsRunning++;
//     }
// }
