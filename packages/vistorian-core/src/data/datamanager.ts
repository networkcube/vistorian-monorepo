import { DataSet, isValidIndex } from "./dynamicgraphutils";
import { DynamicGraph } from "./dynamicgraph";
import * as LZString from "lz-string";

/********* MOVED FROM DATAMANAGER TO DYNAMICGRAPH **********/

export interface DataManagerOptions {
  keepOnlyOneSession: boolean;
}

export class DataManager {
  constructor(options?: DataManagerOptions) {
    if (options) {
      // initialize stuff differently here
      if (options.keepOnlyOneSession) this.setOptions(options);
    } else {
      this.keepOnlyOneSession = false;
    }
  }

  setOptions(options: DataManagerOptions): void {
    this.keepOnlyOneSession = options.keepOnlyOneSession;
  }

  // current dynamic graph of the visualization.
  // The first time the getGraph() function is called
  // that graph object is created and populated.
  // The second time, it's just retrieved.
  dynamicGraph?: DynamicGraph;

  keepOnlyOneSession = false;
  session = "";

  sessionDataPrefix = "ncubesession";

  // sessionDataPrefix: string = "";

  clearSessionData(session: string): void {
    const searchPrefix = this.sessionDataPrefix + this.SEP + session;
    // var searchPrefix = session;
    const keysToClear: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.indexOf(searchPrefix) == 0) keysToClear.push(key);
      // these are the old keys that we used to store before we
      // added support for multiple sessions
      else if (key.indexOf("connectoscope1") == 0) keysToClear.push(key);
    }
    for (let i = 0; i < keysToClear.length; i++) {
      const k = keysToClear[i];
      localStorage.removeItem(k);
    }
  }

  clearAllSessionData(): void {
    this.clearSessionData("");
  }

  isSessionCached(session: string, dataSetName: string): boolean {
    const prefix =
      this.sessionDataPrefix + this.SEP + session + this.SEP + dataSetName;
    //var firstSessionKey: string = null;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.indexOf(prefix) == 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Import a data set into networkcube's local storage.
   * @param  {string}  session - current session id
   * @param  {DataSet} data    - a networkcube.DataSet
   */
  importData(session: string, data: DataSet): void {
    this.session = session;

    // check if all data (tables + schemas) are there
    if (!data.nodeTable && !data.linkTable) {
      console.log("Empty tables. No data imported.");
      return;
    }

    if (!data.nodeTable) {
      console.log("[n3] Node table missing!");
    }
    if (!data.linkTable) {
      console.log("[n3] Link table missing!");
    }
    if (!data.nodeSchema) {
      console.log("[n3] Node schema missing!");
    }
    if (!data.linkSchema) {
      console.log("[n3] Link schema missing!");
    }

    // format data
    for (let i = 0; i < data.nodeTable.length; i++) {
      for (let j = 0; j < data.nodeTable[i].length; j++) {
        if (typeof data.nodeTable[i][j] == "string")
          data.nodeTable[i][j] = data.nodeTable[i][j].trim();
      }
    }
    for (let i = 0; i < data.linkTable.length; i++) {
      for (let j = 0; j < data.linkTable[i].length; j++) {
        if (typeof data.linkTable[i][j] == "string")
          data.linkTable[i][j] = data.linkTable[i][j].trim();
      }
    }

    // this.saveToStorage(data.name, this.NODE_TABLE, data.nodeTable);
    // this.saveToStorage(data.name, this.NODE_SCHEMA, data.nodeSchema);
    // this.saveToStorage(data.name, this.LINK_SCHEMA, data.linkSchema);
    // this.saveToStorage(data.name, this.LINK_TABLE, data.linkTable);
    // // if(data.locationTable){
    // this.saveToStorage(data.name, this.LOCATION_TABLE, data.locationTable);
    // this.saveToStorage(data.name, this.LOCATION_SCHEMA, data.locationSchema);
    // }

    // In order to initialize the dynamic graph, our schema must be sufficiently well-defined
    if (this.isSchemaWellDefined(data)) {
      console.log("data is well-schematized, caching dynamicGraph");
      // in order to ensure that we have enough quota, we only keep one session
      // cached at a time.
      if (this.keepOnlyOneSession) this.clearAllSessionData();

      const graphForCaching: DynamicGraph = new DynamicGraph();
      graphForCaching.initDynamicGraph(data);
      // CACHEGRAPH store DynamicGraph in localstorage
      graphForCaching.saveDynamicGraph(this);

      // CACHEGRAPH : this code is strictly for diagnostics;
      const doubleCheckSave = false;
      if (doubleCheckSave) {
        const testGraph: DynamicGraph = new DynamicGraph();
        testGraph.loadDynamicGraph(this, data.name);
        testGraph.debugCompareTo(graphForCaching);
      }
    } else {
      console.log("data is not well-schematized, so not caching dynamicGraph");
    }
  }

  // Strings used to access local storage
  SEP = "_";
  // NODE_TABLE: string = 'networkcube.nodetable';
  // LINK_TABLE: string = 'networkcube.linktable';
  // NODE_SCHEMA: string = 'networkcube.nodeschema';
  // LINK_SCHEMA: string = 'networkcube.linkschema';
  // LOCATION_TABLE: string = 'networkcube.locationtable';
  // LOCATION_SCHEMA: string = 'networkcube.locationschema';
  // GRAPH: string = 'networkcube.graph';

  // storage primitives /////////////////////////////////////
  //
  saveToStorage<T>(
    dataName: string,
    valueName: string,
    value: T,
    replacer?: (key: string, value: any) => any
  ): void {
    if (value == undefined) {
      console.log(
        "attempting to save undefined value. aborting",
        dataName,
        valueName
      );
      return;
    }
    const stringifyResult = JSON.stringify(value, replacer);

    let stringToSave;
    if (stringifyResult.length > 1024 * 1024 * 4)
      stringToSave = LZString.compress(stringifyResult);
    else stringToSave = stringifyResult;

    localStorage[
      this.sessionDataPrefix +
        this.SEP +
        this.session +
        this.SEP +
        dataName +
        this.SEP +
        valueName
    ] = stringToSave;
  }

  // TODO: I think the state argument is unused and can be removed
  getFromStorage<TResult>(
    dataName: string,
    valueName: string,
    reviver?: (key: any, value: any, state: any) => any,
    state?: any
  ): TResult | undefined {
    // : TResult

    console.assert(this.session != "");

    let statefulReviver;
    if (reviver)
      statefulReviver = function (key: any, value: any): any {
        return reviver(key, value, state);
      };
    else statefulReviver = undefined;

    const storedResult =
      localStorage[
        this.sessionDataPrefix +
          this.SEP +
          this.session +
          this.SEP +
          dataName +
          this.SEP +
          valueName
      ];

    if (storedResult && storedResult != "undefined") {
      // we try to detect whether the string was compressed or not. Given that it is
      // JSON, we would expect it to begin with either a quote, a bracket, or a curly-brace
      let parseText;
      if (storedResult == "true") {
        parseText = true;
      } else if (storedResult == "false") {
        parseText = false;
      } else if ("\"'[{0123456789".indexOf(storedResult[0]) >= 0)
        parseText = storedResult;
      else parseText = LZString.decompress(storedResult);

      return <TResult>JSON.parse(parseText, statefulReviver);
    } else {
      return undefined;
    }
  }

  removeFromStorage(dataName: string, valueName: string): void {
    localStorage.removeItem(
      this.sessionDataPrefix +
        this.SEP +
        this.session +
        this.SEP +
        dataName +
        this.SEP +
        valueName
    );
  }

  //
  // end storage primitives //////////////////////////////

  // GRAPH

  getGraph(session: string, dataname: string): DynamicGraph {
    this.session = session;
    if (!this.dynamicGraph || this.dynamicGraph.name != dataname) {
      this.dynamicGraph = new DynamicGraph();
      this.dynamicGraph.loadDynamicGraph(this, dataname);
    }
    return this.dynamicGraph;
  }

  isSchemaWellDefined(data: DataSet): boolean {
    console.log("isSchemaWellDefined");
    if (data.locationTable && !isValidIndex(data.locationSchema.id))
      return false;
    if (data.nodeTable.length > 0 && !isValidIndex(data.nodeSchema.id))
      return false;
    if (
      data.linkTable.length > 0 &&
      !(
        isValidIndex(data.linkSchema.id) &&
        isValidIndex(data.linkSchema.source) &&
        isValidIndex(data.linkSchema.target)
      )
    )
      return false;

    return true;
  }
}
