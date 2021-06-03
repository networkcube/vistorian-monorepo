/*
Convenient class that provides an API to the vistorian "framework"
and the user data.
This API should be used in every visualization.
*/

import * as datamanager from 'vistorian-core/src/datamanager';
import * as utils from 'vistorian-core/src/utils';
import * as main from 'vistorian-core/src/main';

import $ from 'jquery';
import * as Papa from 'papaparse';
import * as moment from 'moment';

import * as storage from './storage';


var head: any = $('head');
head.append("<link href='https://fonts.googleapis.com/css?family=Open+Sans+Condensed:300italic,700,300&subset=latin,latin-ext' rel='stylesheet' type='text/css'></head>")
head.append("<link href='https://fonts.googleapis.com/css?family=Great+Vibes' rel='stylesheet' type='text/css'>")
head.append("<link href='https://fonts.googleapis.com/css?family=Playfair+Display' rel='stylesheet' type='text/css'>")
head.append("<link href='https://fonts.googleapis.com/css?family=Amatic+SC:400,700' rel='stylesheet' type='text/css'>")
head.append("<link href='https://fonts.googleapis.com/css?family=Lora' rel='stylesheet' type='text/css'>")
head.append("<link href='https://fonts.googleapis.com/css?family=Comfortaa' rel='stylesheet' type='text/css'>")
head.append("<link href='https://fonts.googleapis.com/css?family=Caveat' rel='stylesheet' type='text/css'>")
head.append("<link href='https://fonts.googleapis.com/css?family=IM+Fell+English' rel='stylesheet' type='text/css'>")



function append(url: string) {
    var script: any = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    $("head").append(script);
}

var tables: any[] = [];


// DATA TYPES

export class VTable {
    name: string;
    data: any[];
    constructor(name: string, data: any[]) {
        this.name = name;
        this.data = data;
    }
}

export class VTableSchema {
    name: string;
    constructor(name: string) {
        this.name = name;
    }

}

export class VNodeSchema extends VTableSchema {
    relation: number[] = []; // relationships defined in a node table (e.g. father, mother..)
    location: number = -1; // location of node
    id: number = 0;
    label: number = -1;
    time: number = -1;
    nodeType: number = -1;
    color: number = -1;
    shape: number = -1;
    constructor() {
        super('userNodeSchema')
    };
}

export class VLinkSchema extends VTableSchema {
    location_source: number = -1; // location of source node
    location_target: number = -1; // location of target node
    id: number = 0;
    source: number = -1;
    target: number = -1;
    weight: number = -1;
    time: number = -1;
    linkType: number = -1;
    directed: number = -1;
    constructor() {
        super('userLinkSchema')
    };
}
export class VLocationSchema extends VTableSchema {
    id: number = 0;
    label: number = 1;
    geoname: number = 2
    longitude: number = 3;
    latitude: number = 4;
    constructor() {
        super('userLocationSchema')
    };
}

// this represents a network the user created, including
// - the originally formatted tables
// - the node and edge schemas on those tables
// - the networkcube data set with the normalized tables
export class Network {
    id: number;
    name: string = '';
    userNodeTable: VTable | undefined = undefined; // ??
    userLinkTable: VTable | undefined = undefined; // ??;
    userNodeSchema: VNodeSchema | undefined;
    userLinkSchema: VLinkSchema | undefined;
    userLocationTable: VTable | undefined = undefined; // ??;
    userLocationSchema: datamanager.LocationSchema = new datamanager.LocationSchema(0, 0); // ??
    // networkCubeDataSet: networkcube.DataSet;
    networkConfig: string = 'both';
    timeFormat: string = '';
    ready: boolean; // placeholder indicating if network is complete and ready to be visualized.
    directed: boolean;

    constructor(id: number) {
        this.id = id;
        this.userNodeSchema = new VNodeSchema();
        this.userLinkSchema = new VLinkSchema();
        this.ready = false;
        this.directed = false;
    }
}

// FUNCTIONS

