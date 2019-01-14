/// <reference path="./datamanager.ts" />
/// <reference path="./dynamicgraph.ts" />
/// <reference path="./utils.ts" />
/// <reference path="../scripts/jquery.d.ts" />
/** A collection of Networkcube's  global function availeble
 * through networkcube.myFunc()
 * */
var networkcube;
(function (networkcube) {
    // must agree with var of same name in DynamicGraph.initDynamicGraph()
    networkcube.TIME_FORMAT = 'YYYY-MM-DD hh:mm:ss';
    /**
     * Returns the networkcube standart time format
     * @return {[type]} [description]
     */
    function timeFormat() {
        return networkcube.TIME_FORMAT;
    }
    networkcube.timeFormat = timeFormat;
    // GLOBAL VARIABLES
    var dataManager = new DataManager();
    var session;
    function setSession(sessionName) {
        session = sessionName;
    }
    networkcube.setSession = setSession;
    function setDataManagerOptions(options) {
        dataManager.setOptions(options);
    }
    networkcube.setDataManagerOptions = setDataManagerOptions;
    function isSessionCached(session, dataSetName) {
        return dataManager.isSessionCached(session, dataSetName);
    }
    networkcube.isSessionCached = isSessionCached;
    // DATA
    /**
     * Imports a data set into network cube.
     * @param  {string}  session [description]
     * @param  {DataSet} data    [description]
     * @return {[type]}          [description]
     */
    function importData(sessionName, data) {
        console.log('[n3] Import data', data.name);
        session = sessionName;
        dataManager.importData(sessionName, data);
    }
    networkcube.importData = importData;
    function deleteData(dataSetName) {
        // deletes a network
        getDynamicGraph(dataSetName)["delete"](dataManager);
    }
    networkcube.deleteData = deleteData;
    function clearAllDataManagerSessionCaches() {
        dataManager.clearAllSessionData();
    }
    networkcube.clearAllDataManagerSessionCaches = clearAllDataManagerSessionCaches;
    // getData() -> gets session and datatype parameter from the url
    // getData(datsetname) -> retrives data from current session
    //     export function getData(dataName?: string): DataSet {
    //         // console.log('getUrlVars()', getUrlVars())
    //         if (!dataName)
    //             dataName = getUrlVars()['datasetName'];
    //         this.session = getUrlVars()['session'];
    // 
    //         // console.log('call getData',dataName, this.session)
    //         return dataManager.getData(this.session, dataName);
    //     }
    // Updates the passed data set
    // export function updateData(dataSet: DataSet) {
    //     dataManager.updateData(dataSet);
    // }
    function getDynamicGraph(dataName, session) {
        var so = setOps;
        uidMethod = so.pushUid(function () {
            return this._id;
        });
        var vars = getUrlVars();
        // console.log('getUrlVars()', vars)
        if (!dataName)
            dataName = vars['datasetName'];
        if (!session)
            this.session = vars['session'];
        else
            this.session = session;
        // console.log('[networkcube] getDynamicGraph', dataName, this.session)
        return dataManager.getGraph(this.session, dataName);
    }
    networkcube.getDynamicGraph = getDynamicGraph;
    // VIEWS + VISUALIZATIONS
    // opens a new window and loads a visualization of type vistype,
    // // with the data set dataname
    function openVisualizationWindow(session, visUri, dataName) {
        // console.log('[n3] Create Visualization', visType, 'for data', dataName);
        openView(session, visUri, dataName, false);
    }
    networkcube.openVisualizationWindow = openVisualizationWindow;
    // opens a new tab and loads a visualization of type vistype,
    // // with the data set dataname
    function openVisualizationTab(session, visUri, dataName) {
        // console.log('[n3] Create Visualization', visType, 'for data', dataName);
        openView(session, visUri, dataName, true);
    }
    networkcube.openVisualizationTab = openVisualizationTab;
    // create a tab that shows one of the specified visualizations at a time
    function createTabVisualizations(parentId, visSpec, session, dataName, width, height, visParams) {
        var parent = $('#' + parentId);
        var tabDiv = $('<div></div>');
        parent.append(tabDiv);
        var visDiv = $('<div></div>');
        parent.append(visDiv);
        var ul = $('<ul class="networkcube-tabs"\
                style="\
                    list-style-type: none;\
                    margin: 0;\
                    padding:2px;\
                    overflow: hidden;\
                    border: none;\
                    background-color: #f1f1f1;"\
                ></ul>');
        tabDiv.append(ul);
        // create tabs and divs
        for (var i = 0; i < visSpec.length; i++) {
            visSpec[i].name = visSpec[i].name.replace(' ', '-');
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
                font-size: 13px;" href="#" class="networkcube-tablinks" onclick="networkcube.switchVisTab(event, \'' + visSpec[i].name + '\')">' + visSpec[i].name + '</a></li>'));
            visDiv.append($('<div id="networkcube-visTab-' + visSpec[i].name + '" style="display:' + (i == 0 ? 'block' : 'none') + ';" class="networkcube-visTabContent"></div>'));
            createVisualizationIFrame('networkcube-visTab-' + visSpec[i].name, visSpec[i].url, session, dataName, width, height, visParams);
        }
    }
    networkcube.createTabVisualizations = createTabVisualizations;
    function switchVisTab(evt, visName) {
        // Declare all variables
        var i, tabcontent, tablinks;
        // Get all elements with class="tabcontent" and hide them
        tabcontent = document.getElementsByClassName("networkcube-visTabContent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        // Get all elements with class="tablinks" and remove the class "active"
        tablinks = document.getElementsByClassName("networkcube-tablinks");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        // Show the current tab, and add an "active" class to the link that opened the tab
        document.getElementById('networkcube-visTab-' + visName).style.display = "block";
        evt.currentTarget.className += " active";
    }
    networkcube.switchVisTab = switchVisTab;
    // returns an iframe that loads a visualization of type vistype,
    // with the data set dataname
    function createVisualizationIFrame(parentId, visUri, session, dataName, width, height, visParams) {
        // console.log('[networkcube] Create iframe ', visType);
        $('#' + parentId)
            .append('<iframe></iframe>')
            .attr('width', width)
            .attr('height', height);
        var iframe = $('#' + parentId + '> iframe');
        var visParamString = '';
        for (var prop in visParams) {
            visParamString += '&' + prop + '=' + visParams[prop];
        }
        iframe.attr('src', visUri + '?'
            + 'session=' + session
            + '&datasetName=' + dataName
            + visParamString);
        if (width)
            iframe.attr('width', width);
        if (height)
            iframe.attr('height', height);
        if (visParams != undefined && visParams.hasOwnProperty('scrolling')) {
            iframe.attr('scrolling', visParams.scrolling);
        }
        return iframe;
    }
    networkcube.createVisualizationIFrame = createVisualizationIFrame;
    //
    // // Internal convenient function to open a window
    function openView(session, visUri, dataname, tab) {
        var url = visUri + '?session=' + session + '&datasetName=' + dataname;
        if (tab)
            window.open(url, '_blank');
        else
            window.open(url);
    }
    function getURLString(dataName) {
        return '?session=' + session + '&datasetName=' + dataName;
    }
    networkcube.getURLString = getURLString;
    // // creates a visualization of type vistype. This function
    // // must be called form the individual visualization windows to obtain the
    // // visualization object.
    // export function getVisualization(vistype:string):Visualization{
    //     var vis:Visualization = new networkcube[vistype]();
    //     return vis;
    // }
    /// UTILITY FUNCTIONS
    var OrderType;
    (function (OrderType) {
        OrderType[OrderType["Local"] = 0] = "Local";
        OrderType[OrderType["Global"] = 1] = "Global";
        OrderType[OrderType["Data"] = 2] = "Data";
    })(OrderType = networkcube.OrderType || (networkcube.OrderType = {}));
    ;
})(networkcube || (networkcube = {}));
