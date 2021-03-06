import { timeParse } from 'd3-time-format';
import { formatStandardTime } from 'vistorian-core/src/data/dates';

import { getUrlVars } from '$lib/utils';
import { Network } from '$lib/vistorian';
import * as storage from '$lib/storage';
import * as dynamicgraphutils from 'vistorian-core/src/data/dynamicgraphutils';
import * as main from 'vistorian-core/src/data/main';
import { parseGEDCOM, parsePajek, parseXML } from 'vistorian-core/src/data/importers';

async function geoCode(placeName): Promise<[number, number] | [undefined, undefined]> {
	if (!placeName) {
		return [undefined, undefined];
	}

	const place = placeName.split(',')[0].trim();
	if (!place) {
		return [undefined, undefined];
	}

	const url = `https://api.maptiler.com/geocoding/${place}.json?key=4JfMdMSpqOnXq9pxP8x4`;

	const res = await fetch(url, { mode: 'cors' });
	const data = await res.json();

	if (data.features.length > 0) {
		const entry = data.features[0];
		return [entry.center[0], entry.center[1]];
	}

	return [undefined, undefined];
}

const getLocationsFromFile = (fileStore, settings) => {
	if (!settings.locationTableConfig.usingLocationFile) {
		return null;
	}

	const rawData = fileStore[settings.locationTableConfig.selectedFile].data;
	const hasHeaderRow = fileStore[settings.locationTableConfig.selectedFile].hasHeaderRow;

	const locations = [];

	let firstRow = true;
	for (const row of rawData) {
		// skip header row if required
		if (firstRow && hasHeaderRow) {
			firstRow = false;
			continue;
		} else if (row.every((d) => !d)) {
			continue; // skip blank lines
		}

		const location = row[settings.locationTableConfig.fieldPlaceName];
		const lon = row[settings.locationTableConfig.fieldLon];
		const lat = row[settings.locationTableConfig.fieldLat];

		locations[location] = [lon, lat];
	}
	return locations;
};

const getNodeTypesFromFile = (fileStore, settings) => {
	if (!settings.nodeMetadataConfig.hasMetadata) {
		return null;
	}

	const rawData = fileStore[settings.nodeMetadataConfig.selectedFile].data;
	const hasHeaderRow = fileStore[settings.nodeMetadataConfig.selectedFile].hasHeaderRow;

	const nodeTypes = [];

	let firstRow = true;
	for (const row of rawData) {
		// skip header row if required
		if (firstRow && hasHeaderRow) {
			firstRow = false;
			continue;
		} else if (row.every((d) => !d)) {
			continue; // skip blank lines
		}

		const nodeType = row[settings.nodeMetadataConfig.fieldNodeType];
		const nodeId = row[settings.nodeMetadataConfig.fieldNodeId];

		nodeTypes[nodeId] = nodeType;
	}

	console.log({ nodeTypes });

	return nodeTypes;
};

async function saveNetwork(settings, fileStore, reloadNetworks, dataset): Promise<void> {
	const SESSION_NAME = getUrlVars()['session'];

	const id = new Date().getTime();
	const currentNetwork = new Network(id);
	currentNetwork.name = settings.name;
	currentNetwork.networkCubeDataSet = dataset;

	storage.saveNetwork(currentNetwork, SESSION_NAME);

	currentNetwork.ready = true;
	main.importData(SESSION_NAME, dataset);

	reloadNetworks();
}

