/*
Convenient class that provides an API to the vistorian "framework"
and the user data.
This API should be used in every visualization.
*/


import * as dynamicgraphutils from "vistorian-core/src/dynamicgraphutils";
import * as utils from "vistorian-core/src/utils";
import * as main from "vistorian-core/src/main";

import $ from "jquery";
import * as Papa from "papaparse";
import * as moment from "moment";

import * as storage from "./storage";

const head: any = $("head");
head.append(
  "<link href='https://fonts.googleapis.com/css?family=Open+Sans+Condensed:300italic,700,300&subset=latin,latin-ext' rel='stylesheet' type='text/css'></head>"
);
head.append(
  "<link href='https://fonts.googleapis.com/css?family=Great+Vibes' rel='stylesheet' type='text/css'>"
);
head.append(
  "<link href='https://fonts.googleapis.com/css?family=Playfair+Display' rel='stylesheet' type='text/css'>"
);
head.append(
  "<link href='https://fonts.googleapis.com/css?family=Amatic+SC:400,700' rel='stylesheet' type='text/css'>"
);
head.append(
  "<link href='https://fonts.googleapis.com/css?family=Lora' rel='stylesheet' type='text/css'>"
);
head.append(
  "<link href='https://fonts.googleapis.com/css?family=Comfortaa' rel='stylesheet' type='text/css'>"
);
head.append(
  "<link href='https://fonts.googleapis.com/css?family=Caveat' rel='stylesheet' type='text/css'>"
);
head.append(
  "<link href='https://fonts.googleapis.com/css?family=IM+Fell+English' rel='stylesheet' type='text/css'>"
);

function append(url: string) {
  const script: any = document.createElement("script");
  script.type = "text/javascript";
  script.src = url;
  $("head").append(script);
}

const tables: any[] = [];

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
  location = -1; // location of node
  id = 0;
  label = -1;
  time = -1;
  // nodeType: number = -1;
  // color: number = -1;
  shape = -1;
  constructor() {
    super("userNodeSchema");
  }
}

export class VLinkSchema extends VTableSchema {
  location_source = -1; // location of source node
  location_target = -1; // location of target node
  id = 0;
  source = -1;
  target = -1;
  weight = -1;
  time = -1;
  linkType = -1;
  directed = -1;
  constructor() {
    super("userLinkSchema");
  }
}
export class VLocationSchema extends VTableSchema {
  id = 0;
  label = 1;
  geoname = 2;
  longitude = 3;
  latitude = 4;
  constructor() {
    super("userLocationSchema");
  }
}

