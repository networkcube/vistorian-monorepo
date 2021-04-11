"use strict";
/*
Convenient class that provides an API to the vistorian "framework"
and the user data.
This API should be used in every visualization.
*/
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.importIntoNetworkcube = exports.createAndNormaliseLocationTable = exports.importData = exports.exportNetwork = exports.setHeader = exports.cleanTable = exports.checkTime = exports.formatTable = exports.exportLocationTableCSV = exports.exportTableCSV = exports.loadCSV = exports.Network = exports.VLocationSchema = exports.VLinkSchema = exports.VNodeSchema = exports.VTableSchema = exports.VTable = void 0;
var datamanager = require("vistorian-core/src/datamanager");
var utils = require("vistorian-core/src/utils");
var main = require("vistorian-core/src/main");
var jquery_1 = require("jquery");
var Papa = require("papaparse");
var moment = require("moment");
var storage = require("./storage");
var head = jquery_1["default"]('head');
head.append("<link href='https://fonts.googleapis.com/css?family=Open+Sans+Condensed:300italic,700,300&subset=latin,latin-ext' rel='stylesheet' type='text/css'></head>");
head.append("<link href='https://fonts.googleapis.com/css?family=Great+Vibes' rel='stylesheet' type='text/css'>");
head.append("<link href='https://fonts.googleapis.com/css?family=Playfair+Display' rel='stylesheet' type='text/css'>");
head.append("<link href='https://fonts.googleapis.com/css?family=Amatic+SC:400,700' rel='stylesheet' type='text/css'>");
head.append("<link href='https://fonts.googleapis.com/css?family=Lora' rel='stylesheet' type='text/css'>");
head.append("<link href='https://fonts.googleapis.com/css?family=Comfortaa' rel='stylesheet' type='text/css'>");
head.append("<link href='https://fonts.googleapis.com/css?family=Caveat' rel='stylesheet' type='text/css'>");
head.append("<link href='https://fonts.googleapis.com/css?family=IM+Fell+English' rel='stylesheet' type='text/css'>");
function append(url) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    jquery_1["default"]("head").append(script);
}
var tables = [];
// DATA TYPES
var VTable = /** @class */ (function () {
    function VTable(name, data) {
        this.name = name;
        this.data = data;
    }
    return VTable;
}());
exports.VTable = VTable;
var VTableSchema = /** @class */ (function () {
    function VTableSchema(name) {
        this.name = name;
    }
    return VTableSchema;
}());
exports.VTableSchema = VTableSchema;
var VNodeSchema = /** @class */ (function (_super) {
    __extends(VNodeSchema, _super);
    function VNodeSchema() {
        var _this = _super.call(this, 'userNodeSchema') || this;
        _this.relation = []; // relationships defined in a node table (e.g. father, mother..)
        _this.location = -1; // location of node
        _this.id = 0;
        _this.label = -1;
        _this.time = -1;
        _this.nodeType = -1;
        _this.color = -1;
        _this.shape = -1;
        return _this;
    }
    ;
    return VNodeSchema;
}(VTableSchema));
exports.VNodeSchema = VNodeSchema;
var VLinkSchema = /** @class */ (function (_super) {
    __extends(VLinkSchema, _super);
    function VLinkSchema() {
        var _this = _super.call(this, 'userLinkSchema') || this;
        _this.location_source = -1; // location of source node
        _this.location_target = -1; // location of target node
        _this.id = 0;
        _this.source = -1;
        _this.target = -1;
        _this.weight = -1;
        _this.time = -1;
        _this.linkType = -1;
        _this.directed = -1;
        return _this;
    }
    ;
    return VLinkSchema;
}(VTableSchema));
exports.VLinkSchema = VLinkSchema;
var VLocationSchema = /** @class */ (function (_super) {
    __extends(VLocationSchema, _super);
    function VLocationSchema() {
        var _this = _super.call(this, 'userLocationSchema') || this;
        _this.id = 0;
        _this.label = 1;
        _this.geoname = 2;
        _this.longitude = 3;
        _this.latitude = 4;
        return _this;
    }
    ;
    return VLocationSchema;
}(VTableSchema));
exports.VLocationSchema = VLocationSchema;
// this represents a network the user created, including
// - the originally formatted tables
// - the node and edge schemas on those tables
// - the networkcube data set with the normalized tables
var Network = /** @class */ (function () {
    function Network(id) {
        this.name = '';
        this.userNodeTable = undefined; // ??
        this.userLinkTable = undefined; // ??;
        this.userLocationTable = undefined; // ??;
        this.userLocationSchema = new datamanager.LocationSchema(0, 0); // ??
        // networkCubeDataSet: networkcube.DataSet;
        this.networkConfig = 'both';
        this.timeFormat = '';
        this.id = id;
        this.userNodeSchema = new VNodeSchema();
        this.userLinkSchema = new VLinkSchema();
        this.ready = false;
        this.directed = false;
    }
    return Network;
}());
exports.Network = Network;
// FUNCTIONS
function loadCSV(files, callBack, sessionid) {
    var loadCount = 0;
    var table;
    var tables = [];
    var fileContents = [];
    var readers = [];
    for (var i = 0, f; f = files[i]; i++) {
        var reader = new FileReader();
        reader.filename = f.name.replace(/\s/g, '_').split('_')[0];
        readers[i] = reader;
        reader.onload = function (f) {
            var obj = {
                content: f.target.result,
                name: f.target.filename
            };
            var i = readers.indexOf(f.target);
            fileContents[i] = obj;
            var content = fileContents[i].content.replace(', "', ',"').replace('" ,', '",');
            table = new VTable(
            // eliminate spaces in the name because they will 
            // interfere with creating html element ids
            // clean ', "'
            files[i].name.replace('.csv', '').replace(/\s/g, '_').trim(), Papa.parse(content).data);
            // remove white spaces, extra cols and rows etc..
            formatTable(table);
            storage.saveUserTable(table, sessionid);
            loadCount++;
            if (loadCount == files.length)
                callBack();
        };
        reader.readAsText(f);
    }
}
exports.loadCSV = loadCSV;
function exportTableCSV(table) {
    var csv = Papa.unparse(table.data, { quotes: true });
    var textFileAsBlob = new Blob([csv], { type: 'text/csv' });
    var fileNameToSaveAs = table.name + '.csv';
    var downloadLink = document.createElement('a');
    downloadLink.download = fileNameToSaveAs;
    downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    downloadLink.click();
}
exports.exportTableCSV = exportTableCSV;
function exportLocationTableCSV(networkname, table) {
    var csv = Papa.unparse(table, { quotes: true });
    var textFileAsBlob = new Blob([csv], { type: 'text/csv' });
    var fileNameToSaveAs = networkname + '-locations.csv';
    var downloadLink = document.createElement('a');
    downloadLink.download = fileNameToSaveAs;
    downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    downloadLink.click();
}
exports.exportLocationTableCSV = exportLocationTableCSV;
// Cleans and formats the data as it comes from the user,
// for proper display and processing.
// - trim
// - add line numbers
function formatTable(table) {
    var data = [];
    var indexify = !(table.data[0][0] == 'ID'
        || table.data[0][0] == 'id'
        || table.data[0][0] == 'Id'
        || table.data[0][0] == 'Index'
        || table.data[0][0].includes('index')
        || table.data[0][0].includes('Index'));
    var numCols = table.data[0].length;
    var emptyCols = 0;
    var row;
    for (var i = 0; i < table.data.length; i++) {
        row = [];
        emptyCols = 0;
        if (indexify) {
            if (i == 0)
                row.push('Index');
            else
                row.push((i - 1) + '');
        }
        for (var j = 0; j < numCols; j++) {
            if (table.data[i][j] == undefined) {
                table.data[i][j] = '';
            }
            if (table.data[i][j].length == 0) {
                emptyCols++;
            }
            row.push(table.data[i][j].trim());
        }
        if (emptyCols < numCols - 1) {
            data.push(row);
        }
    }
    table.data = data;
    return table;
}
exports.formatTable = formatTable;
/**
 * Checks the time column in the passed table against the entered
 * time format and returns an array of fields that do not match the
 * that time format.
 * @param  {Table}  table      [description]
 * @param  {number} timeCol    [description]
 * @param  {string} timeFormat [description]
 * @return {[type]}            [description]
 */