async function importNetworkFromTables(settings, fileStore, reloadNetworks): Promise<void> {
	const SESSION_NAME = getUrlVars()['session'];

	const id = new Date().getTime();
	const currentNetwork = new Network(id);
	currentNetwork.name = settings.name;

	storage.saveNetwork(currentNetwork, SESSION_NAME);

	// TODO: trim white-space from table entries (cleanTable())

	if (settings.fileFormat !== 'tabular') {
		return;
		// TODO: call file import methods
	}

	// Start with empty normalized tables
	const normalizedNodeTable = [];
	const normalizedLinkTable = [];
	const normalizedLocationTable = [];

	const normalizedNodeSchema = new dynamicgraphutils.NodeSchema(0);
	normalizedNodeSchema.id = 0;
	normalizedNodeSchema.label = 1;

	const normalizedLinkSchema = new dynamicgraphutils.LinkSchema(0, 1, 2);

	const normalizedLocationSchema = new dynamicgraphutils.LocationSchema(0, 1, 2, 3, 4); // id, label, geoname, lon, lat

	if (settings.linkDataType === 'nodeTable') {
		currentNetwork.directed = true;

		normalizedLinkSchema.linkType = 3;

		const relations = settings.nodeTableConfig.fieldRelations;
		const rawData = fileStore[settings.nodeTableConfig.selectedFile].data;
		const hasHeaderRow = fileStore[settings.nodeTableConfig.selectedFile].hasHeaderRow;

		const nodeColumnIndexes = [
			settings.nodeTableConfig.fieldNode,
			...relations.map((r) => r.field)
		];
		const nodeNames = []; // list of node names added to normalizedNodeTable
		const nodeIndex = []; // map from node name to id

		// iterate over rows of selected files, adding nodes from relevant columns, and storing indexes
		let firstRow = true;
		for (const row of rawData) {
			if (firstRow && hasHeaderRow) {
				firstRow = false;
				continue;
			} else if (row.every((d) => !d)) {
				continue; // skip blank lines
			}

			for (const index of nodeColumnIndexes) {
				const nodeName = row[index];

				if (!nodeNames.includes(nodeName)) {
					nodeNames.push(nodeName);

					nodeIndex[nodeName] = normalizedNodeTable.length;

					normalizedNodeTable.push([normalizedNodeTable.length, nodeName]);
				}
			}
		}

		firstRow = true;
		for (const row of rawData) {
			if (firstRow && hasHeaderRow) {
				firstRow = false;
				continue;
			} else if (row.every((d) => !d)) {
				continue; // skip blank lines
			}

			for (const relation of relations) {
				normalizedLinkTable.push([
					normalizedLinkTable.length, // link id
					nodeIndex[row[settings.nodeTableConfig.fieldNode]], // source node
					nodeIndex[row[relation.field]], // target node
					relation.relation // link type
				]);
			}
		}
	} else if (settings.linkDataType === 'linkTable') {
		currentNetwork.directed = settings.linkTableConfig.edgesAreDirected;

		// first identify all nodes in the link table
		const rawData = fileStore[settings.linkTableConfig.selectedFile].data;
		const hasHeaderRow = fileStore[settings.linkTableConfig.selectedFile].hasHeaderRow;
		const nodeColumnIndexes = [
			settings.linkTableConfig.fieldSourceId,
			settings.linkTableConfig.fieldTargetId
		];

		const nodeNames = []; // list of node names added to normalizedNodeTable
		const nodeIndex = []; // map from node name to id

		const locationNames = []; // array of location names
		const locationIndexes = []; // map from location name to id

		const timeParser = timeParse(settings.linkTableConfig.timeConfig.formatString);

		// check if the link table contains locations, and if so whether it also contains times
		const hasNodeLocations =
			settings.linkTableConfig.fieldLocationSource || settings.linkTableConfig.fieldLocationTarget;
		let maxIndex = 1;
		if (hasNodeLocations) {
			maxIndex++;
			normalizedNodeSchema.location = maxIndex;

			if (settings.linkTableConfig.timeConfig.timeField) {
				maxIndex++;
				normalizedNodeSchema.time = maxIndex;
			}
		}

		const nodeTypes = getNodeTypesFromFile(fileStore, settings);
		if (nodeTypes) {
			maxIndex++;
			normalizedNodeSchema.nodeType = maxIndex;
		}
		// TODO: add nodeType to schema

		const locationsFromFile = getLocationsFromFile(fileStore, settings);

		const getSourceLocation = (row) =>
			(row[settings.linkTableConfig.fieldLocationSource] || '').trim();
		const getTargetLocation = (row) =>
			(row[settings.linkTableConfig.fieldLocationTarget] || '').trim();

		// iterate over raw link table, populating the normalized node and location tables
		let firstRow = true;
		for (const row of rawData) {
			// skip header row if required
			if (firstRow && hasHeaderRow) {
				firstRow = false;
				continue;
			} else if (row.every((d) => !d)) {
				continue; // skip blank lines
			}

			// ensure source location is in location table
			if (settings.linkTableConfig.fieldLocationSource) {
				const sourceLocation = getSourceLocation(row);

				if (!locationNames.includes(sourceLocation)) {
					locationNames.push(sourceLocation);
					locationIndexes[sourceLocation] = normalizedLocationTable.length;

					const [long, lat] = locationsFromFile
						? locationsFromFile[sourceLocation]
						: await geoCode(sourceLocation);
					normalizedLocationTable.push([
						normalizedLocationTable.length, // id
						sourceLocation, // label
						sourceLocation, // geoname
						long,
						lat
					]);
				}
			}

			// ensure target location is in location table
			if (settings.linkTableConfig.fieldLocationTarget) {
				const targetLocation = getTargetLocation(row);

				if (!locationNames.includes(targetLocation)) {
					locationNames.push(targetLocation);
					locationIndexes[targetLocation] = normalizedLocationTable.length;

					const [long, lat] = locationsFromFile
						? locationsFromFile[targetLocation]
						: await geoCode(targetLocation);
					normalizedLocationTable.push([
						normalizedLocationTable.length, // id
						targetLocation, // label
						targetLocation, // geoname
						long,
						lat
					]);
				}
			}

			// ensure source node is in node table
			let index = settings.linkTableConfig.fieldSourceId;
			let nodeName = row[index];

			if (!nodeNames.includes(nodeName)) {
				// node had not previously been recorded in normalized node table
				nodeNames.push(nodeName);

				nodeIndex[nodeName] = nodeNames.length - 1;

				const node = [nodeNames.length - 1, nodeName];

				if (settings.linkTableConfig.fieldLocationSource) {
					node.push(locationIndexes[getSourceLocation(row)]);

					if (settings.linkTableConfig.timeConfig.timeField) {
						const originalTime = row[settings.linkTableConfig.timeConfig.timeField];
						const convertedTime = formatStandardTime(timeParser(originalTime));
						node.push(convertedTime);
					}
				}
				if (nodeTypes) {
					node.push(nodeTypes[nodeName]);
				}

				normalizedNodeTable.push(node);
			} else if (settings.linkTableConfig.timeConfig.timeField) {
				// node has already been recorded, but add another entry with same id but this time + location

				const node = [nodeIndex[nodeName], nodeName];

				if (settings.linkTableConfig.fieldLocationSource) {
					node.push(locationIndexes[getSourceLocation(row)]);

					const originalTime = row[settings.linkTableConfig.timeConfig.timeField];
					const convertedTime = formatStandardTime(timeParser(originalTime));
					node.push(convertedTime);
				}
				if (nodeTypes) {
					node.push(nodeTypes[nodeName]);
				}
				normalizedNodeTable.push(node);
			}

			// ensure target node is in normalized node table
			index = settings.linkTableConfig.fieldTargetId;
			nodeName = row[index];
			if (!nodeNames.includes(nodeName)) {
				// node had not previously been recorded in normalized node table
				nodeNames.push(nodeName);

				nodeIndex[nodeName] = nodeNames.length - 1;

				const node = [nodeNames.length - 1, nodeName];

				if (settings.linkTableConfig.fieldLocationTarget) {
					node.push(locationIndexes[getTargetLocation(row)]);

					if (settings.linkTableConfig.timeConfig.timeField) {
						const originalTime = row[settings.linkTableConfig.timeConfig.timeField];
						const convertedTime = formatStandardTime(timeParser(originalTime));
						node.push(convertedTime);
					}
				}
				if (nodeTypes) {
					node.push(nodeTypes[nodeName]);
				}
				normalizedNodeTable.push(node);
			} else if (settings.linkTableConfig.timeConfig.timeField) {
				// node has already been recorded, but add another entry with same id but this time + location

				const node = [nodeIndex[nodeName], nodeName];

				if (settings.linkTableConfig.fieldLocationTarget) {
					node.push(locationIndexes[getTargetLocation(row)]);

					const originalTime = row[settings.linkTableConfig.timeConfig.timeField];
					const convertedTime = formatStandardTime(timeParser(originalTime));
					node.push(convertedTime);
				}
				if (nodeTypes) {
					node.push(nodeTypes[nodeName]);
				}
				normalizedNodeTable.push(node);
			}
		}

		// add selected fields to schema
		let nextIndex = 3; // after id, soure_id, target_id

		if (settings.linkTableConfig.fieldLinkType) {
			normalizedLinkSchema.linkType = nextIndex;
			nextIndex++;
		}
		if (settings.linkTableConfig.fieldWeight) {
			normalizedLinkSchema.weight = nextIndex;
			nextIndex++;
		}
		if (settings.linkTableConfig.fieldLinkIsDirected) {
			normalizedLinkSchema.directed = nextIndex;
			nextIndex++;
		}

		if (settings.linkTableConfig.timeConfig.timeField) {
			normalizedLinkSchema.time = nextIndex;
			nextIndex++;
		}

		// iterate over raw link table, populating normalized link table
		firstRow = true;
		for (const row of rawData) {
			if (firstRow && hasHeaderRow) {
				firstRow = false;
				continue;
			} else if (row.every((d) => !d)) {
				continue; // skip blank lines
			}

			const link = [
				settings.linkTableConfig.fieldLinkId
					? row[settings.linkTableConfig.fieldLinkId]
					: normalizedLinkTable.length, // link id
				nodeIndex[row[settings.linkTableConfig.fieldSourceId]], // source node
				nodeIndex[row[settings.linkTableConfig.fieldTargetId]] // target node
			];
			if (settings.linkTableConfig.fieldLinkType) {
				link.push(row[settings.linkTableConfig.fieldLinkType]);
			}
			if (settings.linkTableConfig.fieldWeight) {
				link.push(row[settings.linkTableConfig.fieldWeight]);
			}
			if (settings.linkTableConfig.fieldLinkIsDirected) {
				link.push(row[settings.linkTableConfig.fieldLinkIsDirected]);
			}
			if (settings.linkTableConfig.timeConfig.timeField) {
				const originalTime = row[settings.linkTableConfig.timeConfig.timeField];
				const convertedTime = formatStandardTime(timeParser(originalTime));

				link.push(convertedTime);
			}

			normalizedLinkTable.push(link);
		}
	}

	// handle extra node metadata

	const params = {
		name: currentNetwork.name,
		nodeTable: normalizedNodeTable,
		linkTable: normalizedLinkTable,
		nodeSchema: normalizedNodeSchema,
		linkSchema: normalizedLinkSchema,
		locationTable: normalizedLocationTable,
		locationSchema: normalizedLocationSchema,
		timeFormat: currentNetwork.timeFormat,
		directed: currentNetwork.directed
	};
	const dataset = new dynamicgraphutils.DataSet(params);

	currentNetwork.ready = true;
	currentNetwork.userNodeTable = { name: 'userNodeTable', data: normalizedNodeTable };
	currentNetwork.userNodeSchema = { ...normalizedNodeSchema, relation: [] };
	currentNetwork.userLinkTable = { name: 'userLinkTable', data: normalizedLinkTable };
	currentNetwork.userLinkSchema = {
		...normalizedLinkSchema,
		location_source: -1,
		location_target: -1
	};
	currentNetwork.userLocationTable = { name: 'userLocationTable', data: normalizedLocationTable };
	currentNetwork.userLocationSchema = normalizedLocationSchema;

	currentNetwork.networkCubeDataSet = dataset;

	storage.saveNetwork(currentNetwork, SESSION_NAME);
	main.importData(SESSION_NAME, dataset);

	reloadNetworks();
}