// this represents a network the user created, including
// - the originally formatted tables
// - the node and edge schemas on those tables
// - the networkcube data set with the normalized tables
export class Network {
  id: number;
  name = "";
  userNodeTable: VTable | undefined = undefined; // ??
  userLinkTable: VTable | undefined = undefined; // ??;
  userNodeSchema: VNodeSchema | undefined;
  userLinkSchema: VLinkSchema | undefined;
  userLocationTable: VTable | undefined = undefined; // ??;
  userLocationSchema: dynamicgraphutils.LocationSchema =
    new dynamicgraphutils.LocationSchema(0, 0); // ??
  // networkCubeDataSet: networkcube.DataSet;
  networkConfig = "both";
  timeFormat = "";
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

export function loadCSV(
  files: File[],
  callBack: () => void,
  sessionid: string
) {
  let loadCount = 0;
  let table: any;
  const tables: VTable[] = [];
  const fileContents: any[] = [];
  const readers: FileReader[] = [];
  for (let i = 0, f: File; i < files.length; i++) {
    f = files[i];
    const reader: FileReader = new FileReader();
    (reader as any).filename = f.name.replace(/\s/g, "_").split("_")[0];
    readers[i] = reader;

    reader.onload = function (f) {
      const obj = {
        content: (<FileReader>f.target).result,
        name: (f.target as any).filename,
      };
      const i: number = readers.indexOf(<FileReader>f.target);
      fileContents[i] = obj;
      const content: any = fileContents[i].content
        .replace(', "', ',"')
        .replace('" ,', '",');
      table = new VTable(
        // eliminate spaces in the name because they will
        // interfere with creating html element ids
        // clean ', "'
        files[i].name.replace(".csv", "").replace(/\s/g, "_").trim(),
        Papa.parse(
          content
          // {
          //     // quotes: true,
          //     // quoteChar: '"',
          //     // header: true,
          //     // newline: "\r\n"
          // }
        ).data
      );
      // remove white spaces, extra cols and rows etc..
      formatTable(table);

      storage.saveUserTable(table, sessionid);
      loadCount++;

      if (loadCount == files.length) callBack();
    };
    reader.readAsText(f);
  }
}

export function exportTableCSV(table: VTable) {
  const csv: any = Papa.unparse(table.data, { quotes: true });
  const textFileAsBlob: Blob = new Blob([csv], { type: "text/csv" });
  const fileNameToSaveAs: string = table.name + ".csv";
  const downloadLink: any = document.createElement("a");
  downloadLink.download = fileNameToSaveAs;
  downloadLink.href = (window as any).webkitURL.createObjectURL(textFileAsBlob);
  downloadLink.click();
}

export function exportLocationTableCSV(networkname: any, table: any) {
  const csv: any = Papa.unparse(table, { quotes: true });
  const textFileAsBlob: Blob = new Blob([csv], { type: "text/csv" });
  const fileNameToSaveAs: string = networkname + "-locations.csv";
  const downloadLink: any = document.createElement("a");
  downloadLink.download = fileNameToSaveAs;
  downloadLink.href = (window as any).webkitURL.createObjectURL(textFileAsBlob);
  downloadLink.click();
}

// Cleans and formats the data as it comes from the user,
// for proper display and processing.
// - trim
// - add line numbers
export function formatTable(table: VTable) {
  const data: any[] = [];
  const indexify = !(
    table.data[0][0] == "ID" ||
    table.data[0][0] == "id" ||
    table.data[0][0] == "Id" ||
    table.data[0][0] == "Index" ||
    table.data[0][0].includes("index") ||
    table.data[0][0].includes("Index")
  );

  const numCols: number = table.data[0].length;
  let emptyCols = 0;
  let row: any[];
  for (let i = 0; i < table.data.length; i++) {
    row = [];
    emptyCols = 0;
    if (indexify) {
      if (i == 0) row.push("Index");
      else row.push(i - 1 + "");
    }
    for (let j = 0; j < numCols; j++) {
      if (table.data[i][j] == undefined) {
        table.data[i][j] = "";
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

/**
 * Checks the time column in the passed table against the entered
 * time format and returns an array of fields that do not match the
 * that time format.
 * @param  {Table}  table      [description]
 * @param  {number} timeCol    [description]
 * @param  {string} timeFormat [description]
 * @return {[type]}            [description]
 */
export function checkTime(
  table: VTable,
  timeCol: number,
  timeFormat: string
): number[] {
  let timeString: string;
  const error: number[] = [];
  for (let i = 0; i < table.data.length; i++) {
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
  const emptyColBool: any[] = [];
  for (let i = 0; i < table.length; i++) {
    for (let j = 0; j < table[i].length; j++) {
      if (table[i][j] != undefined) table[i][j] = table[i][j].trim();
    }
  }
}

export function setHeader(elementId: string, datasetname: string) {
  const header: any = $(
    '<a href="../index.html"><img width="100%" src="../static/logos/logo-networkcube.png"/></a>'
  );
  $("#" + elementId).append(header);
  const dataname: any = $(
    '\
        <p style="margin:5px;background-color:#eeeeee;border-radius:2px;padding-left:10px;padding:5px;"><b>Data:</b> ' +
      datasetname +
      "</h2>"
  );
  $("#" + elementId).append(dataname);

  //$('#' + elementId).append('')
  //$('#' + elementId).append('')
  //$('#' + elementId).append('')

  const vars: any = utils.getUrlVars();

  // VS: Clicks on Return to DataView
  $("#" + elementId).append(
    '<a href="../web/dataview.html?session=' +
      vars["session"] +
      "&datasetName" +
      vars["datasetName"] +
      '" style="margin:5px;padding-left:5px;" onclick="trace.event(\'log_4\', document.location.pathname, \'Return to Data View Button\', \'Clicked\');" target="_blank">Return to Dataview</a>'
  );
  $("#" + elementId).append("<br/><br/>");
}

export function exportNetwork(network: Network) {
  const blurb: Network = network;

  const element: any = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(blurb))
  );
  element.setAttribute("download", network.name + ".vistorian");
  element.style.display = "none";
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

  const locationLabels: string[] = [];
  if (currentNetwork.userLocationTable) {
    // store all locations for easy index lookup
    for (let i = 1; i < currentNetwork.userLocationTable.data.length; i++) {
      locationLabels.push(
        currentNetwork.userLocationTable.data[i][
          currentNetwork.userLocationSchema.label
        ]
      );
    }
  }

  if (currentNetwork.userLinkTable) {
    const userLinkData: any = currentNetwork.userLinkTable.data;
    let userLinkSchema: VLinkSchema;
    if (currentNetwork.userLinkSchema) {
      userLinkSchema = currentNetwork.userLinkSchema;
    } else {
      userLinkSchema = new VLinkSchema();
    }

    for (let i = 1; i < userLinkData.length; i++) {
      if (
        locationLabels.indexOf(
          userLinkData[i][userLinkSchema.location_source]
        ) == -1
      ) {
        locationLabels.push(userLinkData[i][userLinkSchema.location_source]);
      }
      if (
        locationLabels.indexOf(
          userLinkData[i][userLinkSchema.location_target]
        ) == -1
      ) {
        locationLabels.push(userLinkData[i][userLinkSchema.location_target]);
      }
    }
  }

  let normalizedLocationSchema: dynamicgraphutils.LocationSchema =
    dynamicgraphutils.getDefaultLocationSchema();
  if (currentNetwork.userLocationTable) {
    normalizedLocationSchema = currentNetwork.userLocationSchema;
  }

  const normalizedLocationTable: any[] = [];
  let locationName = "";
  let row: any;

  // If the user has specified a location table, normalize
  // that table:
  if (currentNetwork.userLocationTable) {
    const userLocationTable: any = currentNetwork.userLocationTable.data;
    const userLocationSchema: any = currentNetwork.userLocationSchema;
    for (let i = 1; i < userLocationTable.length; i++) {
      row = [normalizedLocationTable.length, 0, 0, 0, 0];
      locationName = userLocationTable[i][userLocationSchema.label];
      row[normalizedLocationSchema.id] = locationLabels.indexOf(locationName);
      row[normalizedLocationSchema.label] = locationName;
      row[normalizedLocationSchema.geoname] =
        userLocationTable[i][userLocationSchema.geoname];
      row[normalizedLocationSchema.latitude] =
        userLocationTable[i][userLocationSchema.latitude];
      row[normalizedLocationSchema.longitude] =
        userLocationTable[i][userLocationSchema.longitude];
      normalizedLocationTable.push(row);
    }
  }
  // if there exist any locations, check if they are
  // listed in the location table
  if (locationLabels.length > 0) {
    for (let i = 0; i < locationLabels.length; i++) {
      let found = false;
      for (let j = 0; j < normalizedLocationTable.length; j++) {
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
  return {
    normalizedLocationSchema,
    normalizedLocationTable,
    locationName,
    locationLabels,
  };
}

// export function importIntoNetworkcube(currentNetwork: Network, sessionid: string, s: boolean) {
//     currentNetwork.ready = false;

//     if (currentNetwork.userLinkSchema) {
//         var userLinkSchema: VLinkSchema = currentNetwork.userLinkSchema;
//     } else {
//         var userLinkSchema: VLinkSchema = new VLinkSchema();
//     }

//     if (currentNetwork.userNodeSchema) {
//         var userNodeSchema: VNodeSchema = currentNetwork.userNodeSchema;
//     } else {
//         var userNodeSchema: VNodeSchema = new VNodeSchema();
//     }

//     // check minimal conditions to create and import a network
//     if (currentNetwork.userLinkSchema && currentNetwork.userNodeSchema){
//         if (!
//             ((currentNetwork.userLinkSchema.source > -1
//                 && currentNetwork.userLinkSchema.target > -1)
//                 || (currentNetwork.userNodeSchema.label > -1
//                     && currentNetwork.userNodeSchema.relation.length > -1)
//             )) {
//             // nothing to import at this point as no schemas defined
//             return;
//         }
//     }
//     else {
//         return;
//     }

//     // trim cell entries (remove overhead white space)
//     if (currentNetwork.userNodeTable) {
//         cleanTable(currentNetwork.userNodeTable.data);
//     }

//     if (currentNetwork.userLinkTable) {
//         cleanTable(currentNetwork.userLinkTable.data);
//     }

//     // Start with empty normalized tables
//     var normalizedNodeTable: any[] = [];
//     var normalizedLinkTable: any[] = [];

//     // get standard schemas
//     // INIT NODE SCHEMA
//     var normalizedNodeSchema: datamanager.NodeSchema = new datamanager.NodeSchema(0);

//     // INITIALZE NORMALIZED SCHEMAS WITH USER'S ATTRIBUTES

//     // required attributes
//     normalizedNodeSchema.id = 0;
//     normalizedNodeSchema.label = 1;

//     var nodeColCount: number = 2
//     if (currentNetwork.userNodeSchema) {
//         for (var p in currentNetwork.userNodeSchema) {
//             if (currentNetwork.userNodeSchema.hasOwnProperty(p)
//             && (currentNetwork.userNodeSchema as any)[p] > -1
//             && p != 'id'
//             && p != 'label'
//             && p != 'relation'
//             && (currentNetwork.userNodeSchema as any)[p] > 0
//             ) {
//                 (normalizedNodeSchema as any)[p] = nodeColCount++;
//             }
//         }
//     }

//     // INIT LINK SCHEMA
//     var normalizedLinkSchema: datamanager.LinkSchema = new datamanager.LinkSchema(0, 1, 2);
//     // required attributes
//     normalizedLinkSchema.id = 0;
//     normalizedLinkSchema.source = 1;
//     normalizedLinkSchema.target = 2;

//     var linkColCount: number = 3
//     if (currentNetwork.userLinkSchema) {
//         for (var p in currentNetwork.userLinkSchema) {
//             if (currentNetwork.userLinkSchema.hasOwnProperty(p)
//                 && (currentNetwork.userLinkSchema as any)[p] > -1
//                 && p != 'id'
//                 && p != 'source'
//                 && p != 'target'
//                 && p != 'location_source'
//                 && p != 'location_source'
//             ) {
//                 (normalizedLinkSchema as any)[p] = linkColCount++;
//             }
//         }

//     }

//     ///////////////////////////////
//     // PROCESS SINGLE NODE-TABLE //
//     ///////////////////////////////

//     if (currentNetwork.userLinkTable == undefined
//         && currentNetwork.userNodeTable != undefined) {
//         // create link table and fill
//         var id: number;
//         var relCol: number;
//         var newNodeRow: any[];
//         var newLinkRow: any[];
//         var rowNum: number;
//         var userNodeTable: any[] = currentNetwork.userNodeTable.data;

//         var colCount: number = 3
//         normalizedLinkSchema.linkType = colCount++;
//         if (datamanager.isValidIndex(userNodeSchema.time)) {
//             normalizedLinkSchema.time = colCount++;
//         }

//         // In the normalized node table, create one row for each row in the node table,
//         // if name does not already exists
//         var nodeLabels: any = []
//         var nodeIds: any = []
//         for (var i = 1; i < userNodeTable.length; i++) {
//             newRow = [0, 0, 0, 0, 0];
//             id = parseInt(userNodeTable[i][userNodeSchema.id]);
//             nodeIds.push(id)
//             newRow[normalizedNodeSchema.id] = id
//             newRow[normalizedNodeSchema.label] = userNodeTable[i][userNodeSchema.label]
//             newRow[normalizedNodeSchema.shape] = userNodeTable[i][userNodeSchema.shape]
//             newRow[normalizedNodeSchema.color] = userNodeTable[i][userNodeSchema.color]
//             nodeLabels.push(userNodeTable[i][userNodeSchema.label])
//             normalizedNodeTable.push(newRow);
//         }

//         // create a node row for each node in a relation field
//         // that does not yet has an entry in the node table.
//         // Plus, create a link in the link table.
//         for (var i = 1; i < userNodeTable.length; i++) {

//             // Iterate through all relation columns
//             var row: any;
//             var sourceId: number;
//             var targetId: number;
//             for (var j = 0; j < userNodeSchema.relation.length; j++) {
//                 row = userNodeTable[i];
//                 relCol = userNodeSchema.relation[j];
//                 sourceId = nodeIds[i - 1]
//                 // dont create relation if field entry is empty;
//                 if (row[relCol].length == 0)
//                     continue;

//                 // check if node already exist
//                 rowNum = nodeLabels.indexOf(row[relCol]);

//                 if (rowNum < 0) {
//                     // create new node in node table
//                     newNodeRow = [0, 0];
//                     newNodeRow[normalizedNodeSchema.id] = normalizedNodeTable.length;
//                     nodeIds.push(normalizedNodeTable.length - 1)
//                     nodeLabels.push(row[relCol])
//                     newNodeRow[normalizedNodeSchema.label] = row[relCol]
//                     normalizedNodeTable.push(newNodeRow)
//                     targetId = normalizedNodeTable.length - 1
//                 }
//                 else {
//                     targetId = rowNum
//                 }

//                 // create entry in link table
//                 newLinkRow = []
//                 for (var k = 0; k < colCount; k++) {
//                     newLinkRow.push('');
//                 }
//                 newLinkRow[normalizedLinkSchema.id] = normalizedLinkTable.length;
//                 newLinkRow[normalizedLinkSchema.source] = sourceId
//                 newLinkRow[normalizedLinkSchema.target] = targetId
//                 newLinkRow[normalizedLinkSchema.linkType] = userNodeTable[0][relCol] // set column header as relation type
//                 if (datamanager.isValidIndex(userNodeSchema.time))
//                     newLinkRow[normalizedLinkSchema.time] = row[userNodeSchema.time]
//                 normalizedLinkTable.push(newLinkRow);
//             }
//         }
//     }

//     ///////////////////////////////
//     // PROCESS SINGLE LINK-TABLE //
//     ///////////////////////////////

//     var nodeNames: string[] = [];
//     // if(currentNetwork.userNodeTable && currentNetwork.userNodeSchema.label){
//     //     for(var n in currentNetwork.userNodeTable.data){
//     //         nodeNames.push(currentNetwork.userNodeTable.data[n][currentNetwork.userNodeSchema.label])
//     //     }
//     // }

//     if (currentNetwork.userNodeTable == undefined
//         && currentNetwork.userLinkTable != undefined) {
//         var nodeLocations: number[][] = [];
//         var nodeTimes: number[][] = [];
//         var nodeTypes: string[] = [];

//         var userLinkData: any = currentNetwork.userLinkTable.data;
//         var sourceId: number;
//         var targetId: number;
//         var nodeName: string;
//         var locationName: string;
//         var timeString: string;
//         var timeFormatted: string;

//         // Extract node labels and create (simple) normalized node table
//         var row: any;
//         for (var i = 1; i < userLinkData.length; i++) {
//             // source
//             nodeName = userLinkData[i][userLinkSchema.source];
//             if (nodeNames.indexOf(nodeName) < 0) {
//                 row = [nodeNames.length, nodeName];
//                 nodeNames.push(nodeName);
//                 normalizedNodeTable.push(row)
//             }

//             // target
//             nodeName = userLinkData[i][userLinkSchema.target];
//             if (nodeNames.indexOf(nodeName) < 0) {
//                 row = [nodeNames.length, nodeName];
//                 nodeNames.push(nodeName);
//                 normalizedNodeTable.push(row)
//             }
//         }
//     }

//     // At this point, there is a normalzied node table
//     // if the user has not specified any link table, a normalized
//     // link table has been created above.
//     // If he has provided a link table, it is traversed below and
//     // the references to node names are put into place.
//     if (currentNetwork.userLinkTable != undefined) {
//         // create normalized link table and replace source/target label by source/target id
//         normalizedLinkTable = [];
//         var newRow: any[];
//         var linkTime: string;
//         var found: boolean = true;
//         var userLinkData: any = currentNetwork.userLinkTable.data;
//         for (var i = 1; i < userLinkData.length; i++) {
//             newRow = []
//             for (var k = 0; k < linkColCount; k++) {
//                 newRow.push('');
//             }
//             for (var p in userLinkSchema) {
//                 if (userLinkSchema.hasOwnProperty(p)
//                     && (userLinkSchema as any)[p] > -1) {
//                     newRow[(normalizedLinkSchema as any)[p]] = userLinkData[i][(userLinkSchema as any)[p]];
//                 }
//             }

//             sourceId = nodeNames.indexOf(userLinkData[i][userLinkSchema.source]);
//             newRow[normalizedLinkSchema.source] = sourceId;

//             targetId = nodeNames.indexOf(userLinkData[i][userLinkSchema.target]);
//             newRow[normalizedLinkSchema.target] = targetId;

//             normalizedLinkTable.push(newRow)
//         }

//         // check if location and time information exists for nodes
//         var time: any;
//         var locationsFound: boolean = false;
//         var timeFound: boolean = false;

//         if (datamanager.isValidIndex(userLinkSchema.location_source)
//             || datamanager.isValidIndex(userLinkSchema.location_target)) {
//             // set location schema index to next new column
//             normalizedNodeSchema.location = nodeColCount++;
//             // append new field to each row in node table
//             for (var i = 0; i < normalizedNodeTable.length; i++) {
//                 normalizedNodeTable[i].push('')
//             }
//             // FYI: node table has now at least 3 rows (id, name, location)
//             if (datamanager.isValidIndex(userLinkSchema.time)) {
//                 // set time schema index to next new column
//                 normalizedNodeSchema.time = nodeColCount++;
//                 // append new field to each row in node table
//                 for (var i = 0; i < normalizedNodeTable.length; i++) {
//                     normalizedNodeTable[i].push('')
//                 }
//                 // FYI: node table has now at least 4 rows (id, name, location, time)
//             }

//             // insert locations and ev. times into node table, as found in linktable
//             for (var i = 1; i < userLinkData.length; i++) {
//                 var nodeRow: any, rowToDuplicate: any;
//                 // do for source location
//                 nodeName = userLinkData[i][userLinkSchema.source]
//                 if (datamanager.isValidIndex(userLinkSchema.location_source)
//                     && userLinkData[i][userLinkSchema.location_source]
//                     && userLinkData[i][userLinkSchema.location_source] != '') {
//                     var len = normalizedNodeTable.length
//                     for (var j = 0; j < len; j++) {
//                         nodeRow = normalizedNodeTable[j];
//                         if (nodeRow[normalizedNodeSchema.label] == nodeName) {
//                             rowToDuplicate = undefined;
//                             if (datamanager.isValidIndex(normalizedNodeSchema.time)) {
//                                 // if there is already a time but no location,
//                                 if (nodeRow[normalizedNodeSchema.time] == userLinkData[i][userLinkSchema.time]) {
//                                     if (nodeRow[normalizedNodeSchema.location] && nodeRow[normalizedNodeSchema.location] != '') {
//                                         rowToDuplicate = undefined;
//                                     } else {
//                                         rowToDuplicate = nodeRow;
//                                     }
//                                     // nothing here node has already a location for this time, continue with next row.
//                                     j = len; // go to end of table
//                                     break;
//                                 } else {
//                                     rowToDuplicate = nodeRow;
//                                 }
//                             } else {
//                                 // just insert, no dupliation required
//                                 nodeRow[normalizedNodeSchema.location] = userLinkData[i][userLinkSchema.location_source]
//                                 j = len; // go to end of table
//                                 break;
//                             }
//                         }
//                     }

//                     if (rowToDuplicate) {
//                         if (rowToDuplicate[normalizedNodeSchema.location] == '') {
//                             rowToDuplicate[normalizedNodeSchema.location] = userLinkData[i][userLinkSchema.location_source]
//                             rowToDuplicate[normalizedNodeSchema.time] = userLinkData[i][userLinkSchema.time]
//                         } else {
//                             var newRowNode = []
//                             for (var c = 0; c < rowToDuplicate.length; c++) {
//                                 newRowNode.push(rowToDuplicate[c])
//                             }
//                             newRowNode[normalizedNodeSchema.location] = userLinkData[i][userLinkSchema.location_source]
//                             newRowNode[normalizedNodeSchema.time] = userLinkData[i][userLinkSchema.time]
//                             normalizedNodeTable.push(newRowNode);
//                         }
//                     }
//                 }

//                 // do for target location
//                 nodeName = userLinkData[i][userLinkSchema.target]
//                 if (datamanager.isValidIndex(userLinkSchema.location_target)
//                     && userLinkData[i][userLinkSchema.location_target]
//                     && userLinkData[i][userLinkSchema.location_target] != '') {
//                     var len = normalizedNodeTable.length
//                     for (var j = 0; j < len; j++) {
//                         nodeRow = normalizedNodeTable[j];
//                         if (nodeRow[normalizedNodeSchema.label] == nodeName) {
//                             rowToDuplicate = undefined;
//                             if (datamanager.isValidIndex(normalizedNodeSchema.time)) {
//                                 // if location is not empty,
//                                 if (nodeRow[normalizedNodeSchema.time] == userLinkData[i][userLinkSchema.time]) {
//                                     if (nodeRow[normalizedNodeSchema.location] && nodeRow[normalizedNodeSchema.location] != '') {
//                                         rowToDuplicate = undefined;
//                                     } else {
//                                         rowToDuplicate = nodeRow;
//                                     }
//                                     // nothing here node has already a location for this time, continue with next row.
//                                     j = len; // go to end of table
//                                     break;
//                                 } else {
//                                     rowToDuplicate = nodeRow;
//                                 }
//                             } else {
//                                 // just insert, no dupliation required
//                                 nodeRow[normalizedNodeSchema.location] = userLinkData[i][userLinkSchema.location_target]
//                                 j = len; // go to end of table
//                                 break;
//                             }
//                         }
//                     }

//                     if (rowToDuplicate) {
//                         if (rowToDuplicate[normalizedNodeSchema.location] == '') {
//                             rowToDuplicate[normalizedNodeSchema.location] = userLinkData[i][userLinkSchema.location_target]
//                             rowToDuplicate[normalizedNodeSchema.time] = userLinkData[i][userLinkSchema.time]
//                         } else {
//                             // duplicate
//                             var newRowNode = []
//                             for (var c = 0; c < rowToDuplicate.length; c++) {
//                                 newRowNode.push(rowToDuplicate[c])
//                             }
//                             newRowNode[normalizedNodeSchema.location] = userLinkData[i][userLinkSchema.location_target]
//                             newRowNode[normalizedNodeSchema.time] = userLinkData[i][userLinkSchema.time]
//                             normalizedNodeTable.push(newRowNode);
//                         }
//                     }
//                 }
//             }
//         } // end of checking for node times and location in link table
//     } // end of link table normalization

//     // FORMAT TIMES INTO ISO STANDARD

//     if (currentNetwork.hasOwnProperty('timeFormat') && currentNetwork.timeFormat != undefined && currentNetwork.timeFormat.length > 0) {
//         var format: string = currentNetwork.timeFormat;
//         if (normalizedLinkSchema.time != undefined && normalizedLinkSchema.time > -1) {
//             for (var i = 0; i < normalizedLinkTable.length; i++) {
//                 time = moment.utc(normalizedLinkTable[i][normalizedLinkSchema.time], format).format(main.timeFormat())
//                 if (time.indexOf('Invalid') > -1)
//                     time = undefined;
//                 normalizedLinkTable[i][normalizedLinkSchema.time] = time;
//             }
//         }

//         if (normalizedNodeSchema.time != undefined && normalizedNodeSchema.time > -1) {
//             for (var i = 0; i < normalizedNodeTable.length; i++) {
//                 time = moment.utc(normalizedNodeTable[i][normalizedNodeSchema.time], format).format(main.timeFormat());
//                 if (time.indexOf('Invalid') > -1)
//                     time = undefined;
//                 normalizedNodeTable[i][normalizedNodeSchema.time] = time
//             }
//         }
//     }

//     var {normalizedLocationSchema, normalizedLocationTable, locationName, locationLabels} = createAndNormaliseLocationTable(currentNetwork);

//     if (normalizedNodeSchema.location > -1) {
//         for (var i = 0; i < normalizedNodeTable.length; i++) {
//             locationName = normalizedNodeTable[i][normalizedNodeSchema.location].trim();
//             id = locationLabels.indexOf(locationName);
//             normalizedNodeTable[i][normalizedNodeSchema.location] = id;
//         }
//     }

//     // set tables to networkcube data set:
//     var params: any = {}
//     params.name = currentNetwork.name;
//     params.nodeTable = normalizedNodeTable;
//     params.linkTable = normalizedLinkTable;
//     params.nodeSchema = normalizedNodeSchema;
//     params.linkSchema = normalizedLinkSchema;
//     params.locationTable = normalizedLocationTable;
//     params.locationSchema = normalizedLocationSchema;
//     params.timeFormat = currentNetwork.timeFormat;
//     params.directed = currentNetwork.directed;
//     var dataset: datamanager.DataSet = new datamanager.DataSet(params);

//     if (currentNetwork.userLocationTable) {
//         currentNetwork.userLocationTable.data = []
//         currentNetwork.userLocationTable.data.push(['Id', 'User Name', 'Geoname', 'Longitude', 'Latitude'])
//         for (var i = 0; i < normalizedLocationTable.length; i++) {
//             currentNetwork.userLocationTable.data.push(normalizedLocationTable[i]);
//         }
//     }

//     // make ids integer
//     for (var i = 0; i < normalizedNodeTable.length; i++) {
//         normalizedNodeTable[i][0] = parseInt(normalizedNodeTable[i][0])
//     }
//     for (var i = 0; i < normalizedLinkTable.length; i++) {
//         normalizedLinkTable[i][0] = parseInt(normalizedLinkTable[i][0])
//     }

//     // save network on the vistorian side
//     currentNetwork.ready = true;
//     storage.saveNetwork(currentNetwork, sessionid);

//     main.setDataManagerOptions({ keepOnlyOneSession: false });

//     main.importData(sessionid, dataset);

//     return dataset;
// }
export function importIntoNetworkcube(
  currentNetwork: Network,
  sessionid: string,
  s: boolean
) {
  currentNetwork.ready = false;

  // if (currentNetwork.userLinkSchema) {
  //     var userLinkSchema: VLinkSchema = currentNetwork.userLinkSchema;
  // } else {
  //     var userLinkSchema: VLinkSchema = new VLinkSchema();
  // }

  // if (currentNetwork.userNodeSchema) {
  //     var userNodeSchema: VNodeSchema = currentNetwork.userNodeSchema;
  // } else {
  //     var userNodeSchema: VNodeSchema = new VNodeSchema();
  // }

  // check minimal conditions to create and import a network
  if (
    !(
      (currentNetwork.userLinkSchema &&
        currentNetwork.userLinkSchema.source > -1 &&
        currentNetwork.userLinkSchema.target > -1) ||
      (currentNetwork.userNodeSchema &&
        currentNetwork.userNodeSchema.label > -1 &&
        currentNetwork.userNodeSchema.relation.length > 0)
    )
  ) {
    console.log("NETWORK NOT VALID FOR IMPORT", currentNetwork.userNodeSchema);
    new Error(
      "Your network is not valid. Please check that you have set all the required fields; at least a source and a target node."
    );
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
  const normalizedNodeTable: any[] = [];
  const normalizedLinkTable: any[] = [];

  // get standard schemas
  // INIT NODE SCHEMA
  const normalizedNodeSchema: dynamicgraphutils.NodeSchema =
    new dynamicgraphutils.NodeSchema(0);

  // INITIALZE NORMALIZED SCHEMAS WITH USER'S ATTRIBUTES

  // required attributes
  normalizedNodeSchema.id = 0;
  normalizedNodeSchema.label = 1;

  let nodeColCount = 2;
  if (currentNetwork.userNodeSchema) {
    for (const p in currentNetwork.userNodeSchema) {
      if (
        Object.prototype.hasOwnProperty.call(
          currentNetwork.userNodeSchema,
          p
        ) &&
        (currentNetwork.userNodeSchema as any)[p] > -1 &&
        p != "id" &&
        p != "label" &&
        p != "relation" &&
        (currentNetwork.userNodeSchema as any)[p] > 0
      ) {
        (normalizedNodeSchema as any)[p] = nodeColCount++;
      }
    }
  }

  // INIT LINK SCHEMA WITH USER ATTRIBUTES
  const normalizedLinkSchema: dynamicgraphutils.LinkSchema =
    new dynamicgraphutils.LinkSchema(0, 1, 2);
  // required attributes
  normalizedLinkSchema.id = 0;
  normalizedLinkSchema.source = 1;
  normalizedLinkSchema.target = 2;

  let linkColCount = 3;
  if (currentNetwork.userLinkSchema) {
    for (const p in currentNetwork.userLinkSchema) {
      if (
        Object.prototype.hasOwnProperty.call(
          currentNetwork.userLinkSchema,
          p
        ) &&
        (currentNetwork.userLinkSchema as any)[p] > -1 &&
        p != "id" &&
        p != "source" &&
        p != "target" &&
        p != "location_source" &&
        p != "location_source"
      ) {
        (normalizedLinkSchema as any)[p] = linkColCount++;
      }
    }
  }

  // var nodeLabels: any = []
  const nodeIds = [];
  const nodeNames: string[] = [];

  if (
    currentNetwork.userNodeSchema &&
    currentNetwork.userNodeTable &&
    currentNetwork.userNodeSchema.label
  ) {
    let id;
    // create node table
    for (let i = 1; i < currentNetwork.userNodeTable.data.length; i++) {
      const newRow = [0, 0, 0, 0, 0];
      id = parseInt(
        currentNetwork.userNodeTable.data[i][currentNetwork.userNodeSchema.id]
      );
      nodeIds.push(id);
      newRow[normalizedNodeSchema.id] = id;
      // if(currentNetwork.userNodeSchema.label >-1)
      newRow[normalizedNodeSchema.label] =
        currentNetwork.userNodeTable.data[i][
          currentNetwork.userNodeSchema.label
        ];
      // if(currentNetwork.userNodeSchema.shape >-1)
      newRow[normalizedNodeSchema.shape] =
        currentNetwork.userNodeTable.data[i][
          currentNetwork.userNodeSchema.shape
        ];
      // if(currentNetwork.userNodeSchema.color >-1)
      // newRow[normalizedNodeSchema.color] = currentNetwork.userNodeTable.data[i][currentNetwork.userNodeSchema.color]

      nodeNames.push(
        currentNetwork.userNodeTable.data[i][
          currentNetwork.userNodeSchema.label
        ]
      );
      normalizedNodeTable.push(newRow);
    }
  }
  console.log("NODETABLE", normalizedNodeTable);
  console.log("NODENAMES", nodeNames);

  if (
    currentNetwork.userNodeSchema &&
    currentNetwork.userNodeSchema.relation.length > 0 &&
    currentNetwork.userNodeTable
  ) {
    let colCount = 3;
    normalizedLinkSchema.linkType = colCount++;
    if (dynamicgraphutils.isValidIndex(currentNetwork.userNodeSchema.time)) {
      normalizedLinkSchema.time = colCount++;
    }
    for (let i = 1; i < currentNetwork.userNodeTable.data.length; i++) {
      // Iterate through all relation columns
      let row: any;
      let relCol, rowNum;
      let sourceId: number;
      let targetId: number;
      for (let j = 0; j < currentNetwork.userNodeSchema.relation.length; j++) {
        row = currentNetwork.userNodeTable.data[i];
        relCol = currentNetwork.userNodeSchema.relation[j];
        sourceId = nodeIds[i - 1];
        // dont create relation if field entry is empty;
        if (row[relCol].length == 0) continue;

        // check if node already exist
        rowNum = nodeNames.indexOf(row[relCol]);

        if (rowNum < 0) {
          // create new node in node table
          const newNodeRow = [0, 0];
          newNodeRow[normalizedNodeSchema.id] = normalizedNodeTable.length;
          nodeIds.push(normalizedNodeTable.length - 1);
          nodeNames.push(row[relCol]);
          newNodeRow[normalizedNodeSchema.label] = row[relCol];
          normalizedNodeTable.push(newNodeRow);
          targetId = normalizedNodeTable.length - 1;
        } else {
          targetId = rowNum;
        }

        // create entry in link table
        const newLinkRow = [];
        for (let k = 0; k < colCount; k++) {
          newLinkRow.push("");
        }
        newLinkRow[normalizedLinkSchema.id] = normalizedLinkTable.length;
        newLinkRow[normalizedLinkSchema.source] = sourceId;
        newLinkRow[normalizedLinkSchema.target] = targetId;
        newLinkRow[normalizedLinkSchema.linkType] =
          currentNetwork.userNodeTable.data[0][relCol]; // set column header as relation type
        if (dynamicgraphutils.isValidIndex(currentNetwork.userNodeSchema.time))
          newLinkRow[normalizedLinkSchema.time] =
            row[currentNetwork.userNodeSchema.time];
        normalizedLinkTable.push(newLinkRow);
      }
    }
  } else if (
    currentNetwork.userLinkSchema &&
    currentNetwork.userLinkTable &&
    !currentNetwork.userNodeTable
  ) {
    // Extract node labels and create (simple) normalized node table
    let row: any;
    for (let i = 1; i < currentNetwork.userLinkTable.data.length; i++) {
      // source
      let nodeName =
        currentNetwork.userLinkTable.data[i][
          currentNetwork.userLinkSchema.source
        ];
      if (nodeNames.indexOf(nodeName) < 0) {
        row = [nodeNames.length, nodeName];
        nodeNames.push(nodeName);
        normalizedNodeTable.push(row);
      }

      // target
      nodeName =
        currentNetwork.userLinkTable.data[i][
          currentNetwork.userLinkSchema.target
        ];
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

  let time: any;

  if (currentNetwork.userLinkTable && currentNetwork.userLinkSchema) {
    // create normalized link table and replace source/target label by source/target id
    // normalizedLinkTable = [];
    let newRow: any[];
    // let linkTime: string;
    // let found: boolean = true;
    for (let i = 1; i < currentNetwork.userLinkTable.data.length; i++) {
      newRow = [];
      for (let k = 0; k < linkColCount; k++) {
        newRow.push("");
      }
      for (const p in currentNetwork.userLinkSchema) {
        if (
          Object.prototype.hasOwnProperty.call(
            currentNetwork.userLinkSchema,
            p
          ) &&
          (currentNetwork.userLinkSchema as any)[p] > -1
        ) {
          newRow[(normalizedLinkSchema as any)[p]] =
            currentNetwork.userLinkTable.data[i][
              (currentNetwork.userLinkSchema as any)[p]
            ];
        }
      }

      const sourceId = nodeNames.indexOf(
        currentNetwork.userLinkTable.data[i][
          currentNetwork.userLinkSchema.source
        ]
      );
      newRow[normalizedLinkSchema.source] = sourceId;

      const targetId = nodeNames.indexOf(
        currentNetwork.userLinkTable.data[i][
          currentNetwork.userLinkSchema.target
        ]
      );
      newRow[normalizedLinkSchema.target] = targetId;

      normalizedLinkTable.push(newRow);
    }

    // check if location and time information exists for nodes

    if (
      dynamicgraphutils.isValidIndex(currentNetwork.userLinkSchema.location_source) ||
      dynamicgraphutils.isValidIndex(currentNetwork.userLinkSchema.location_target)
    ) {
      // set location schema index to next new column
      normalizedNodeSchema.location = nodeColCount++;
      // append new field to each row in node table
      for (let i = 0; i < normalizedNodeTable.length; i++) {
        normalizedNodeTable[i].push("");
      }
      // FYI: node table has now at least 3 rows (id, name, location)
      if (dynamicgraphutils.isValidIndex(currentNetwork.userLinkSchema.time)) {
        // set time schema index to next new column
        normalizedNodeSchema.time = nodeColCount++;
        // append new field to each row in node table
        for (let i = 0; i < normalizedNodeTable.length; i++) {
          normalizedNodeTable[i].push("");
        }
        // FYI: node table has now at least 4 rows (id, name, location, time)
      }

      // insert locations and ev. times into node table, as found in linktable
      for (let i = 1; i < currentNetwork.userLinkTable.data.length; i++) {
        let nodeRow: any, rowToDuplicate: any;
        // do for source location
        let nodeName =
          currentNetwork.userLinkTable.data[i][
            currentNetwork.userLinkSchema.source
          ];
        if (
          dynamicgraphutils.isValidIndex(
            currentNetwork.userLinkSchema.location_source
          ) &&
          currentNetwork.userLinkTable.data[i][
            currentNetwork.userLinkSchema.location_source
          ] &&
          currentNetwork.userLinkTable.data[i][
            currentNetwork.userLinkSchema.location_source
          ] != ""
        ) {
          const len = normalizedNodeTable.length;
          for (let j = 0; j < len; j++) {
            nodeRow = normalizedNodeTable[j];
            if (nodeRow[normalizedNodeSchema.label] == nodeName) {
              rowToDuplicate = undefined;
              if (dynamicgraphutils.isValidIndex(normalizedNodeSchema.time)) {
                // if there is already a time but no location,
                if (
                  nodeRow[normalizedNodeSchema.time] ==
                  currentNetwork.userLinkTable.data[i][
                    currentNetwork.userLinkSchema.time
                  ]
                ) {
                  if (
                    nodeRow[normalizedNodeSchema.location] &&
                    nodeRow[normalizedNodeSchema.location] != ""
                  ) {
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
                nodeRow[normalizedNodeSchema.location] =
                  currentNetwork.userLinkTable.data[i][
                    currentNetwork.userLinkSchema.location_source
                  ];
                j = len; // go to end of table
                break;
              }
            }
          }

          if (rowToDuplicate) {
            if (rowToDuplicate[normalizedNodeSchema.location] == "") {
              rowToDuplicate[normalizedNodeSchema.location] =
                currentNetwork.userLinkTable.data[i][
                  currentNetwork.userLinkSchema.location_source
                ];
              rowToDuplicate[normalizedNodeSchema.time] =
                currentNetwork.userLinkTable.data[i][
                  currentNetwork.userLinkSchema.time
                ];
            } else {
              const newRowNode = [];
              for (let c = 0; c < rowToDuplicate.length; c++) {
                newRowNode.push(rowToDuplicate[c]);
              }
              newRowNode[normalizedNodeSchema.location] =
                currentNetwork.userLinkTable.data[i][
                  currentNetwork.userLinkSchema.location_source
                ];
              newRowNode[normalizedNodeSchema.time] =
                currentNetwork.userLinkTable.data[i][
                  currentNetwork.userLinkSchema.time
                ];
              normalizedNodeTable.push(newRowNode);
            }
          }
        }

        // do for target location
        nodeName =
          currentNetwork.userLinkTable.data[i][
            currentNetwork.userLinkSchema.target
          ];
        if (
          dynamicgraphutils.isValidIndex(
            currentNetwork.userLinkSchema.location_target
          ) &&
          currentNetwork.userLinkTable.data[i][
            currentNetwork.userLinkSchema.location_target
          ] &&
          currentNetwork.userLinkTable.data[i][
            currentNetwork.userLinkSchema.location_target
          ] != ""
        ) {
          const len = normalizedNodeTable.length;
          for (let j = 0; j < len; j++) {
            nodeRow = normalizedNodeTable[j];
            if (nodeRow[normalizedNodeSchema.label] == nodeName) {
              rowToDuplicate = undefined;
              if (dynamicgraphutils.isValidIndex(normalizedNodeSchema.time)) {
                // if location is not empty,
                if (
                  nodeRow[normalizedNodeSchema.time] ==
                  currentNetwork.userLinkTable.data[i][
                    currentNetwork.userLinkSchema.time
                  ]
                ) {
                  if (
                    nodeRow[normalizedNodeSchema.location] &&
                    nodeRow[normalizedNodeSchema.location] != ""
                  ) {
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
                nodeRow[normalizedNodeSchema.location] =
                  currentNetwork.userLinkTable.data[i][
                    currentNetwork.userLinkSchema.location_target
                  ];
                j = len; // go to end of table
                break;
              }
            }
          }

          if (rowToDuplicate) {
            if (rowToDuplicate[normalizedNodeSchema.location] == "") {
              rowToDuplicate[normalizedNodeSchema.location] =
                currentNetwork.userLinkTable.data[i][
                  currentNetwork.userLinkSchema.location_target
                ];
              rowToDuplicate[normalizedNodeSchema.time] =
                currentNetwork.userLinkTable.data[i][
                  currentNetwork.userLinkSchema.time
                ];
            } else {
              // duplicate
              const newRowNode = [];
              for (let c = 0; c < rowToDuplicate.length; c++) {
                newRowNode.push(rowToDuplicate[c]);
              }
              newRowNode[normalizedNodeSchema.location] =
                currentNetwork.userLinkTable.data[i][
                  currentNetwork.userLinkSchema.location_target
                ];
              newRowNode[normalizedNodeSchema.time] =
                currentNetwork.userLinkTable.data[i][
                  currentNetwork.userLinkSchema.time
                ];
              normalizedNodeTable.push(newRowNode);
            }
          }
        }
      }
    } // end of checking for node times and location in link table
  } // end of link table normalization

  // FORMAT TIMES INTO ISO STANDARD

  if (
    Object.prototype.hasOwnProperty.call(currentNetwork, "timeFormat") &&
    currentNetwork.timeFormat != undefined &&
    currentNetwork.timeFormat.length > 0
  ) {
    const format: string = currentNetwork.timeFormat;
    if (
      normalizedLinkSchema.time != undefined &&
      normalizedLinkSchema.time > -1
    ) {
      for (let i = 0; i < normalizedLinkTable.length; i++) {
        time = moment
          .utc(normalizedLinkTable[i][normalizedLinkSchema.time], format)
          .format(main.timeFormat());
        if (time.indexOf("Invalid") > -1) time = undefined;
        normalizedLinkTable[i][normalizedLinkSchema.time] = time;
      }
    }

    if (
      normalizedNodeSchema.time != undefined &&
      normalizedNodeSchema.time > -1
    ) {
      for (let i = 0; i < normalizedNodeTable.length; i++) {
        time = moment
          .utc(normalizedNodeTable[i][normalizedNodeSchema.time], format)
          .format(main.timeFormat());
        if (time.indexOf("Invalid") > -1) time = undefined;
        normalizedNodeTable[i][normalizedNodeSchema.time] = time;
      }
    }
  }

  const t = createAndNormaliseLocationTable(currentNetwork);
  let { locationName } = t;
  const { normalizedLocationSchema, normalizedLocationTable, locationLabels } =
    t;

  if (normalizedNodeSchema.location > -1) {
    for (let i = 0; i < normalizedNodeTable.length; i++) {
      locationName =
        normalizedNodeTable[i][normalizedNodeSchema.location].trim();
      const id = locationLabels.indexOf(locationName);
      normalizedNodeTable[i][normalizedNodeSchema.location] = id;
    }
  }

  // set tables to networkcube data set:
  const params: any = {};
  params.name = currentNetwork.name;
  params.nodeTable = normalizedNodeTable;
  params.linkTable = normalizedLinkTable;
  params.nodeSchema = normalizedNodeSchema;
  params.linkSchema = normalizedLinkSchema;
  params.locationTable = normalizedLocationTable;
  params.locationSchema = normalizedLocationSchema;
  params.timeFormat = currentNetwork.timeFormat;
  params.directed = currentNetwork.directed;
  const dataset: dynamicgraphutils.DataSet = new dynamicgraphutils.DataSet(params);

  if (currentNetwork.userLocationTable) {
    currentNetwork.userLocationTable.data = [];
    currentNetwork.userLocationTable.data.push([
      "Id",
      "User Name",
      "Geoname",
      "Longitude",
      "Latitude",
    ]);
    for (let i = 0; i < normalizedLocationTable.length; i++) {
      currentNetwork.userLocationTable.data.push(normalizedLocationTable[i]);
    }
  }

  // make ids integer
  for (let i = 0; i < normalizedNodeTable.length; i++) {
    normalizedNodeTable[i][0] = parseInt(normalizedNodeTable[i][0]);
  }
  for (let i = 0; i < normalizedLinkTable.length; i++) {
    normalizedLinkTable[i][0] = parseInt(normalizedLinkTable[i][0]);
  }

  // save network on the vistorian side
  currentNetwork.ready = true;
  storage.saveNetwork(currentNetwork, sessionid);

  main.setDataManagerOptions({ keepOnlyOneSession: false });

  main.importData(sessionid, dataset);

  return dataset;
}