export function loadCSV(files: File[], callBack: Function, sessionid: string) {

    var loadCount: number = 0;
    var table: any;
    var tables: VTable[] = [];
    var fileContents: any[] = []
    var readers: FileReader[] = [];
    for (var i = 0, f: File; f = files[i]; i++) {
        var reader: FileReader = new FileReader();
        (reader as any).filename = f.name.replace(/\s/g, '_').split('_')[0];
        readers[i] = reader;

        reader.onload = function (f) {
            var obj: Object = {
                content: (<FileReader>f.target).result,
                name: (f.target as any).filename
            }
            var i: number = readers.indexOf((<FileReader>f.target));
            fileContents[i] = obj;
            var content: any = fileContents[i].content.replace(', "', ',"').replace('" ,', '",')
            table = new VTable(
                // eliminate spaces in the name because they will 
                // interfere with creating html element ids
                // clean ', "'
                files[i].name.replace('.csv', '').replace(/\s/g, '_').trim(),
                Papa.parse(content,
                    // {
                    //     // quotes: true,
                    //     // quoteChar: '"',
                    //     // header: true,
                    //     // newline: "\r\n"
                    // }
                ).data
            )
            // remove white spaces, extra cols and rows etc..
            formatTable(table);

            storage.saveUserTable(table, sessionid);
            loadCount++;

            if (loadCount == files.length)
                callBack();
        }
        reader.readAsText(f);
    }
}

export function exportTableCSV(table: VTable) {
    var csv: any = Papa.unparse(table.data, { quotes: true });
    var textFileAsBlob: Blob = new Blob([csv], { type: 'text/csv' });
    var fileNameToSaveAs: string = table.name + '.csv';
    var downloadLink: any = document.createElement('a');
    downloadLink.download = fileNameToSaveAs;
    downloadLink.href = (window as any).webkitURL.createObjectURL(textFileAsBlob);
    downloadLink.click();
}

export function exportLocationTableCSV(networkname: any, table: any) {
    var csv: any = Papa.unparse(table, { quotes: true });
    var textFileAsBlob: Blob = new Blob([csv], { type: 'text/csv' });
    var fileNameToSaveAs: string = networkname + '-locations.csv';
    var downloadLink: any = document.createElement('a');
    downloadLink.download = fileNameToSaveAs;
    downloadLink.href = (window as any).webkitURL.createObjectURL(textFileAsBlob);
    downloadLink.click();
}


// Cleans and formats the data as it comes from the user,
// for proper display and processing.
// - trim
// - add line numbers
export function formatTable(table: VTable) {

    var data: any[] = [];
    var indexify: boolean =
        !(table.data[0][0] == 'ID'
            || table.data[0][0] == 'id'
            || table.data[0][0] == 'Id'
            || table.data[0][0] == 'Index'
            || table.data[0][0].includes('index')
            || table.data[0][0].includes('Index'));

    var numCols: number = table.data[0].length;
    var emptyCols: number = 0;
    var row: any[];
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
            data.push(row)
        }
    }
    table.data = data;
    return table
}


/**
 * Checks the time column in the passed table against the entered
 * time format and returns an array of fields that do not match the
 * that time format.
 * @param  {Table}  table      [description]
 * @param  {number} timeCol    [description]
 * @param  {string} timeFormat [description]
 * @return {[type]}            [description]
 */
export function checkTime(table: VTable, timeCol: number, timeFormat: string): number[] {
    var timeString: string;
    var error: number[] = [];
    for (var i = 0; i < table.data.length; i++) {
        timeString = table.data[i][timeCol];

        if (timeString.length == 0) {
            error.push(i);
            continue;
        }
        try {
            moment.utc(timeString, timeFormat);
        } catch (err) {
            error.push(i);
        }
    }
    return error;
}

export function cleanTable(table: any[][]) {
    // trim entries
    var emptyColBool: any[] = []
    for (var i = 0; i < table.length; i++) {
        for (var j = 0; j < table[i].length; j++) {
            if (table[i][j] != undefined)
                table[i][j] = table[i][j].trim();
        }
    }

}


export function setHeader(elementId: String, datasetname: String) {
    var header: any = $('<a href="../index.html"><img width="100%" src="../static/logos/logo-networkcube.png"/></a>')
    $('#' + elementId).append(header);
    var dataname: any = $('\
        <p style="margin:5px;background-color:#eeeeee;border-radius:2px;padding-left:10px;padding:5px;"><b>Data:</b> '+ datasetname + '</h2>')
    $('#' + elementId).append(dataname);
 
    //$('#' + elementId).append('')
    //$('#' + elementId).append('')
    //$('#' + elementId).append('')

    var vars: any = utils.getUrlVars();

    // VS: Clicks on Return to DataView
    $('#' + elementId).append('<a href="../web/dataview.html?session=' + vars['session'] + '&datasetName' + vars['datasetName'] + '" style="margin:5px;padding-left:5px;" onclick="trace.event(\'log_4\', document.location.pathname, \'Return to Data View Button\', \'Clicked\');" target="_blank">Return to Dataview</a>');
    $('#' + elementId).append('<br/><br/>');

}


