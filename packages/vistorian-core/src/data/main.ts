import { getUrlVars } from "./utils";
import { DataSet } from "./dynamicgraphutils";
import { DynamicGraph } from "./dynamicgraph";
import { DataManager, DataManagerOptions } from "./datamanager";

/** A collection of Networkcube's  global function available
 * through networkcube.myFunc()
 * */

// must agree with var of same name in DynamicGraph.initDynamicGraph()
export const TIME_FORMAT = "YYYY-MM-DD hh:mm:ss";

/**
 * Returns the networkcube standard time format
 * @return {[type]} [description]
 */
export function timeFormat(): string {
  return TIME_FORMAT;
}

// GLOBAL VARIABLES
const dataManager: DataManager = new DataManager();
let session: string;

export function getSessionId(): string {
  return session;
}

export function setDataManagerOptions(options: DataManagerOptions): void {
  dataManager.setOptions(options);
}

export function isSessionCached(session: string, dataSetName: string): boolean {
  return dataManager.isSessionCached(session, dataSetName);
}

// DATA
/**
 * Imports a data set into network cube.
 * @param  {string}  sessionName [description]
 * @param  {DataSet} data    [description]
 */
export function importData(sessionName: string, data: DataSet): void {
  console.log("[n3] Import data", data.name);
  session = sessionName;
  dataManager.importData(sessionName, data);
}

export function clearAllDataManagerSessionCaches(): void {
  dataManager.clearAllSessionData();
}

export function getDynamicGraph(
  dataName?: string,
  sessionName?: string
): DynamicGraph {
  const vars = getUrlVars();
  if (!dataName) dataName = (vars as any)["datasetName"];
  if (!sessionName) session = (vars as any)["session"];
  else session = sessionName;

  return dataManager.getGraph(session, dataName as string);
}

// VIEWS + VISUALIZATIONS

// opens a new window and loads a visualization of type vistype,
// // with the data set dataname
export function openVisualizationWindow(
  session: string,
  visUri: string,
  dataName: string
): void {
  openView(session, visUri, dataName, false);
}

// opens a new tab and loads a visualization of type vistype,
// // with the data set dataname
export function openVisualizationTab(
  session: string,
  visUri: string,
  dataName: string
): void {
  openView(session, visUri, dataName, true);
}

// create a tab that shows one of the specified visualizations at a time
export function createTabVisualizations(
  parentId: string,
  visSpec: any[],
  session: string,
  dataName: string,
  width: number,
  height: number,
  visParams?: any
): void {
  const parent = $("#" + parentId);

  const tabDiv = $("<div></div>");
  parent.append(tabDiv);

  const visDiv = $("<div></div>");
  parent.append(visDiv);

  const ul = $(
    '<ul class="networkcube-tabs"\
                    style="\
                        list-style-type: none;\
                        margin: 0;\
                        padding:2px;\
                        overflow: hidden;\
                        border: none;\
                        background-color: #f1f1f1;"\
                    ></ul>'
  );
  tabDiv.append(ul);

  // create tabs and divs
  for (let i = 0; i < visSpec.length; i++) {
    visSpec[i].name = visSpec[i].name.replace(" ", "-");
    ul.append(
      $(
        '<li style="float: left;"><a style="\
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
                        border-radius: 5px;\
                        font-size: 13px;" href="#" class="networkcube-tablinks" onclick="networkcube.switchVisTab(event, \'' +
          visSpec[i].name +
          "')\">" +
          visSpec[i].name +
          "</a></li>"
      )
    );
    visDiv.append(
      $(
        '<div id="networkcube-visTab-' +
          visSpec[i].name +
          '" style="display:' +
          (i == 0 ? "block" : "none") +
          ';" class="networkcube-visTabContent"></div>'
      )
    );
    createVisualizationIFrame(
      "networkcube-visTab-" + visSpec[i].name,
      visSpec[i].url,
      session,
      dataName,
      width,
      height,
      visParams
    );
  }
}

export function switchVisTab(evt: any, visName: string): void {
  // Get all elements with class="tabcontent" and hide them
  const tabcontent = document.getElementsByClassName(
    "networkcube-visTabContent"
  ) as HTMLCollectionOf<HTMLElement>;
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  const tablinks = document.getElementsByClassName("networkcube-tablinks");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the link that opened the tab
  // ADD IF GETELEMENT IS NULL
  const element = document.getElementById("networkcube-visTab-" + visName);
  if (element) {
    element.style.display = "block";
  }
  evt.currentTarget.className += " active";
}

// returns an iframe that loads a visualization of type vistype,
// with the data set dataname
export function createVisualizationIFrame(
  parentId: string,
  visUri: string,
  session: string,
  dataName: string,
  width: number,
  height: number,
  visParams?: any
): JQuery {
  $("#" + parentId)
    .append("<iframe></iframe>")
    .attr("width", width)
    .attr("height", height);

  const iframe = $("#" + parentId + "> iframe");

  let visParamString = "";
  for (const prop in visParams) {
    visParamString += "&" + prop + "=" + visParams[prop];
  }

  if (!visUri.startsWith("http")) {
    let server;
    if (window.location.port)
      server =
        location.protocol +
        "//" +
        window.location.hostname +
        ":" +
        window.location.port +
        "" +
        window.location.pathname;
    else
      server =
        location.protocol +
        "//" +
        window.location.hostname +
        "" +
        window.location.pathname;
    visUri = server + "/node_modules/vistorian-" + visUri + "/web/index.html";
  }

  iframe.attr(
    "src",
    visUri +
      "?" +
      "session=" +
      session +
      "&datasetName=" +
      dataName +
      visParamString
  );
  if (width) iframe.attr("width", width);
  if (height) iframe.attr("height", height);

  if (
    visParams != undefined &&
    Object.prototype.hasOwnProperty.call(visParams, "scrolling")
  ) {
    iframe.attr("scrolling", visParams.scrolling);
  }

  return iframe;
}

//
// // Internal convenient function to open a window
function openView(
  session: string,
  visUri: string,
  dataname: string,
  tab: boolean
) {
  if (!visUri.startsWith("http")) {
    let server;
    if (window.location.port)
      server =
        location.protocol +
        "//" +
        window.location.hostname +
        ":" +
        window.location.port +
        "" +
        window.location.pathname;
    else
      server =
        location.protocol +
        "//" +
        window.location.hostname +
        "" +
        window.location.pathname;
    visUri = server + "/node_modules/vistorian-" + visUri + "/web/index.html";
  }

  const url = visUri + "?session=" + session + "&datasetName=" + dataname;

  if (tab) window.open(url, "_blank");
  else window.open(url);
}

export function getURLString(dataName: string): string {
  return "?session=" + session + "&datasetName=" + dataName;
}

/// UTILITY FUNCTIONS
export enum OrderType {
  Local,
  Global,
  Data,
}

export function isTrackingEnabled(): boolean {
  const value = localStorage.getItem("NETWORKCUBE_IS_TRACKING_ENABLED");
  return value == "true";
}

export function isTrackingSet(): boolean {
  const value = localStorage.getItem("NETWORKCUBE_IS_TRACKING_ENABLED");
  return value !== null;
}

export function deleteData(dataSetName: string): void {
  // deletes a network
  getDynamicGraph(dataSetName).delete(dataManager);
}
