import {
    getUrlVars
} from './utils'
import { DataSet } from './datamanager'
import { DynamicGraph, DataManager, DataManagerOptions } from './dynamicgraph'

/** A collection of Networkcube's  global function availeble
 * through networkcube.myFunc()
 * */

// must agree with var of same name in DynamicGraph.initDynamicGraph()
export var TIME_FORMAT: string = 'YYYY-MM-DD hh:mm:ss';
/**
 * Returns the networkcube standart time format
 * @return {[type]} [description]
 */
export function timeFormat() {
    return TIME_FORMAT;
}


// GLOBAL VARIABLES
var dataManager: DataManager = new DataManager();
var session: string;

export function getSessionId() {
    return session;
}

export function setDataManagerOptions(options: DataManagerOptions): void {
    dataManager.setOptions(options);
}

export function isSessionCached(session: string, dataSetName: string) {
    return dataManager.isSessionCached(session, dataSetName);
}

// DATA
/**
 * Imports a data set into network cube.
 * @param  {string}  session [description]
 * @param  {DataSet} data    [description]
 * @return {[type]}          [description]
 */
export function importData(sessionName: string, data: DataSet) {
    console.log('[n3] Import data', data.name);
    session = sessionName;
    dataManager.importData(sessionName, data);
}

export function clearAllDataManagerSessionCaches() {
    dataManager.clearAllSessionData();
}


export function getDynamicGraph(dataName?: string, sessionName?: string): DynamicGraph {
    var vars = getUrlVars();
    if (!dataName)
        dataName = (vars as any)['datasetName'];
    if (!sessionName)
        session = (vars as any)['session'];
    else
        session = sessionName;

    return dataManager.getGraph(session, (dataName as string));
}


// VIEWS + VISUALIZATIONS


// opens a new window and loads a visualization of type vistype,
// // with the data set dataname
export function openVisualizationWindow(session: string, visUri: string, dataName: string) {
    openView(session, visUri, dataName, false);
}

// opens a new tab and loads a visualization of type vistype,
// // with the data set dataname
export function openVisualizationTab(session: string, visUri: string, dataName: string) {
    openView(session, visUri, dataName, true);
}

// create a tab that shows one of the specified visualizations at a time
export function createTabVisualizations(parentId: string, visSpec: any[], session: string, dataName: string,
    width: number,
    height: number, visParams?: any) {

    var parent = $('#' + parentId);

    var tabDiv = $('<div></div>')
    parent.append(tabDiv)

    var visDiv = $('<div></div>')
    parent.append(visDiv)


    var ul = $('<ul class="networkcube-tabs"\
                style="\
                    list-style-type: none;\
                    margin: 0;\
                    padding:2px;\
                    overflow: hidden;\
                    border: none;\
                    background-color: #f1f1f1;"\
                ></ul>')
    tabDiv.append(ul)

    // create tabs and divs
    for (var i = 0; i < visSpec.length; i++) {
        visSpec[i].name = visSpec[i].name.replace(' ', '-')
        ul.append($('<li style="float: left;"><a style="\
                display: inline-block;\
                color: black;\
                margin-right: 8px;\
                margin-left: 8px;\
                padding: 5px;\
                text-align: left;\
                text-decoration: none;\
                transition: 0.3s;\
                font-weight: 800;\
                border: #fff 1px solid;\
                border-raduis: 5px;\
                font-size: 13px;" href="#" class="networkcube-tablinks" onclick="networkcube.switchVisTab(event, \''+ visSpec[i].name + '\')">' + visSpec[i].name + '</a></li>'))
        visDiv.append($('<div id="networkcube-visTab-' + visSpec[i].name + '" style="display:' + (i == 0 ? 'block' : 'none') + ';" class="networkcube-visTabContent"></div>'))
        createVisualizationIFrame('networkcube-visTab-' + visSpec[i].name, visSpec[i].url, session, dataName, width, height, visParams)
    }
}

export function switchVisTab(evt: any, visName: string) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("networkcube-visTabContent") as HTMLCollectionOf<HTMLElement>;
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("networkcube-tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the link that opened the tab
    // ADD IF GETELEMENT IS NULL
    var element =  document.getElementById('networkcube-visTab-' + visName);
    if(element) {
        element.style.display = "block";
    }
    evt.currentTarget.className += " active";
}

// returns an iframe that loads a visualization of type vistype,
// with the data set dataname
export function createVisualizationIFrame(parentId: string, visUri: string, session: string, dataName: string,
    width: number,
    height: number, visParams?: any) {

    $('#' + parentId)
        .append('<iframe></iframe>')
        .attr('width', width)
        .attr('height', height)

    var iframe = $('#' + parentId + '> iframe')

    var visParamString = '';
    for (var prop in visParams) {
        visParamString += '&' + prop + '=' + visParams[prop];
    }
    iframe.attr('src', visUri + '?'
        + 'session=' + session
        + '&datasetName=' + dataName
        + visParamString
    );
    if (width)
        iframe.attr('width', width);
    if (height)
        iframe.attr('height', height)

    if (visParams != undefined && visParams.hasOwnProperty('scrolling')) {
        iframe.attr('scrolling', visParams.scrolling);
    }

    return iframe;
}
//
// // Internal convenient function to open a window
function openView(session: string, visUri: string, dataname: string, tab: boolean) {

    var url = visUri + '?session=' + session + '&datasetName=' + dataname;

    if (tab)
        window.open(url, '_blank');
    else
        window.open(url);
}

export function getURLString(dataName: string) {
    return '?session=' + session + '&datasetName=' + dataName;
}

/// UTILITY FUNCTIONS
export enum OrderType { Local, Global, Data };

export function isTrackingEnabled(): Boolean {
    var value = localStorage.getItem("NETWORKCUBE_IS_TRACKING_ENABLED");
    return value == 'true' ? true : false;
}

export function isTrackingSet(): Boolean {
    var value = localStorage.getItem("NETWORKCUBE_IS_TRACKING_ENABLED");
    return value === null ? false : true;
}

export function deleteData(dataSetName: string){
    // deletes a network
    getDynamicGraph(dataSetName).delete(dataManager);
}