function checkTime(table, timeCol, timeFormat) {
    var timeString;
    var error = [];
    for (var i = 0; i < table.data.length; i++) {
        timeString = table.data[i][timeCol];
        if (timeString.length == 0) {
            error.push(i);
            continue;
        }
        try {
            moment.utc(timeString, timeFormat);
        }
        catch (err) {
            error.push(i);
        }
    }
    return error;
}
exports.checkTime = checkTime;
function cleanTable(table) {
    // trim entries
    var emptyColBool = [];
    for (var i = 0; i < table.length; i++) {
        for (var j = 0; j < table[i].length; j++) {
            if (table[i][j] != undefined)
                table[i][j] = table[i][j].trim();
        }
    }
}
exports.cleanTable = cleanTable;
function setHeader(elementId, datasetname) {
    var header = jquery_1["default"]('<a href="../index.html"><img width="100%" src="../static/logos/logo-networkcube.png"/></a>');
    jquery_1["default"]('#' + elementId).append(header);
    var dataname = jquery_1["default"]('\
        <p style="margin:5px;background-color:#eeeeee;border-radius:2px;padding-left:10px;padding:5px;"><b>Data:</b> ' + datasetname + '</h2>');
    jquery_1["default"]('#' + elementId).append(dataname);
    //$('#' + elementId).append('')
    //$('#' + elementId).append('')
    //$('#' + elementId).append('')
    var vars = utils.getUrlVars();
    // VS: Clicks on Return to DataView
    jquery_1["default"]('#' + elementId).append('<a href="../web/dataview.html?session=' + vars['session'] + '&datasetName' + vars['datasetName'] + '" style="margin:5px;padding-left:5px;" onclick="trace.event(\'log_4\', document.location.pathname, \'Return to Data View Button\', \'Clicked\');" target="_blank">Return to Dataview</a>');
    jquery_1["default"]('#' + elementId).append('<br/><br/>');
}
exports.setHeader = setHeader;
function exportNetwork(network) {
    var blurb = network;
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(blurb)));
    element.setAttribute('download', network.name + '.vistorian');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
