import * as dynamicgraphutils from 'vistorian-core/src/data/dynamicgraphutils';
import * as main from 'vistorian-core/src/data/main';

import * as moment from 'moment';
import * as storage from './storage';
import * as utils from 'vistorian-core/build/src/data/utils';

// N.B. - this contains only some of the code in the equivalent file in vistorian-web/web/src

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
		super('userNodeSchema');
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
		super('userLinkSchema');
	}
}
export class VLocationSchema extends VTableSchema {
	id = 0;
	label = 1;
	geoname = 2;
	longitude = 3;
	latitude = 4;
	constructor() {
		super('userLocationSchema');
	}
}

// this represents a network the user created, including
// - the originally formatted tables
// - the node and edge schemas on those tables
// - the networkcube data set with the normalized tables
export class Network {
	id: number;
	name = '';
	userNodeTable: VTable | undefined = undefined; // ??
	userLinkTable: VTable | undefined = undefined; // ??;
	userNodeSchema: VNodeSchema | undefined;
	userLinkSchema: VLinkSchema | undefined;
	userLocationTable: VTable | undefined = undefined; // ??;
	userLocationSchema: dynamicgraphutils.LocationSchema = new dynamicgraphutils.LocationSchema(0, 0); // ??
	// networkCubeDataSet: networkcube.DataSet;
	networkConfig = 'both';
	timeFormat = '';
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

export function cleanTable(table: any[][]) {
	// trim entries
	const emptyColBool: any[] = [];
	for (let i = 0; i < table.length; i++) {
		for (let j = 0; j < table[i].length; j++) {
			if (table[i][j] != undefined) table[i][j] = table[i][j].trim();
		}
	}
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
				currentNetwork.userLocationTable.data[i][currentNetwork.userLocationSchema.label]
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
			if (locationLabels.indexOf(userLinkData[i][userLinkSchema.location_source]) == -1) {
				locationLabels.push(userLinkData[i][userLinkSchema.location_source]);
			}
			if (locationLabels.indexOf(userLinkData[i][userLinkSchema.location_target]) == -1) {
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
	let locationName = '';
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
			row[normalizedLocationSchema.geoname] = userLocationTable[i][userLocationSchema.geoname];
			row[normalizedLocationSchema.latitude] = userLocationTable[i][userLocationSchema.latitude];
			row[normalizedLocationSchema.longitude] = userLocationTable[i][userLocationSchema.longitude];
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
		locationLabels
	};
}

//////////////////////////////////

export function setHeader(elementId: string, datasetname: string) {
	//TODO: fixme
	/*
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

	 */
}

///////////////////////////////////////////

export function importData(network: Network, session: any) {
	storage.saveNetwork(network, session);
}

export function importIntoNetworkcube(currentNetwork: Network, sessionid: string, s: boolean) {
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
		console.log('NETWORK NOT VALID FOR IMPORT', currentNetwork.userNodeSchema);
		new Error(
			'Your network is not valid. Please check that you have set all the required fields; at least a source and a target node.'
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
	const normalizedNodeSchema: dynamicgraphutils.NodeSchema = new dynamicgraphutils.NodeSchema(0);

	// INITIALZE NORMALIZED SCHEMAS WITH USER'S ATTRIBUTES

	// required attributes
	normalizedNodeSchema.id = 0;
	normalizedNodeSchema.label = 1;

	let nodeColCount = 2;
	if (currentNetwork.userNodeSchema) {
		for (const p in currentNetwork.userNodeSchema) {
			if (
				Object.prototype.hasOwnProperty.call(currentNetwork.userNodeSchema, p) &&
				(currentNetwork.userNodeSchema as any)[p] > -1 &&
				p != 'id' &&
				p != 'label' &&
				p != 'relation' &&
				(currentNetwork.userNodeSchema as any)[p] > 0
			) {
				(normalizedNodeSchema as any)[p] = nodeColCount++;
			}
		}
	}

	// INIT LINK SCHEMA WITH USER ATTRIBUTES
	const normalizedLinkSchema: dynamicgraphutils.LinkSchema = new dynamicgraphutils.LinkSchema(
		0,
		1,
		2
	);
	// required attributes
	normalizedLinkSchema.id = 0;
	normalizedLinkSchema.source = 1;
	normalizedLinkSchema.target = 2;

	let linkColCount = 3;
	if (currentNetwork.userLinkSchema) {
		for (const p in currentNetwork.userLinkSchema) {
			if (
				Object.prototype.hasOwnProperty.call(currentNetwork.userLinkSchema, p) &&
				(currentNetwork.userLinkSchema as any)[p] > -1 &&
				p != 'id' &&
				p != 'source' &&
				p != 'target' &&
				p != 'location_source' &&
				p != 'location_source'
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
			id = parseInt(currentNetwork.userNodeTable.data[i][currentNetwork.userNodeSchema.id]);
			nodeIds.push(id);
			newRow[normalizedNodeSchema.id] = id;
			// if(currentNetwork.userNodeSchema.label >-1)
			newRow[normalizedNodeSchema.label] =
				currentNetwork.userNodeTable.data[i][currentNetwork.userNodeSchema.label];
			// if(currentNetwork.userNodeSchema.shape >-1)
			newRow[normalizedNodeSchema.shape] =
				currentNetwork.userNodeTable.data[i][currentNetwork.userNodeSchema.shape];
			// if(currentNetwork.userNodeSchema.color >-1)
			// newRow[normalizedNodeSchema.color] = currentNetwork.userNodeTable.data[i][currentNetwork.userNodeSchema.color]

			nodeNames.push(currentNetwork.userNodeTable.data[i][currentNetwork.userNodeSchema.label]);
			normalizedNodeTable.push(newRow);
		}
	}
	console.log('NODETABLE', normalizedNodeTable);
	console.log('NODENAMES', nodeNames);

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
					newLinkRow.push('');
				}
				newLinkRow[normalizedLinkSchema.id] = normalizedLinkTable.length;
				newLinkRow[normalizedLinkSchema.source] = sourceId;
				newLinkRow[normalizedLinkSchema.target] = targetId;
				newLinkRow[normalizedLinkSchema.linkType] = currentNetwork.userNodeTable.data[0][relCol]; // set column header as relation type
				if (dynamicgraphutils.isValidIndex(currentNetwork.userNodeSchema.time))
					newLinkRow[normalizedLinkSchema.time] = row[currentNetwork.userNodeSchema.time];
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
			let nodeName = currentNetwork.userLinkTable.data[i][currentNetwork.userLinkSchema.source];
			if (nodeNames.indexOf(nodeName) < 0) {
				row = [nodeNames.length, nodeName];
				nodeNames.push(nodeName);
				normalizedNodeTable.push(row);
			}

			// target
			nodeName = currentNetwork.userLinkTable.data[i][currentNetwork.userLinkSchema.target];
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
				newRow.push('');
			}
			for (const p in currentNetwork.userLinkSchema) {
				if (
					Object.prototype.hasOwnProperty.call(currentNetwork.userLinkSchema, p) &&
					(currentNetwork.userLinkSchema as any)[p] > -1
				) {
					newRow[(normalizedLinkSchema as any)[p]] =
						currentNetwork.userLinkTable.data[i][(currentNetwork.userLinkSchema as any)[p]];
				}
			}

			const sourceId = nodeNames.indexOf(
				currentNetwork.userLinkTable.data[i][currentNetwork.userLinkSchema.source]
			);
			newRow[normalizedLinkSchema.source] = sourceId;

			const targetId = nodeNames.indexOf(
				currentNetwork.userLinkTable.data[i][currentNetwork.userLinkSchema.target]
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
				normalizedNodeTable[i].push('');
			}
			// FYI: node table has now at least 3 rows (id, name, location)
			if (dynamicgraphutils.isValidIndex(currentNetwork.userLinkSchema.time)) {
				// set time schema index to next new column
				normalizedNodeSchema.time = nodeColCount++;
				// append new field to each row in node table
				for (let i = 0; i < normalizedNodeTable.length; i++) {
					normalizedNodeTable[i].push('');
				}
				// FYI: node table has now at least 4 rows (id, name, location, time)
			}

			// insert locations and ev. times into node table, as found in linktable
			for (let i = 1; i < currentNetwork.userLinkTable.data.length; i++) {
				let nodeRow: any, rowToDuplicate: any;
				// do for source location
				let nodeName = currentNetwork.userLinkTable.data[i][currentNetwork.userLinkSchema.source];
				if (
					dynamicgraphutils.isValidIndex(currentNetwork.userLinkSchema.location_source) &&
					currentNetwork.userLinkTable.data[i][currentNetwork.userLinkSchema.location_source] &&
					currentNetwork.userLinkTable.data[i][currentNetwork.userLinkSchema.location_source] != ''
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
									currentNetwork.userLinkTable.data[i][currentNetwork.userLinkSchema.time]
								) {
									if (
										nodeRow[normalizedNodeSchema.location] &&
										nodeRow[normalizedNodeSchema.location] != ''
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
						if (rowToDuplicate[normalizedNodeSchema.location] == '') {
							rowToDuplicate[normalizedNodeSchema.location] =
								currentNetwork.userLinkTable.data[i][currentNetwork.userLinkSchema.location_source];
							rowToDuplicate[normalizedNodeSchema.time] =
								currentNetwork.userLinkTable.data[i][currentNetwork.userLinkSchema.time];
						} else {
							const newRowNode = [];
							for (let c = 0; c < rowToDuplicate.length; c++) {
								newRowNode.push(rowToDuplicate[c]);
							}
							newRowNode[normalizedNodeSchema.location] =
								currentNetwork.userLinkTable.data[i][currentNetwork.userLinkSchema.location_source];
							newRowNode[normalizedNodeSchema.time] =
								currentNetwork.userLinkTable.data[i][currentNetwork.userLinkSchema.time];
							normalizedNodeTable.push(newRowNode);
						}
					}
				}

				// do for target location
				nodeName = currentNetwork.userLinkTable.data[i][currentNetwork.userLinkSchema.target];
				if (
					dynamicgraphutils.isValidIndex(currentNetwork.userLinkSchema.location_target) &&
					currentNetwork.userLinkTable.data[i][currentNetwork.userLinkSchema.location_target] &&
					currentNetwork.userLinkTable.data[i][currentNetwork.userLinkSchema.location_target] != ''
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
									currentNetwork.userLinkTable.data[i][currentNetwork.userLinkSchema.time]
								) {
									if (
										nodeRow[normalizedNodeSchema.location] &&
										nodeRow[normalizedNodeSchema.location] != ''
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
						if (rowToDuplicate[normalizedNodeSchema.location] == '') {
							rowToDuplicate[normalizedNodeSchema.location] =
								currentNetwork.userLinkTable.data[i][currentNetwork.userLinkSchema.location_target];
							rowToDuplicate[normalizedNodeSchema.time] =
								currentNetwork.userLinkTable.data[i][currentNetwork.userLinkSchema.time];
						} else {
							// duplicate
							const newRowNode = [];
							for (let c = 0; c < rowToDuplicate.length; c++) {
								newRowNode.push(rowToDuplicate[c]);
							}
							newRowNode[normalizedNodeSchema.location] =
								currentNetwork.userLinkTable.data[i][currentNetwork.userLinkSchema.location_target];
							newRowNode[normalizedNodeSchema.time] =
								currentNetwork.userLinkTable.data[i][currentNetwork.userLinkSchema.time];
							normalizedNodeTable.push(newRowNode);
						}
					}
				}
			}
		} // end of checking for node times and location in link table
	} // end of link table normalization

	// FORMAT TIMES INTO ISO STANDARD

	if (
		Object.prototype.hasOwnProperty.call(currentNetwork, 'timeFormat') &&
		currentNetwork.timeFormat != undefined &&
		currentNetwork.timeFormat.length > 0
	) {
		const format: string = currentNetwork.timeFormat;
		if (normalizedLinkSchema.time != undefined && normalizedLinkSchema.time > -1) {
			for (let i = 0; i < normalizedLinkTable.length; i++) {
				time = moment
					.utc(normalizedLinkTable[i][normalizedLinkSchema.time], format)
					.format(main.timeFormat());
				if (time.indexOf('Invalid') > -1) time = undefined;
				normalizedLinkTable[i][normalizedLinkSchema.time] = time;
			}
		}

		if (normalizedNodeSchema.time != undefined && normalizedNodeSchema.time > -1) {
			for (let i = 0; i < normalizedNodeTable.length; i++) {
				time = moment
					.utc(normalizedNodeTable[i][normalizedNodeSchema.time], format)
					.format(main.timeFormat());
				if (time.indexOf('Invalid') > -1) time = undefined;
				normalizedNodeTable[i][normalizedNodeSchema.time] = time;
			}
		}
	}

	const t = createAndNormaliseLocationTable(currentNetwork);
	let { locationName } = t;
	const { normalizedLocationSchema, normalizedLocationTable, locationLabels } = t;

	if (normalizedNodeSchema.location > -1) {
		for (let i = 0; i < normalizedNodeTable.length; i++) {
			locationName = normalizedNodeTable[i][normalizedNodeSchema.location].trim();
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
			'Id',
			'User Name',
			'Geoname',
			'Longitude',
			'Latitude'
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