export function exportNetwork(network: Network) {
    var blurb: Network = network;

    var element: any = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(blurb)));
    element.setAttribute('download', network.name + '.vistorian');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

export function importData(network: Network, session: any) {
    storage.saveNetwork(network, session);
}

export function createAndNormaliseLocationTable(currentNetwork: Network) {
    ////////////////////////////////////////////////////////////////////
    // CREATE AND NORMALIZE LOCATION TABLE IF ANY LOCATION DATA EXITS //
    ////////////////////////////////////////////////////////////////////

    //  EXTRACT LOCATIONS FROM USER LOCATION TABLE, IF PRESENT

    var locationLabels: string[] = [];
    if (currentNetwork.userLocationTable) {
        // store all locations for easy index lookup
        for (var i = 1; i < currentNetwork.userLocationTable.data.length; i++) {
            locationLabels.push(currentNetwork.userLocationTable.data[i][currentNetwork.userLocationSchema.label]);
        }
    }

    if(currentNetwork.userLinkTable) {
        // @ts-ignore
        var userLinkData: any = currentNetwork.userLinkTable.data;
        if (currentNetwork.userLinkSchema) {
            var userLinkSchema: VLinkSchema = currentNetwork.userLinkSchema;
        } else {
            var userLinkSchema: VLinkSchema = new VLinkSchema();
        }

        for (var i = 1; i < userLinkData.length; i++) {
            if (locationLabels.indexOf(userLinkData[i][userLinkSchema.location_source]) == -1) {
                locationLabels.push(userLinkData[i][userLinkSchema.location_source])
            }
            if (locationLabels.indexOf(userLinkData[i][userLinkSchema.location_target]) == -1) {
                locationLabels.push(userLinkData[i][userLinkSchema.location_target])
            }
        }
    }


    var normalizedLocationSchema: datamanager.LocationSchema = datamanager.getDefaultLocationSchema();
    if (currentNetwork.userLocationTable) {
        normalizedLocationSchema = currentNetwork.userLocationSchema
    }

    var normalizedLocationTable: any[] = [];
    var locationName: string = "";
    var row: any;

    // If the user has specified a location table, normalize
    // that table:
    if (currentNetwork.userLocationTable) {
        var userLocationTable: any = currentNetwork.userLocationTable.data;
        var userLocationSchema: any = currentNetwork.userLocationSchema;
        for (var i = 1; i < userLocationTable.length; i++) {
            row = [normalizedLocationTable.length, 0, 0, 0, 0]
            locationName = userLocationTable[i][userLocationSchema.label]
            row[normalizedLocationSchema.id] = locationLabels.indexOf(locationName)
            row[normalizedLocationSchema.label] = locationName;
            row[normalizedLocationSchema.geoname] = userLocationTable[i][userLocationSchema.geoname];
            row[normalizedLocationSchema.latitude] = userLocationTable[i][userLocationSchema.latitude];
            row[normalizedLocationSchema.longitude] = userLocationTable[i][userLocationSchema.longitude];
            normalizedLocationTable.push(row)
        }
    }
    // if there exist any locations, check if they are
    // listed in the location table
    if (locationLabels.length > 0) {
        for (var i = 0; i < locationLabels.length; i++) {
            var found: boolean = false;
            for (var j = 0; j < normalizedLocationTable.length; j++) {
                if (normalizedLocationTable[j][1] == locationLabels[i]) {
                    found = true;
                }
            }

            if (!found) {
                row = [normalizedLocationTable.length, 0, 0, 0, 0]
                locationName = locationLabels[i]
                row[normalizedLocationSchema.label] = locationName;
                row[normalizedLocationSchema.geoname] = locationName;
                normalizedLocationTable.push(row)
            }
        }
    }
    return {normalizedLocationSchema, normalizedLocationTable, locationName, locationLabels};
}

