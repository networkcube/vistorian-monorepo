import type { VTable, Network } from './vistorian';
import * as main from 'vistorian-core/src/data/main';

// SESSION
export function saveSessionId(sessionid: string) {
	if (sessionid) localStorage.setItem('vistorian.lastSessionId', sessionid);
}

export function getLastSessionId(): string {
	const session: string = localStorage.getItem('vistorian.lastSessionId');
	return session;
}

//////////////
/// TABLES ///
//////////////

const save = (key, value) => {
	localStorage.setItem(key, JSON.stringify(value));
};

const read = (key) => {
	return JSON.parse(localStorage.getItem(key));
};

// Stores all user's tables (tables must be in json format)
export function saveUserTable(table: any, sessionid: string) {
	// add name to table names if not yet there.
	let tableNames: string[] = getTableNames(sessionid);
	let found = false;
	if (!tableNames) {
		tableNames = [];
	} else {
		tableNames.forEach((tableName) => {
			if (tableName == table.name) {
				found = true;
			}
		});
	}
	if (!found) {
		tableNames.push(table.name);
		saveTableNames(tableNames, sessionid);
	}
	save(`${sessionid}#vistorian.table#${table.name}`, table);
}

// returns all users' tables
export function getUserTables(sessionid: string): VTable[] {
	const tablenames: string[] = getTableNames(sessionid);
	const tables: VTable[] = [];
	for (let i = 0; i < tablenames.length; i++) {
		tables.push(read(`${sessionid}#vistorian.table#${tablenames[i]}`));
	}

	return tables;
}

export function getUserTable(tablename: string, sessionid: string): VTable {
	return read(`${sessionid}#vistorian.table#${tablename}`);
}

export function getTableNames(sessionid: string): string[] {
	let names: string[] = read(`${sessionid}#vistorian.tablenames`);
	if (names == undefined) names = [];
	return names;
}

export function saveTableNames(tableNames: any, sessionid: string) {
	save(`${sessionid}#vistorian.tablenames`, tableNames);
}

export function deleteTable(table: VTable, sessionid: string) {
	localStorage.removeItem(`${sessionid}#vistorian.table#${table.name}`);

	let tableNames: string[] = getTableNames(sessionid);
	let found = false;
	if (!tableNames) {
		tableNames = [];
	} else {
		tableNames.forEach((tableName) => {
			if (tableName == table.name) {
				found = true;
			}
		});
	}
	if (found) {
		tableNames.splice(tableNames.indexOf(table.name), 1);
		saveTableNames(tableNames, sessionid);
	}
}

////////////////
/// NETWORKS ///
////////////////

export function getNetworkIds(sessionid: string): number[] {
	let ids: number[] = read(`${sessionid}#NetworkIds`);

	if (ids == undefined) ids = [];
	return ids;
}

export function saveNetwork(network: Network, sessionid: string) {
	// add name to table names if not yet there.
	let networkIds: number[] = getNetworkIds(sessionid);
	let found = false;
	if (!networkIds) {
		networkIds = [];
	} else {
		networkIds.forEach((networkId) => {
			if (networkId == network.id) {
				found = true;
			}
		});
	}
	if (!found) {
		networkIds.push(network.id);
		saveNetworkIds(networkIds, sessionid);
	}
	save(`${sessionid}#Network#${network.id}`, network);
}

export function saveNetworkIds(networkIds: any, sessionid: string) {
	save(`${sessionid}#NetworkIds`, networkIds);
}

export function getNetwork(networkId: string, sessionid: string): Network {
	return read(`${sessionid}#Network#${networkId}`);
}

export function deleteNetwork(network: Network, sessionid: string) {
	main.deleteData(network.name);
	deleteNetworkById(network.id, sessionid);
}

export function deleteNetworkById(id: number, sessionid: string) {
	// remove network tables from local storage:

	save(`${sessionid}#Network#${id}`, {});
	localStorage.removeItem(`${sessionid}#Network${id}`);

	let networkIds: number[] = getNetworkIds(sessionid);
	let found = false;
	if (!networkIds) {
		networkIds = [];
	} else {
		networkIds.forEach((networkId) => {
			if (networkId == id) {
				found = true;
			}
		});
	}
	if (found) {
		networkIds.splice(networkIds.indexOf(id), 1);
		saveNetworkIds(networkIds, sessionid);
	}
}