function importNetworkFromFile(settings, fileStore, reloadNetworks) {
	let dataset;
	const rawData = fileStore[settings.networkFileConfig.selectedFile].data;

	const fileName = settings.networkFileConfig.selectedFile.toLowerCase();
	if (fileName.endsWith('.ged')) {
		dataset = parseGEDCOM(settings.name, rawData);
	} else if (fileName.endsWith('.paj') || fileName.endsWith('.net')) {
		dataset = parsePajek(settings.name, rawData);
	} else if (fileName.endsWith('.graphml') || fileName.endsWith('.xml')) {
		dataset = parseXML(settings.name, rawData);
	}

	if (dataset) {
		const SESSION_NAME = getUrlVars()['session'];

		const id = new Date().getTime();
		const currentNetwork = new Network(id);
		currentNetwork.name = settings.name;
		currentNetwork.directed = true;

		storage.saveNetwork(currentNetwork, SESSION_NAME);

		currentNetwork.ready = true;
		currentNetwork.userNodeTable = { name: 'userNodeTable', data: dataset.nodeTable };
		currentNetwork.userNodeSchema = { ...dataset.nodeSchema, relation: [] };
		currentNetwork.userLinkTable = { name: 'userLinkTable', data: dataset.linkTable };
		currentNetwork.userLinkSchema = {
			...dataset.linkSchema,
			location_source: -1,
			location_target: -1
		};
		currentNetwork.networkCubeDataSet = dataset;
		storage.saveNetwork(currentNetwork, SESSION_NAME);

		main.importData(SESSION_NAME, dataset);

		reloadNetworks();
	}
}

export { importNetworkFromTables, importNetworkFromFile, saveNetwork };