export function importIntoNetworkcube(currentNetwork: Network, sessionid: string, s: boolean) {
    currentNetwork.ready = false;

    if (currentNetwork.userLinkSchema) {
        var userLinkSchema: VLinkSchema = currentNetwork.userLinkSchema;
    } else {
        var userLinkSchema: VLinkSchema = new VLinkSchema();
    }

    if (currentNetwork.userNodeSchema) {
        var userNodeSchema: VNodeSchema = currentNetwork.userNodeSchema;
    } else {
        var userNodeSchema: VNodeSchema = new VNodeSchema();
    }

    // check minimal conditions to create and import a network
    if (currentNetwork.userLinkSchema && currentNetwork.userNodeSchema){
        if (!
            ((currentNetwork.userLinkSchema.source > -1
                && currentNetwork.userLinkSchema.target > -1)
                || (currentNetwork.userNodeSchema.label > -1
                    && currentNetwork.userNodeSchema.relation.length > -1)
            )) {
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
    var normalizedNodeTable: any[] = [];
    var normalizedLinkTable: any[] = [];

    // get standard schemas
    // INIT NODE SCHEMA
    var normalizedNodeSchema: datamanager.NodeSchema = new datamanager.NodeSchema(0);
    
    
    // INITIALZE NORMALIZED SCHEMAS WITH USER'S ATTRIBUTES
    
    // required attributes
    normalizedNodeSchema.id = 0;
    normalizedNodeSchema.label = 1;
    
    var nodeColCount: number = 2
    if (currentNetwork.userNodeSchema) {
        for (var p in currentNetwork.userNodeSchema) {
            if (currentNetwork.userNodeSchema.hasOwnProperty(p)
            && (currentNetwork.userNodeSchema as any)[p] > -1
            && p != 'id'
            && p != 'label'
            && p != 'relation'
            && (currentNetwork.userNodeSchema as any)[p] > 0
            ) {
                (normalizedNodeSchema as any)[p] = nodeColCount++;
            }
        }
    }
    
    // INIT LINK SCHEMA
    var normalizedLinkSchema: datamanager.LinkSchema = new datamanager.LinkSchema(0, 1, 2);
    // required attributes
    normalizedLinkSchema.id = 0;
    normalizedLinkSchema.source = 1;
    normalizedLinkSchema.target = 2;

    var linkColCount: number = 3
    if (currentNetwork.userLinkSchema) {
        for (var p in currentNetwork.userLinkSchema) {
            if (currentNetwork.userLinkSchema.hasOwnProperty(p)
                && (currentNetwork.userLinkSchema as any)[p] > -1
                && p != 'id'
                && p != 'source'
                && p != 'target'
                && p != 'location_source'
                && p != 'location_source'
            ) {
                (normalizedLinkSchema as any)[p] = linkColCount++;
            }
        }

    }


    ///////////////////////////////
    // PROCESS SINGLE NODE-TABLE //
    ///////////////////////////////

    if (currentNetwork.userLinkTable == undefined
        && currentNetwork.userNodeTable != undefined) {
        // create link table and fill
        var id: number;
        var relCol: number;
        var newNodeRow: any[];
        var newLinkRow: any[];
        var rowNum: number;
        var userNodeTable: any[] = currentNetwork.userNodeTable.data;

        var colCount: number = 3
        normalizedLinkSchema.linkType = colCount++;
        if (datamanager.isValidIndex(userNodeSchema.time)) {
            normalizedLinkSchema.time = colCount++;
        }

        // In the normalized node table, create one row for each row in the node table, 
        // if name does not already exists
        var nodeLabels: any = []
        var nodeIds: any = []
        for (var i = 1; i < userNodeTable.length; i++) {
            newRow = [0, 0, 0, 0, 0];
            id = parseInt(userNodeTable[i][userNodeSchema.id]);
            nodeIds.push(id)
            newRow[normalizedNodeSchema.id] = id
            newRow[normalizedNodeSchema.label] = userNodeTable[i][userNodeSchema.label]
            newRow[normalizedNodeSchema.shape] = userNodeTable[i][userNodeSchema.shape]
            newRow[normalizedNodeSchema.color] = userNodeTable[i][userNodeSchema.color]
            nodeLabels.push(userNodeTable[i][userNodeSchema.label])
            normalizedNodeTable.push(newRow);
        }

        // create a node row for each node in a relation field 
        // that does not yet has an entry in the node table.
        // Plus, create a link in the link table.
        for (var i = 1; i < userNodeTable.length; i++) {

            // Iterate through all relation columns
            var row: any;
            var sourceId: number;
            var targetId: number;
            for (var j = 0; j < userNodeSchema.relation.length; j++) {
                row = userNodeTable[i];
                relCol = userNodeSchema.relation[j];
                sourceId = nodeIds[i - 1]
                // dont create relation if field entry is empty;
                if (row[relCol].length == 0)
                    continue;

                // check if node already exist
                rowNum = nodeLabels.indexOf(row[relCol]);

                if (rowNum < 0) {
                    // create new node in node table
                    newNodeRow = [0, 0];
                    newNodeRow[normalizedNodeSchema.id] = normalizedNodeTable.length;
                    nodeIds.push(normalizedNodeTable.length - 1)
                    nodeLabels.push(row[relCol])
                    newNodeRow[normalizedNodeSchema.label] = row[relCol]
                    normalizedNodeTable.push(newNodeRow)
                    targetId = normalizedNodeTable.length - 1
                }
                else {
                    targetId = rowNum
                }

                // create entry in link table
                newLinkRow = []
                for (var k = 0; k < colCount; k++) {
                    newLinkRow.push('');
                }
                newLinkRow[normalizedLinkSchema.id] = normalizedLinkTable.length;
                newLinkRow[normalizedLinkSchema.source] = sourceId
                newLinkRow[normalizedLinkSchema.target] = targetId
                newLinkRow[normalizedLinkSchema.linkType] = userNodeTable[0][relCol] // set column header as relation type
                if (datamanager.isValidIndex(userNodeSchema.time))
                    newLinkRow[normalizedLinkSchema.time] = row[userNodeSchema.time]
                normalizedLinkTable.push(newLinkRow);
            }
        }
    }

    ///////////////////////////////
    // PROCESS SINGLE LINK-TABLE //
    ///////////////////////////////

    var nodeNames: string[] = [];
    // if(currentNetwork.userNodeTable && currentNetwork.userNodeSchema.label){
    //     for(var n in currentNetwork.userNodeTable.data){
    //         nodeNames.push(currentNetwork.userNodeTable.data[n][currentNetwork.userNodeSchema.label])
    //     }
    // }

    if (currentNetwork.userNodeTable == undefined
        && currentNetwork.userLinkTable != undefined) {
        var nodeLocations: number[][] = [];
        var nodeTimes: number[][] = [];
        var nodeTypes: string[] = [];

        var userLinkData: any = currentNetwork.userLinkTable.data;
        var sourceId: number;
        var targetId: number;
        var nodeName: string;
        var locationName: string;
        var timeString: string;
        var timeFormatted: string;

        // Extract node labels and create (simple) normalized node table
        var row: any;
        for (var i = 1; i < userLinkData.length; i++) {
            // source
            nodeName = userLinkData[i][userLinkSchema.source];
            if (nodeNames.indexOf(nodeName) < 0) {
                row = [nodeNames.length, nodeName];
                nodeNames.push(nodeName);
                normalizedNodeTable.push(row)
            }

            // target
            nodeName = userLinkData[i][userLinkSchema.target];
            if (nodeNames.indexOf(nodeName) < 0) {
                row = [nodeNames.length, nodeName];
                nodeNames.push(nodeName);
                normalizedNodeTable.push(row)
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
        var newRow: any[];
        var linkTime: string;
        var found: boolean = true;
        var userLinkData: any = currentNetwork.userLinkTable.data;
        for (var i = 1; i < userLinkData.length; i++) {
            newRow = []
            for (var k = 0; k < linkColCount; k++) {
                newRow.push('');
            }
            for (var p in userLinkSchema) {
                if (userLinkSchema.hasOwnProperty(p)
                    && (userLinkSchema as any)[p] > -1) {
                    newRow[(normalizedLinkSchema as any)[p]] = userLinkData[i][(userLinkSchema as any)[p]];
                }
            }

            sourceId = nodeNames.indexOf(userLinkData[i][userLinkSchema.source]);
            newRow[normalizedLinkSchema.source] = sourceId;

            targetId = nodeNames.indexOf(userLinkData[i][userLinkSchema.target]);
            newRow[normalizedLinkSchema.target] = targetId;

            normalizedLinkTable.push(newRow)
        }

        // check if location and time information exists for nodes
        var time: any;
        var locationsFound: boolean = false;
        var timeFound: boolean = false;


        if (datamanager.isValidIndex(userLinkSchema.location_source)
            || datamanager.isValidIndex(userLinkSchema.location_target)) {
            // set location schema index to next new column
            normalizedNodeSchema.location = nodeColCount++;
            // append new field to each row in node table
            for (var i = 0; i < normalizedNodeTable.length; i++) {
                normalizedNodeTable[i].push('')
            }
            // FYI: node table has now at least 3 rows (id, name, location)
            if (datamanager.isValidIndex(userLinkSchema.time)) {
                // set time schema index to next new column
                normalizedNodeSchema.time = nodeColCount++;
                // append new field to each row in node table
                for (var i = 0; i < normalizedNodeTable.length; i++) {
                    normalizedNodeTable[i].push('')
                }
                // FYI: node table has now at least 4 rows (id, name, location, time)
            }

            // insert locations and ev. times into node table, as found in linktable
            for (var i = 1; i < userLinkData.length; i++) {
                var nodeRow: any, rowToDuplicate: any;
                // do for source location
                nodeName = userLinkData[i][userLinkSchema.source]
                if (datamanager.isValidIndex(userLinkSchema.location_source)
                    && userLinkData[i][userLinkSchema.location_source]
                    && userLinkData[i][userLinkSchema.location_source] != '') {
                    var len = normalizedNodeTable.length
                    for (var j = 0; j < len; j++) {
                        nodeRow = normalizedNodeTable[j];
                        if (nodeRow[normalizedNodeSchema.label] == nodeName) {
                            rowToDuplicate = undefined;
                            if (datamanager.isValidIndex(normalizedNodeSchema.time)) {
                                // if there is already a time but no location,  
                                if (nodeRow[normalizedNodeSchema.time] == userLinkData[i][userLinkSchema.time]) {
                                    if (nodeRow[normalizedNodeSchema.location] && nodeRow[normalizedNodeSchema.location] != '') {
                                        rowToDuplicate = undefined;
                                    } else {
                                        rowToDuplicate = nodeRow;
                                    }
                                    // nothing here node has already a location for this time, continue with next row.
                                    j = len; // go to end of table
                                    break;
                                } else {
                                    rowToDuplicate = nodeRow;
                                }
                            } else {
                                // just insert, no dupliation required
                                nodeRow[normalizedNodeSchema.location] = userLinkData[i][userLinkSchema.location_source]
                                j = len; // go to end of table
                                break;
                            }
                        }
                    }

                    if (rowToDuplicate) {
                        if (rowToDuplicate[normalizedNodeSchema.location] == '') {
                            rowToDuplicate[normalizedNodeSchema.location] = userLinkData[i][userLinkSchema.location_source]
                            rowToDuplicate[normalizedNodeSchema.time] = userLinkData[i][userLinkSchema.time]
                        } else {
                            var newRowNode = []
                            for (var c = 0; c < rowToDuplicate.length; c++) {
                                newRowNode.push(rowToDuplicate[c])
                            }
                            newRowNode[normalizedNodeSchema.location] = userLinkData[i][userLinkSchema.location_source]
                            newRowNode[normalizedNodeSchema.time] = userLinkData[i][userLinkSchema.time]
                            normalizedNodeTable.push(newRowNode);
                        }
                    }
                }

                // do for target location
                nodeName = userLinkData[i][userLinkSchema.target]
                if (datamanager.isValidIndex(userLinkSchema.location_target)
                    && userLinkData[i][userLinkSchema.location_target]
                    && userLinkData[i][userLinkSchema.location_target] != '') {
                    var len = normalizedNodeTable.length
                    for (var j = 0; j < len; j++) {
                        nodeRow = normalizedNodeTable[j];
                        if (nodeRow[normalizedNodeSchema.label] == nodeName) {
                            rowToDuplicate = undefined;
                            if (datamanager.isValidIndex(normalizedNodeSchema.time)) {
                                // if location is not empty, 
                                if (nodeRow[normalizedNodeSchema.time] == userLinkData[i][userLinkSchema.time]) {
                                    if (nodeRow[normalizedNodeSchema.location] && nodeRow[normalizedNodeSchema.location] != '') {
                                        rowToDuplicate = undefined;
                                    } else {
                                        rowToDuplicate = nodeRow;
                                    }
                                    // nothing here node has already a location for this time, continue with next row.
                                    j = len; // go to end of table
                                    break;
                                } else {
                                    rowToDuplicate = nodeRow;
                                }
                            } else {
                                // just insert, no dupliation required
                                nodeRow[normalizedNodeSchema.location] = userLinkData[i][userLinkSchema.location_target]
                                j = len; // go to end of table
                                break;
                            }
                        }
                    }

                    if (rowToDuplicate) {
                        if (rowToDuplicate[normalizedNodeSchema.location] == '') {
                            rowToDuplicate[normalizedNodeSchema.location] = userLinkData[i][userLinkSchema.location_target]
                            rowToDuplicate[normalizedNodeSchema.time] = userLinkData[i][userLinkSchema.time]
                        } else {
                            // duplicate
                            var newRowNode = []
                            for (var c = 0; c < rowToDuplicate.length; c++) {
                                newRowNode.push(rowToDuplicate[c])
                            }
                            newRowNode[normalizedNodeSchema.location] = userLinkData[i][userLinkSchema.location_target]
                            newRowNode[normalizedNodeSchema.time] = userLinkData[i][userLinkSchema.time]
                            normalizedNodeTable.push(newRowNode);
                        }
                    }
                }
            }
        } // end of checking for node times and location in link table
    } // end of link table normalization

    // FORMAT TIMES INTO ISO STANDARD

    if (currentNetwork.hasOwnProperty('timeFormat') && currentNetwork.timeFormat != undefined && currentNetwork.timeFormat.length > 0) {
        var format: string = currentNetwork.timeFormat;
        if (normalizedLinkSchema.time != undefined && normalizedLinkSchema.time > -1) {
            for (var i = 0; i < normalizedLinkTable.length; i++) {
                time = moment.utc(normalizedLinkTable[i][normalizedLinkSchema.time], format).format(main.timeFormat())
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
                normalizedNodeTable[i][normalizedNodeSchema.time] = time
            }
        }
    }

    var {normalizedLocationSchema, normalizedLocationTable, locationName, locationLabels} = createAndNormaliseLocationTable(currentNetwork);

    if (normalizedNodeSchema.location > -1) {
        for (var i = 0; i < normalizedNodeTable.length; i++) {
            locationName = normalizedNodeTable[i][normalizedNodeSchema.location].trim();
            id = locationLabels.indexOf(locationName);
            normalizedNodeTable[i][normalizedNodeSchema.location] = id;
        }
    }


    // set tables to networkcube data set:
    var params: any = {}
    params.name = currentNetwork.name;
    params.nodeTable = normalizedNodeTable;
    params.linkTable = normalizedLinkTable;
    params.nodeSchema = normalizedNodeSchema;
    params.linkSchema = normalizedLinkSchema;
    params.locationTable = normalizedLocationTable;
    params.locationSchema = normalizedLocationSchema;
    params.timeFormat = currentNetwork.timeFormat;
    params.directed = currentNetwork.directed;
    var dataset: datamanager.DataSet = new datamanager.DataSet(params);

    if (currentNetwork.userLocationTable) {
        currentNetwork.userLocationTable.data = []
        currentNetwork.userLocationTable.data.push(['Id', 'User Name', 'Geoname', 'Longitude', 'Latitude'])
        for (var i = 0; i < normalizedLocationTable.length; i++) {
            currentNetwork.userLocationTable.data.push(normalizedLocationTable[i]);
        }
    }


    // make ids integer
    for (var i = 0; i < normalizedNodeTable.length; i++) {
        normalizedNodeTable[i][0] = parseInt(normalizedNodeTable[i][0])
    }
    for (var i = 0; i < normalizedLinkTable.length; i++) {
        normalizedLinkTable[i][0] = parseInt(normalizedLinkTable[i][0])
    }

    // save network on the vistorian side
    currentNetwork.ready = true;
    storage.saveNetwork(currentNetwork, sessionid);

    main.setDataManagerOptions({ keepOnlyOneSession: false });

    main.importData(sessionid, dataset);

    return dataset;
}