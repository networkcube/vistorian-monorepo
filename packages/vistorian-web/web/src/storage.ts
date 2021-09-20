import * as vistorian from './vistorian';
import * as main from 'vistorian-core/src/main';


const SESSION_TABLENAMES = "vistorian.tablenames";
const SESSION_TABLE = "vistorian.table";
const SESSION_NETWORK = "vistorian.network";
const SESSION_NETWORKIDS = "vistorian.networkIds";
const SESSION_SESSIONID = "vistorian.lastSessionId";

const SEP = "#";


// SESSION
export function saveSessionId(sessionid: string) {
    if (sessionid)
        $.jStorage.set("vistorian.lastSessionId", sessionid);
  
}

export function getLastSessionId(): string {
    const session: string = $.jStorage.get<string>("vistorian.lastSessionId");
    return session;
}


//////////////
/// TABLES ///
//////////////


// Stores all user's tables (tables must be in json format)
export function saveUserTable(table: any, sessionid: string) {

    // add name to table names if not yet there.
    let tableNames: string[] = getTableNames(sessionid);
    let found = false;
    if (!tableNames) {
        tableNames = [];
    } else {
        tableNames.forEach(tableName => {
            if (tableName == table.name) {
                found = true;
            }
        })
    }
    if (!found) {
        tableNames.push(table.name);
        saveTableNames(tableNames, sessionid);
    } 
    $.jStorage.set(sessionid + "#" + "vistorian.table" + "#" + table.name, table);

}

// returns all users' tables
export function getUserTables(sessionid: string): vistorian.VTable[] {

    const tablenames: string[] = getTableNames(sessionid);
    const tables: vistorian.VTable[] = [];
    for (let i = 0; i < tablenames.length; i++) {
        tables.push($.jStorage.get<vistorian.VTable>(sessionid + "#" + "vistorian.table" + "#" + tablenames[i]));
    }

    return tables;
}

export function getUserTable(tablename: string, sessionid: string): vistorian.VTable {
    return $.jStorage.get<vistorian.VTable>(sessionid + "#" + "vistorian.table" + "#" + tablename)
}

export function getTableNames(sessionid: string): string[] {
    let names: string[] = $.jStorage.get<string[]>(sessionid + "#" + "vistorian.tablenames");
    if (names == undefined)
        names = []
    return names;
}
export function saveTableNames(tableNames: any, sessionid: string) {
    $.jStorage.set(sessionid + "#" + "vistorian.tablenames", tableNames);
}
export function deleteTable(table: vistorian.VTable, sessionid: string) {
    $.jStorage.deleteKey(sessionid + "#" + "vistorian.table" + "#" + table.name);

    let tableNames: string[] = getTableNames(sessionid);
    let found = false;
    if (!tableNames) {
        tableNames = [];
    } else {
        tableNames.forEach(tableName => {
            if (tableName == table.name) {
                found = true;
            }
        })
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
    let ids: number[] = $.jStorage.get(sessionid + "#" + "vistorian.networkIds");

    if (ids == undefined)
        ids = []
    return ids;
}

export function saveNetwork(network: vistorian.Network, sessionid: string) {

    // add name to table names if not yet there.
    let networkIds: number[] = getNetworkIds(sessionid);
    let found = false;
    if (!networkIds) {
        networkIds = [];
    } else {
        networkIds.forEach(networkId => {
            if (networkId == network.id) {
                found = true;
            }
        })
    }
    if (!found) {
        networkIds.push(network.id);
        saveNetworkIds(networkIds, sessionid);
    }
    $.jStorage.set(sessionid + "#" + "vistorian.network" + "#" + network.id, network);

}

export function saveNetworkIds(networkIds: any, sessionid: string) {
    $.jStorage.set(sessionid + "#" + "vistorian.networkIds", networkIds);
}

export function getNetwork(networkId: string, sessionid: string): vistorian.Network {
    return $.jStorage.get<vistorian.Network>(sessionid + "#" + "vistorian.network" + "#" + networkId);
}

export function deleteNetwork(network: vistorian.Network, sessionid: string) {
    main.deleteData(network.name);
    deleteNetworkById(network.id, sessionid);

}
export function deleteNetworkById(id: number, sessionid: string) {
    // remove network tables from local storage: 

    $.jStorage.set(sessionid + "#" + "vistorian.network" + "#" + id, {});
    $.jStorage.deleteKey(sessionid + "#" + "vistorian.network" + "#" + id);

    let networkIds: number[] = getNetworkIds(sessionid);
    let found = false;
    if (!networkIds) {
        networkIds = [];
    } else {
        networkIds.forEach(networkId => {
            if (networkId == id) {
                found = true;
            }
        })
    }
    if (found) {
        networkIds.splice(networkIds.indexOf(id), 1);
        saveNetworkIds(networkIds, sessionid);
    }
}
