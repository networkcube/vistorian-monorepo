"use strict";
exports.__esModule = true;
exports.deleteNetworkById = exports.deleteNetwork = exports.getNetwork = exports.saveNetworkIds = exports.saveNetwork = exports.getNetworkIds = exports.deleteTable = exports.saveTableNames = exports.getTableNames = exports.getUserTable = exports.getUserTables = exports.saveUserTable = exports.getLastSessionId = exports.saveSessionId = void 0;
var main = require("vistorian-core/src/main");
var SESSION_TABLENAMES = "vistorian.tablenames";
var SESSION_TABLE = "vistorian.table";
var SESSION_NETWORK = "vistorian.network";
var SESSION_NETWORKIDS = "vistorian.networkIds";
var SESSION_SESSIONID = "vistorian.lastSessionId";
var SEP = "#";
// SESSION
function saveSessionId(sessionid) {
    $.jStorage.set("vistorian.lastSessionId", sessionid);
}
exports.saveSessionId = saveSessionId;
function getLastSessionId() {
    var session = $.jStorage.get("vistorian.lastSessionId");
    return session;
}
exports.getLastSessionId = getLastSessionId;
//////////////
/// TABLES ///
//////////////
// Stores all user's tables (tables must be in json format)
function saveUserTable(table, sessionid) {
    // add name to table names if not yet there.
    var tableNames = getTableNames(sessionid);
    var found = false;
    if (!tableNames) {
        tableNames = [];
    }
    else {
        tableNames.forEach(function (tableName) {
            if (tableName == table.name) {
                found = true;
            }
        });
    }
    if (!found) {
        tableNames.push(table.name);
        saveTableNames(tableNames, sessionid);
    }
    $.jStorage.set(sessionid + "#" + "vistorian.table" + "#" + table.name, table);
}
exports.saveUserTable = saveUserTable;
// returns all users' tables
function getUserTables(sessionid) {
    var tablenames = getTableNames(sessionid);
    var tables = [];
    for (var i = 0; i < tablenames.length; i++) {
        tables.push($.jStorage.get(sessionid + "#" + "vistorian.table" + "#" + tablenames[i]));
    }
    return tables;
}
exports.getUserTables = getUserTables;
function getUserTable(tablename, sessionid) {
    return $.jStorage.get(sessionid + "#" + "vistorian.table" + "#" + tablename);
}
exports.getUserTable = getUserTable;
function getTableNames(sessionid) {
    var names = $.jStorage.get(sessionid + "#" + "vistorian.tablenames");
    if (names == undefined)
        names = [];
    return names;
}
exports.getTableNames = getTableNames;
function saveTableNames(tableNames, sessionid) {
    $.jStorage.set(sessionid + "#" + "vistorian.tablenames", tableNames);
}
exports.saveTableNames = saveTableNames;
function deleteTable(table, sessionid) {
    $.jStorage.deleteKey(sessionid + "#" + "vistorian.table" + "#" + table.name);
    var tableNames = getTableNames(sessionid);
    var found = false;
    if (!tableNames) {
        tableNames = [];
    }
    else {
        tableNames.forEach(function (tableName) {
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
exports.deleteTable = deleteTable;
////////////////
/// NETWORKS ///
////////////////
function getNetworkIds(sessionid) {
    var ids = $.jStorage.get(sessionid + "#" + "vistorian.networkIds");
    if (ids == undefined)
        ids = [];
    return ids;
}
exports.getNetworkIds = getNetworkIds;
function saveNetwork(network, sessionid) {
    // add name to table names if not yet there.
    var networkIds = getNetworkIds(sessionid);
    var found = false;
    if (!networkIds) {
        networkIds = [];
    }
    else {
        networkIds.forEach(function (networkId) {
            if (networkId == network.id) {
                found = true;
            }
        });
    }
    if (!found) {
        networkIds.push(network.id);
        saveNetworkIds(networkIds, sessionid);
    }
    $.jStorage.set(sessionid + "#" + "vistorian.network" + "#" + network.id, network);
}
exports.saveNetwork = saveNetwork;
function saveNetworkIds(networkIds, sessionid) {
    $.jStorage.set(sessionid + "#" + "vistorian.networkIds", networkIds);
}
exports.saveNetworkIds = saveNetworkIds;
function getNetwork(networkId, sessionid) {
    return $.jStorage.get(sessionid + "#" + "vistorian.network" + "#" + networkId);
}
exports.getNetwork = getNetwork;
function deleteNetwork(network, sessionid) {
    main.deleteData(network.name);
    deleteNetworkById(network.id, sessionid);
}
exports.deleteNetwork = deleteNetwork;
function deleteNetworkById(id, sessionid) {
    // remove network tables from local storage: 
    $.jStorage.set(sessionid + "#" + "vistorian.network" + "#" + id, {});
    $.jStorage.deleteKey(sessionid + "#" + "vistorian.network" + "#" + id);
    var networkIds = getNetworkIds(sessionid);
    var found = false;
    if (!networkIds) {
        networkIds = [];
    }
    else {
        networkIds.forEach(function (networkId) {
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
exports.deleteNetworkById = deleteNetworkById;