exports.exportNetwork = exportNetwork;
function importData(network, session) {
    storage.saveNetwork(network, session);
}
exports.importData = importData;
function createAndNormaliseLocationTable(currentNetwork) {
    ////////////////////////////////////////////////////////////////////
    // CREATE AND NORMALIZE LOCATION TABLE IF ANY LOCATION DATA EXITS //
    ////////////////////////////////////////////////////////////////////
    //  EXTRACT LOCATIONS FROM USER LOCATION TABLE, IF PRESENT
    var locationLabels = [];
    if (currentNetwork.userLocationTable) {
        // store all locations for easy index lookup
        for (var i = 1; i < currentNetwork.userLocationTable.data.length; i++) {
            locationLabels.push(currentNetwork.userLocationTable.data[i][currentNetwork.userLocationSchema.label]);
        }
    }
    if (currentNetwork.userLinkTable) {
        // @ts-ignore
        var userLinkData = currentNetwork.userLinkTable.data;
        if (currentNetwork.userLinkSchema) {
            var userLinkSchema = currentNetwork.userLinkSchema;
        }
        else {
            var userLinkSchema = new VLinkSchema();
        }
        for (var i = 1; i < userLinkData.length; i++) {
            if (locationLabels.indexOf(userLinkData[i][userLinkSchema.location_source]) == -1) {
                locationLabels.push(userLinkData[i][userLinkSchema.location_source]);
            }
            if (locationLabels.indexOf(userLinkData[i][userLinkSchema.location_target]) == -1) {
                locationLabels.push(userLinkData[i][userLinkSchema.location_target]);
            }
        }
    }
    var normalizedLocationSchema = datamanager.getDefaultLocationSchema();
    if (currentNetwork.userLocationTable) {
        normalizedLocationSchema = currentNetwork.userLocationSchema;
    }
    var normalizedLocationTable = [];
    var locationName = "";
    var row;
    // If the user has specified a location table, normalize
    // that table:
    if (currentNetwork.userLocationTable) {
        var userLocationTable = currentNetwork.userLocationTable.data;
        var userLocationSchema = currentNetwork.userLocationSchema;
        for (var i = 1; i < userLocationTable.length; i++) {
            row = [normalizedLocationTable.length, 0, 0, 0, 0];
            locationName = userLocationTable[i][userLocationSchema.label];
            row[normalizedLocationSchema.id] = locationLabels.indexOf(locationName);
            row[normalizedLocationSchema.label] = locationName;
            row[normalizedLocationSchema.geoname] = userLocationTable[i][userLocationSchema.geoname];
            row[normalizedLocationSchema.latitude] = userLocationTable[i][userLocationSchema.latitude];
            row[normalizedLocationSchema.longitude] = userLocationTable[i][userLocationSchema.longitude];
            normalizedLocationTable.push(row);
        }
    }
    // if there exist any locations, check if they are
    // listed in the location table
    if (locationLabels.length > 0) {
        for (var i = 0; i < locationLabels.length; i++) {
            var found = false;
            for (var j = 0; j < normalizedLocationTable.length; j++) {
                if (normalizedLocationTable[j][1] == locationLabels[i]) {
                    found = true;
                }
            }
            if (!found) {
                row = [normalizedLocationTable.length, 0, 0, 0, 0];
                locationName = locationLabels[i];
                row[normalizedLocationSchema.label] = locationName;
                row[normalizedLocationSchema.geoname] = locationName;
                normalizedLocationTable.push(row);
            }
        }
    }
    return { normalizedLocationSchema: normalizedLocationSchema, normalizedLocationTable: normalizedLocationTable, locationName: locationName, locationLabels: locationLabels };
}
exports.createAndNormaliseLocationTable = createAndNormaliseLocationTable;
function importIntoNetworkcube(currentNetwork, sessionid, s) {
    currentNetwork.ready = false;
    if (currentNetwork.userLinkSchema) {
        var userLinkSchema = currentNetwork.userLinkSchema;
    }
    else {
        var userLinkSchema = new VLinkSchema();
    }
    if (currentNetwork.userNodeSchema) {
        var userNodeSchema = currentNetwork.userNodeSchema;
    }
    else {
        var userNodeSchema = new VNodeSchema();
    }
    // check minimal conditions to create and import a network
    if (currentNetwork.userLinkSchema && currentNetwork.userNodeSchema) {
        if (!((currentNetwork.userLinkSchema.source > -1
            && currentNetwork.userLinkSchema.target > -1)
            || (currentNetwork.userNodeSchema.label > -1
                && currentNetwork.userNodeSchema.relation.length > -1))) {
            // nothing to import at this point as no schemas defined
            return;
        }
    }
    else {
        return;
    }
    // trim cell entries (remove overhead white space)
    if (currentNetwork.userNodeTable) {
        cleanTable(currentNetwork.userNodeTable.data);
    }
    if (currentNetwork.userLinkTable) {
        cleanTable(currentNetwork.userLinkTable.data);
    }
    // Start with empty normalized tables
    var normalizedNodeTable = [];
    var normalizedLinkTable = [];
    // get standard schemas
    // INIT NODE SCHEMA
    var normalizedNodeSchema = new datamanager.NodeSchema(0);
    // INITIALZE NORMALIZED SCHEMAS WITH USER'S ATTRIBUTES
    // required attributes
    normalizedNodeSchema.id = 0;
    normalizedNodeSchema.label = 1;
    var nodeColCount = 2;
    if (currentNetwork.userNodeSchema) {
        for (var p in currentNetwork.userNodeSchema) {
            if (currentNetwork.userNodeSchema.hasOwnProperty(p)
                && currentNetwork.userNodeSchema[p] > -1
                && p != 'id'
                && p != 'label'
                && p != 'relation'
                && currentNetwork.userNodeSchema[p] > 0) {
                normalizedNodeSchema[p] = nodeColCount++;
            }
        }
    }
    // INIT LINK SCHEMA
    var normalizedLinkSchema = new datamanager.LinkSchema(0, 1, 2);
    // required attributes
    normalizedLinkSchema.id = 0;
    normalizedLinkSchema.source = 1;
    normalizedLinkSchema.target = 2;
    var linkColCount = 3;
    if (currentNetwork.userLinkSchema) {
        for (var p in currentNetwork.userLinkSchema) {
            if (currentNetwork.userLinkSchema.hasOwnProperty(p)
                && currentNetwork.userLinkSchema[p] > -1
                && p != 'id'
                && p != 'source'
                && p != 'target'
                && p != 'location_source'
                && p != 'location_source') {
                normalizedLinkSchema[p] = linkColCount++;
            }
        }
    }
    ///////////////////////////////
    // PROCESS SINGLE NODE-TABLE //
    ///////////////////////////////
    if (currentNetwork.userLinkTable == undefined
        && currentNetwork.userNodeTable != undefined) {
        // create link table and fill
        var id;
        var relCol;
        var newNodeRow;
        var newLinkRow;
        var rowNum;
        var userNodeTable = currentNetwork.userNodeTable.data;
        var colCount = 3;
        normalizedLinkSchema.linkType = colCount++;
        if (datamanager.isValidIndex(userNodeSchema.time)) {
            normalizedLinkSchema.time = colCount++;
        }
        // In the normalized node table, create one row for each row in the node table, 
        // if name does not already exists
        var nodeLabels = [];
        var nodeIds = [];
        for (var i = 1; i < userNodeTable.length; i++) {
            newRow = [0, 0, 0, 0, 0];
            id = parseInt(userNodeTable[i][userNodeSchema.id]);
            nodeIds.push(id);
            newRow[normalizedNodeSchema.id] = id;
            newRow[normalizedNodeSchema.label] = userNodeTable[i][userNodeSchema.label];
            newRow[normalizedNodeSchema.shape] = userNodeTable[i][userNodeSchema.shape];
            newRow[normalizedNodeSchema.color] = userNodeTable[i][userNodeSchema.color];
            nodeLabels.push(userNodeTable[i][userNodeSchema.label]);
            normalizedNodeTable.push(newRow);
        }
        // create a node row for each node in a relation field 
        // that does not yet has an entry in the node table.
        // Plus, create a link in the link table.
        for (var i = 1; i < userNodeTable.length; i++) {
            // Iterate through all relation columns
            var row;
            var sourceId;
            var targetId;
            for (var j = 0; j < userNodeSchema.relation.length; j++) {
                row = userNodeTable[i];
                relCol = userNodeSchema.relation[j];
                sourceId = nodeIds[i - 1];
                // dont create relation if field entry is empty;
                if (row[relCol].length == 0)
                    continue;
                // check if node already exist
                rowNum = nodeLabels.indexOf(row[relCol]);
                if (rowNum < 0) {
                    // create new node in node table
                    newNodeRow = [0, 0];
                    newNodeRow[normalizedNodeSchema.id] = normalizedNodeTable.length;
                    nodeIds.push(normalizedNodeTable.length - 1);
                    nodeLabels.push(row[relCol]);
                    newNodeRow[normalizedNodeSchema.label] = row[relCol];
                    normalizedNodeTable.push(newNodeRow);
                    targetId = normalizedNodeTable.length - 1;
                }
                else {
                    targetId = rowNum;
                }
                // create entry in link table
                newLinkRow = [];
                for (var k = 0; k < colCount; k++) {
                    newLinkRow.push('');
                }
                newLinkRow[normalizedLinkSchema.id] = normalizedLinkTable.length;
                newLinkRow[normalizedLinkSchema.source] = sourceId;
                newLinkRow[normalizedLinkSchema.target] = targetId;
                newLinkRow[normalizedLinkSchema.linkType] = userNodeTable[0][relCol]; // set column header as relation type
                if (datamanager.isValidIndex(userNodeSchema.time))
                    newLinkRow[normalizedLinkSchema.time] = row[userNodeSchema.time];
                normalizedLinkTable.push(newLinkRow);
            }
        }
    }
    ///////////////////////////////
    // PROCESS SINGLE LINK-TABLE //
    ///////////////////////////////
    var nodeNames = [];
    if (currentNetwork.userNodeTable == undefined
        && currentNetwork.userLinkTable != undefined) {
        var nodeLocations = [];
        var nodeTimes = [];
        var nodeTypes = [];
        var userLinkData = currentNetwork.userLinkTable.data;
        var sourceId;
        var targetId;
        var nodeName;
        var locationName;
        var timeString;
        var timeFormatted;
        // Extract node labels and create (simple) normalized node table
        var row;
        for (var i = 1; i < userLinkData.length; i++) {
            // source
            nodeName = userLinkData[i][userLinkSchema.source];
            if (nodeNames.indexOf(nodeName) < 0) {
                row = [nodeNames.length, nodeName];
                nodeNames.push(nodeName);
                normalizedNodeTable.push(row);
            }
            // target
            nodeName = userLinkData[i][userLinkSchema.target];
            if (nodeNames.indexOf(nodeName) < 0) {
                row = [nodeNames.length, nodeName];
                nodeNames.push(nodeName);
                normalizedNodeTable.push(row);
            }
        }
    }
    // At this point, there is a normalzied node table
    // if the user has not specified any link table, a normalized  
    // link table has been created above. 
    // If he has provided a link table, it is traversed below and 
    // the references to node names are put into place.
    if (currentNetwork.userLinkTable != undefined) {
        // create normalized link table and replace source/target label by source/target id
        normalizedLinkTable = [];
        var newRow;
        var linkTime;
        var found = true;
        var userLinkData = currentNetwork.userLinkTable.data;
        for (var i = 1; i < userLinkData.length; i++) {
            newRow = [];
            for (var k = 0; k < linkColCount; k++) {
                newRow.push('');
            }
            for (var p in userLinkSchema) {
                if (userLinkSchema.hasOwnProperty(p)
                    && userLinkSchema[p] > -1) {
                    newRow[normalizedLinkSchema[p]] = userLinkData[i][userLinkSchema[p]];
                }
            }
            sourceId = nodeNames.indexOf(userLinkData[i][userLinkSchema.source]);
            newRow[normalizedLinkSchema.source] = sourceId;
            targetId = nodeNames.indexOf(userLinkData[i][userLinkSchema.target]);
            newRow[normalizedLinkSchema.target] = targetId;
            normalizedLinkTable.push(newRow);
        }
        // check if location and time information exists for nodes
        var time;
        var locationsFound = false;
        var timeFound = false;
        if (datamanager.isValidIndex(userLinkSchema.location_source)
            || datamanager.isValidIndex(userLinkSchema.location_target)) {
            // set location schema index to next new column
            normalizedNodeSchema.location = nodeColCount++;
            // append new field to each row in node table
            for (var i = 0; i < normalizedNodeTable.length; i++) {
                normalizedNodeTable[i].push('');
            }
            // FYI: node table has now at least 3 rows (id, name, location)
            if (datamanager.isValidIndex(userLinkSchema.time)) {
                // set time schema index to next new column
                normalizedNodeSchema.time = nodeColCount++;
                // append new field to each row in node table
                for (var i = 0; i < normalizedNodeTable.length; i++) {
                    normalizedNodeTable[i].push('');
                }
                // FYI: node table has now at least 4 rows (id, name, location, time)
            }
            // insert locations and ev. times into node table, as found in linktable
            for (var i = 1; i < userLinkData.length; i++) {
                var nodeRow, rowToDuplicate;
                // do for source location
                nodeName = userLinkData[i][userLinkSchema.source];
                if (datamanager.isValidIndex(userLinkSchema.location_source)
                    && userLinkData[i][userLinkSchema.location_source]
                    && userLinkData[i][userLinkSchema.location_source] != '') {
                    var len = normalizedNodeTable.length;
                    for (var j = 0; j < len; j++) {
                        nodeRow = normalizedNodeTable[j];
                        if (nodeRow[normalizedNodeSchema.label] == nodeName) {
                            rowToDuplicate = undefined;
                            if (datamanager.isValidIndex(normalizedNodeSchema.time)) {
                                // if there is already a time but no location,  
                                if (nodeRow[normalizedNodeSchema.time] == userLinkData[i][userLinkSchema.time]) {
                                    if (nodeRow[normalizedNodeSchema.location] && nodeRow[normalizedNodeSchema.location] != '') {
                                        rowToDuplicate = undefined;
                                    }
                                    else {
                                        rowToDuplicate = nodeRow;
                                    }
                                    // nothing here node has already a location for this time, continue with next row.
                                    j = len; // go to end of table
                                    break;
                                }
                                else {
                                    rowToDuplicate = nodeRow;
                                }
                            }
                            else {
                                // just insert, no dupliation required
                                nodeRow[normalizedNodeSchema.location] = userLinkData[i][userLinkSchema.location_source];
                                j = len; // go to end of table
                                break;
                            }
                        }
                    }
                    if (rowToDuplicate) {
                        if (rowToDuplicate[normalizedNodeSchema.location] == '') {
                            rowToDuplicate[normalizedNodeSchema.location] = userLinkData[i][userLinkSchema.location_source];
                            rowToDuplicate[normalizedNodeSchema.time] = userLinkData[i][userLinkSchema.time];
                        }
                        else {
                            var newRowNode = [];
                            for (var c = 0; c < rowToDuplicate.length; c++) {
                                newRowNode.push(rowToDuplicate[c]);
                            }
                            newRowNode[normalizedNodeSchema.location] = userLinkData[i][userLinkSchema.location_source];
                            newRowNode[normalizedNodeSchema.time] = userLinkData[i][userLinkSchema.time];
                            normalizedNodeTable.push(newRowNode);
                        }
                    }
                }
                // do for target location
                nodeName = userLinkData[i][userLinkSchema.target];
                if (datamanager.isValidIndex(userLinkSchema.location_target)
                    && userLinkData[i][userLinkSchema.location_target]
                    && userLinkData[i][userLinkSchema.location_target] != '') {
                    var len = normalizedNodeTable.length;
                    for (var j = 0; j < len; j++) {
                        nodeRow = normalizedNodeTable[j];
                        if (nodeRow[normalizedNodeSchema.label] == nodeName) {
                            rowToDuplicate = undefined;
                            if (datamanager.isValidIndex(normalizedNodeSchema.time)) {
                                // if location is not empty, 
                                if (nodeRow[normalizedNodeSchema.time] == userLinkData[i][userLinkSchema.time]) {
                                    if (nodeRow[normalizedNodeSchema.location] && nodeRow[normalizedNodeSchema.location] != '') {
                                        rowToDuplicate = undefined;
                                    }
                                    else {
                                        rowToDuplicate = nodeRow;
                                    }
                                    // nothing here node has already a location for this time, continue with next row.
                                    j = len; // go to end of table
                                    break;
                                }
                                else {
                                    rowToDuplicate = nodeRow;
                                }
                            }
                            else {
                                // just insert, no dupliation required
                                nodeRow[normalizedNodeSchema.location] = userLinkData[i][userLinkSchema.location_target];
                                j = len; // go to end of table
                                break;
                            }
                        }
                    }
                    if (rowToDuplicate) {
                        if (rowToDuplicate[normalizedNodeSchema.location] == '') {
                            rowToDuplicate[normalizedNodeSchema.location] = userLinkData[i][userLinkSchema.location_target];
                            rowToDuplicate[normalizedNodeSchema.time] = userLinkData[i][userLinkSchema.time];
                        }
                        else {
                            // duplicate
                            var newRowNode = [];
                            for (var c = 0; c < rowToDuplicate.length; c++) {
                                newRowNode.push(rowToDuplicate[c]);
                            }
                            newRowNode[normalizedNodeSchema.location] = userLinkData[i][userLinkSchema.location_target];
                            newRowNode[normalizedNodeSchema.time] = userLinkData[i][userLinkSchema.time];
                            normalizedNodeTable.push(newRowNode);
                        }
                    }
                }
            }
        } // end of checking for node times and location in link table
    } // end of link table normalization
    // FORMAT TIMES INTO ISO STANDARD
    if (currentNetwork.hasOwnProperty('timeFormat') && currentNetwork.timeFormat != undefined && currentNetwork.timeFormat.length > 0) {
        var format = currentNetwork.timeFormat;
        if (normalizedLinkSchema.time != undefined && normalizedLinkSchema.time > -1) {
            for (var i = 0; i < normalizedLinkTable.length; i++) {
                time = moment.utc(normalizedLinkTable[i][normalizedLinkSchema.time], format).format(main.timeFormat());
                if (time.indexOf('Invalid') > -1)
                    time = undefined;
                normalizedLinkTable[i][normalizedLinkSchema.time] = time;
            }
        }
        if (normalizedNodeSchema.time != undefined && normalizedNodeSchema.time > -1) {
            for (var i = 0; i < normalizedNodeTable.length; i++) {
                time = moment.utc(normalizedNodeTable[i][normalizedNodeSchema.time], format).format(main.timeFormat());
                if (time.indexOf('Invalid') > -1)
                    time = undefined;
                normalizedNodeTable[i][normalizedNodeSchema.time] = time;
            }
        }
    }
    var _a = createAndNormaliseLocationTable(currentNetwork), normalizedLocationSchema = _a.normalizedLocationSchema, normalizedLocationTable = _a.normalizedLocationTable, locationName = _a.locationName, locationLabels = _a.locationLabels;
    if (normalizedNodeSchema.location > -1) {
        for (var i = 0; i < normalizedNodeTable.length; i++) {
            locationName = normalizedNodeTable[i][normalizedNodeSchema.location].trim();
            id = locationLabels.indexOf(locationName);
            normalizedNodeTable[i][normalizedNodeSchema.location] = id;
        }
    }
    // set tables to networkcube data set:
    var params = {};
    params.name = currentNetwork.name;
    params.nodeTable = normalizedNodeTable;
    params.linkTable = normalizedLinkTable;
    params.nodeSchema = normalizedNodeSchema;
    params.linkSchema = normalizedLinkSchema;
    params.locationTable = normalizedLocationTable;
    params.locationSchema = normalizedLocationSchema;
    params.timeFormat = currentNetwork.timeFormat;
    params.directed = currentNetwork.directed;
    var dataset = new datamanager.DataSet(params);
    if (currentNetwork.userLocationTable) {
        currentNetwork.userLocationTable.data = [];
        currentNetwork.userLocationTable.data.push(['Id', 'User Name', 'Geoname', 'Longitude', 'Latitude']);
        for (var i = 0; i < normalizedLocationTable.length; i++) {
            currentNetwork.userLocationTable.data.push(normalizedLocationTable[i]);
        }
    }
    // make ids integer
    for (var i = 0; i < normalizedNodeTable.length; i++) {
        normalizedNodeTable[i][0] = parseInt(normalizedNodeTable[i][0]);
    }
    for (var i = 0; i < normalizedLinkTable.length; i++) {
        normalizedLinkTable[i][0] = parseInt(normalizedLinkTable[i][0]);
    }
    // save network on the vistorian side
    currentNetwork.ready = true;
    storage.saveNetwork(currentNetwork, sessionid);
    main.setDataManagerOptions({ keepOnlyOneSession: false });
    main.importData(sessionid, dataset);
    return dataset;
}
exports.importIntoNetworkcube = importIntoNetworkcube;
