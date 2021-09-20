import { DataSet, Selection, isValidIndex } from './datamanager'
import * as moment from 'moment'
import * as LZString from "lz-string";

export const GRANULARITY: moment.unitOfTime.Base[] = ['millisecond', 'second', 'minute', 'hour', 'day', 'week', 'month', 'year']; //, 'decade', 'century', 'millenium'];

export const DGRAPH_SUB = "[*dgraph*]";
export const DGRAPH_SER_VERBOSE_LOGGING = false;

export function dgraphReviver(dgraph: DynamicGraph, key: any, value: any): any {
    if (value == DGRAPH_SUB)
        return dgraph;
    else
        return value;
}

export function dgraphReplacer(key: string, value: any): any {
    // don't write out graph, as this would cause cycles
    if (DGRAPH_SER_VERBOSE_LOGGING) {
        console.log("dgraphReplacer", key, value);
    }
    if (value instanceof DynamicGraph) {
        console.log("dgraphReplacer found a DynamicGraph property", key);
        return DGRAPH_SUB;
    }
    return value;
}

export class DynamicGraph {

    private default_colors(i: number): string {
        const colors = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
        return colors[i % colors.length];
    }

    // BOOKMARK_COLORS: string[] = colorSchemes.schema5;
    BOOKMARK_COLORS: (i: number) => string = this.default_colors;
    selectionColor_pointer = 0;

    //data: DataSet;
    name = ''; // INIT??

    // data meta data
    gran_min = 0; // INIT?
    gran_max: number = Number.MAX_VALUE; // INIT?

    minWeight = 10000000;
    maxWeight = -10000000;

    _nodes: Node[] = [];
    _links: Link[] = [];
    directed = false;
    _nodePairs: NodePair[] = [];
    _locations: Location[] = [];
    // Contains all time objects for this dynamic graph
    _times: Time[] = [];
    // linkTypes: LinkType[] = [];
    timeObjects: any[] = []

    nodeOrders: Ordering[] = []; // INIT?

    // Matrix for fast access to node pairs (link)
    matrix: number[][] = []; // fast access to node pairs.

    selections: Selection[] = [];

    // node attributes
    nodeArrays: NodeArray = new NodeArray();

    // link attributes
    linkArrays: LinkArray = new LinkArray();

    // node pair attributes
    nodePairArrays: NodePairArray = new NodePairArray();

    // time attributes
    timeArrays: TimeArray = new TimeArray();

    // array for relation types
    linkTypeArrays: LinkTypeArray = new LinkTypeArray();

    // array for node types
    nodeTypeArrays: NodeTypeArray = new NodeTypeArray();

    // array for locations
    locationArrays: LocationArray = new LocationArray();

    // points to all object arrays. For convenience
    attributeArrays: Record<string, any> = {
        node: this.nodeArrays,
        link: this.linkArrays,
        time: this.timeArrays,
        nodePair: this.nodePairArrays,
        linkType: this.linkTypeArrays,
        nodeType: this.nodeTypeArrays,
        location: this.locationArrays
    }

    // highlighted objects
    highlightArrays: IDCompound = new IDCompound();

    currentSelection_id = 0;

    /* INIT OK?? */
    defaultLinkSelection: Selection = this.createSelection('link');
    defaultNodeSelection: Selection = this.createSelection('node');


    // ACCESSOR FUNCTIONS
    // universal accesor
    attr(field: string, id: number, type: string): any {
        let r: any;
        try {
            r = (this.attributeArrays as any)[type][field][id]
        } catch (e) {
            r = undefined;
        }
        return r;
    }

    // storage keys /////////////////////////////////
    //
    gran_min_NAME = "gran_min";
    gran_max_NAME = "gran_max_NAME";

    directed_NAME = "directed_NAME";

    minWeight_NAME = "minWeight_NAME";
    maxWeight_NAME = "maxWeight_NAME";

    matrix_NAME = "matrix_NAME";

    nodeArrays_NAME = "nodeArrays_NAME";
    linkArrays_NAME = "linkArrays_NAME";
    nodePairArrays_NAME = "nodePairArrays_NAME";
    timeArrays_NAME = "timeArrays_NAME";
    linkTypeArrays_NAME = "linkTypeArrays_NAME";
    nodeTypeArrays_NAME = "nodeTypeArrays_NAME";
    locationArrays_NAME = "locationArrays_NAME";
    //
    // end storage keys //////////////////////////////



    // FUNCTIONS

    standardArrayReplacer(key: string, value: any): any {
        // don't write out graph, as this would cause cycles
        if (value instanceof DynamicGraph) {
            console.log("standardReplacer found a DynamicGraph property", key);
            return DGRAPH_SUB;
        }
        // don't write out selection, because we must preserve it independently
        // from the graph
        else if (key == 'selections')
            return undefined;

        return value;
    }
    static timeReviver(k: string, v: any, s: DynamicGraph): any {
        if (k == '') {
            return copyPropsShallow(v, new Time(v.id, s));
        } else {
            return dgraphReviver(s, k, v);
        }
    }

    static nodeArrayReviver(k: string, v: any, s: DynamicGraph): any {
        switch (k) {
            case '':
                return copyPropsShallow(v, new NodeArray());
            // case 'nodeType':
            // return copyTimeSeries(v, function() { return new ScalarTimeSeries<string>(); });
            case 'outLinks':
            case 'inLinks':
            case 'links':
                return copyTimeSeries(v, function () { return new ArrayTimeSeries<number>(); });
            case 'outNeighbors':
            case 'inNeighbors':
            case 'neighbors':
                return copyTimeSeries(v, function () { return new ArrayTimeSeries<number>(); });
            case 'locations':
                return copyTimeSeries(v, function () { return new ScalarTimeSeries<number>(); });
            default:
                return v;
        }
    }

    static linkArrayReviver(k: string, v: any, s: DynamicGraph): any {
        switch (k) {
            case '':
                return copyPropsShallow(v, new LinkArray());
            case 'weights':
                return copyTimeSeries(v, function () { return new ScalarTimeSeries<any>(); });
            default:
                return v;
        }
    }

    static nodePairArrayReviver(k: string, v: any, s: DynamicGraph): any {
        switch (k) {
            case '':
                return copyPropsShallow(v, new NodePairArray());
            default:
                return v;
        }
    }

    static timeArrayReviver(k: string, v: any, s: DynamicGraph): any {
        switch (k) {
            case '':
                return copyPropsShallow(v, new TimeArray());
            case 'time':
                return (v as string[]).map(function (s, i) { return moment.utc(s); });
            default:
                return v;
        }
    }

    static linkTypeArrayReviver(k: string, v: any, s: DynamicGraph): any {
        switch (k) {
            case '':
                return copyPropsShallow(v, new LinkTypeArray());
            default:
                return v;
        }
    }
    static nodeTypeArrayReviver(k: string, v: any, s: DynamicGraph): any {
        switch (k) {
            case '':
                return copyPropsShallow(v, new NodeTypeArray());
            default:
                return v;
        }
    }

    static locationArrayReviver(k: string, v: any, s: DynamicGraph): any {
        switch (k) {
            case '':
                return copyPropsShallow(v, new LocationArray());
            default:
                return v;
        }
    }

    loadDynamicGraph(dataMgr: DataManager, dataSetName: string): void {
        this.clearSelections();
        this.name = dataSetName;

        // CACHEGRAPH : load from storage the entire state of the graph

        const gran_min_storage = dataMgr.getFromStorage<number>(this.name, this.gran_min_NAME);
        if (gran_min_storage != undefined)
            this.gran_min = gran_min_storage;

        const gran_max_storage = dataMgr.getFromStorage<number>(this.name, this.gran_max_NAME);
        if (gran_max_storage != undefined)
            this.gran_max = gran_max_storage;

        const directed_storage = dataMgr.getFromStorage<boolean>(this.name, this.directed_NAME);
        if (directed_storage != undefined)
            this.directed = directed_storage;

        const minWeight_storage = dataMgr.getFromStorage<number>(this.name, this.minWeight_NAME);
        if (minWeight_storage != undefined)
            this.minWeight = minWeight_storage;

        const maxWeight_storage = dataMgr.getFromStorage<number>(this.name, this.maxWeight_NAME);
        if (maxWeight_storage != undefined)
            this.maxWeight = maxWeight_storage;

        const matrix_storage = dataMgr.getFromStorage<number[][]>(this.name, this.matrix_NAME);
        if (matrix_storage != undefined)
            this.matrix = matrix_storage;

        const nodeArrays_storage = dataMgr.getFromStorage<NodeArray>(this.name, this.nodeArrays_NAME, DynamicGraph.nodeArrayReviver);
        if (nodeArrays_storage != undefined)
            this.nodeArrays = nodeArrays_storage;

        const linkArrays_storage = dataMgr.getFromStorage<LinkArray>(this.name, this.linkArrays_NAME, DynamicGraph.linkArrayReviver);
        if (linkArrays_storage != undefined)
            this.linkArrays = linkArrays_storage;

        const nodePairArrays_storage = dataMgr.getFromStorage<NodePairArray>(this.name, this.nodePairArrays_NAME, DynamicGraph.nodePairArrayReviver);
        if (nodePairArrays_storage != undefined)
            this.nodePairArrays = nodePairArrays_storage;

        const timeArrays_storage = dataMgr.getFromStorage<TimeArray>(this.name, this.timeArrays_NAME, DynamicGraph.timeArrayReviver);
        if (timeArrays_storage != undefined)
            this.timeArrays = timeArrays_storage;

        if (!('timeArrays' in this) || !this.timeArrays) {
            console.log('No timeArrays');
            this.timeArrays = new TimeArray();
        }
        else if ('momentTime' in this.timeArrays && 'unixTime' in this.timeArrays) {
            const ta = this.timeArrays['momentTime'];
            for (let i = 0; i < ta.length; i++) {
                ta[i] = moment.utc(this.timeArrays['unixTime'][i]);
            }
        }

        /* I DON'T KNOW WHY timeArrays IS never */

        else if ('unixTime' in this.timeArrays) {
            console.log('No time in timeArrays');
            (this.timeArrays as any)['momentTime'] = (this.timeArrays as any)['unixTime'].map(moment.utc());
        }
        else {
            console.log('No time or unixTime in timeArrays');
            (this.timeArrays as any)['momentTime'] = []
        }

        const linkTypeArrays_storage = dataMgr.getFromStorage<LinkTypeArray>(this.name, this.linkTypeArrays_NAME, DynamicGraph.linkTypeArrayReviver);
        if (linkTypeArrays_storage != undefined)
            this.linkTypeArrays = linkTypeArrays_storage;

        const nodeTypeArrays_storage = dataMgr.getFromStorage<NodeTypeArray>(this.name, this.nodeTypeArrays_NAME, DynamicGraph.nodeTypeArrayReviver);
        if (nodeTypeArrays_storage != undefined)
            this.nodeTypeArrays = nodeTypeArrays_storage;

        const locationArrays_storage = dataMgr.getFromStorage<LocationArray>(this.name, this.locationArrays_NAME, DynamicGraph.locationArrayReviver);
        if (locationArrays_storage != undefined)
            this.locationArrays = locationArrays_storage;

        // points to all object arrays. For convenience
        this.attributeArrays = {
            node: this.nodeArrays,
            link: this.linkArrays,
            time: this.timeArrays,
            nodePair: this.nodePairArrays,
            linkType: this.linkTypeArrays,
            nodeType: this.nodeTypeArrays,
            location: this.locationArrays
        };

        // rather than persist all of the state of windowGraph
        // as well, we simply reinitialize from our persisted state.
        // perhaps we need to serialize this as well.
        // inits the WindowGraph for this dynamic graph, i.e.
        // the all-aggregated graph.
        this.createGraphObjects(true, true);


        // init the selections which are currently null
        // this.nodeArrays.selections=[];
        // this.nodeArrays.selections.push([]);
        // this.timeArrays.selections=[];
        // this.timeArrays.selections.push([]);
        // this.linkArrays.selections=[];
        // this.linkArrays.selections.push([]);
        // this.nodePairArrays.selections=[];
        // this.nodePairArrays.selections.push([]);
        this.createSelections(true);

    }

    saveDynamicGraph(dataMgr: DataManager): void {
        // CACHEGRAPH : persist the entire state of the dynamic graph
        dataMgr.saveToStorage(this.name, this.gran_min_NAME, this.gran_min);
        dataMgr.saveToStorage(this.name, this.gran_max_NAME, this.gran_max);
        dataMgr.saveToStorage(this.name, this.directed_NAME, this.directed);
        dataMgr.saveToStorage(this.name, this.minWeight_NAME, this.minWeight);
        dataMgr.saveToStorage(this.name, this.maxWeight_NAME, this.maxWeight);

        dataMgr.saveToStorage(this.name, this.matrix_NAME, this.matrix);
        dataMgr.saveToStorage(this.name, this.nodeArrays_NAME, this.nodeArrays, this.standardArrayReplacer);
        // when we tried to persist the entire linkArrays, javascript threw an
        // exception, so for now we will simply try to save out the parts.
        dataMgr.saveToStorage(this.name, this.linkArrays_NAME, this.linkArrays, this.standardArrayReplacer);
        // dataMgr.saveToStorage(this.name, this.linkArrays_NAME+"source", this.linkArrays.source, this.standardReplacer);
        // dataMgr.saveToStorage(this.name, this.linkArrays_NAME+"target", this.linkArrays.target, this.standardReplacer);
        // dataMgr.saveToStorage(this.name, this.linkArrays_NAME+"linkType", this.linkArrays.linkType, this.standardReplacer);
        // dataMgr.saveToStorage(this.name, this.linkArrays_NAME+"directed", this.linkArrays.directed, this.standardReplacer);
        // dataMgr.saveToStorage(this.name, this.linkArrays_NAME+"nodePair", this.linkArrays.nodePair, this.standardReplacer);
        // dataMgr.saveToStorage(this.name, this.linkArrays_NAME+"presence", this.linkArrays.presence, this.standardReplacer);
        // dataMgr.saveToStorage(this.name, this.linkArrays_NAME+"weights", this.linkArrays.weights, this.standardReplacer);
        // dataMgr.saveToStorage(this.name, this.linkArrays_NAME+"filter", this.linkArrays.filter, this.standardReplacer);
        // dataMgr.saveToStorage(this.name, this.linkArrays_NAME+"attributes", this.linkArrays.attributes, this.standardReplacer);

        dataMgr.saveToStorage(this.name, this.nodePairArrays_NAME, this.nodePairArrays, this.standardArrayReplacer);
        dataMgr.saveToStorage(this.name, this.timeArrays_NAME, this.timeArrays, this.standardArrayReplacer);
        dataMgr.saveToStorage(this.name, this.linkTypeArrays_NAME, this.linkTypeArrays, this.standardArrayReplacer);
        dataMgr.saveToStorage(this.name, this.nodeTypeArrays_NAME, this.nodeTypeArrays, this.standardArrayReplacer);
        dataMgr.saveToStorage(this.name, this.locationArrays_NAME, this.locationArrays, this.standardArrayReplacer);
    }

    // Removes this graph from the cache.
    delete(dataMgr: DataManager): void {
        dataMgr.removeFromStorage(this.name, this.gran_min_NAME);
        dataMgr.removeFromStorage(this.name, this.gran_max_NAME);
        dataMgr.removeFromStorage(this.name, this.directed_NAME);
        dataMgr.removeFromStorage(this.name, this.minWeight_NAME);
        dataMgr.removeFromStorage(this.name, this.maxWeight_NAME);

        dataMgr.removeFromStorage(this.name, this.matrix_NAME);
        dataMgr.removeFromStorage(this.name, this.nodeArrays_NAME);
        // when we tried to persist the entire linkArrays, javascript threw an
        // exception, so for now we will simply try to save out the parts.
        dataMgr.removeFromStorage(this.name, this.linkArrays_NAME);
        // dataMgr.saveToStorage(this.name, this.linkArrays_NAME+"source", this.linkArrays.source, this.standardReplacer);
        // dataMgr.saveToStorage(this.name, this.linkArrays_NAME+"target", this.linkArrays.target, this.standardReplacer);
        // dataMgr.saveToStorage(this.name, this.linkArrays_NAME+"linkType", this.linkArrays.linkType, this.standardReplacer);
        // dataMgr.saveToStorage(this.name, this.linkArrays_NAME+"directed", this.linkArrays.directed, this.standardReplacer);
        // dataMgr.saveToStorage(this.name, this.linkArrays_NAME+"nodePair", this.linkArrays.nodePair, this.standardReplacer);
        // dataMgr.saveToStorage(this.name, this.linkArrays_NAME+"presence", this.linkArrays.presence, this.standardReplacer);
        // dataMgr.saveToStorage(this.name, this.linkArrays_NAME+"weights", this.linkArrays.weights, this.standardReplacer);
        // dataMgr.saveToStorage(this.name, this.linkArrays_NAME+"filter", this.linkArrays.filter, this.standardReplacer);
        // dataMgr.saveToStorage(this.name, this.linkArrays_NAME+"attributes", this.linkArrays.attributes, this.standardReplacer);

        dataMgr.removeFromStorage(this.name, this.nodePairArrays_NAME);
        dataMgr.removeFromStorage(this.name, this.timeArrays_NAME);
        dataMgr.removeFromStorage(this.name, this.linkTypeArrays_NAME);
        dataMgr.removeFromStorage(this.name, this.nodeTypeArrays_NAME);
        dataMgr.removeFromStorage(this.name, this.locationArrays_NAME);

    }

    debugCompareTo(other: DynamicGraph): boolean {
        let result = true;

        if (this.name != other.name) {
            console.log("name different");
            result = false;
        }
        // CACHEGRAPH compare every aspect of this one to the other one
        if (this.gran_min != other.gran_min) {
            console.log("gran_min different", this.gran_min, other.gran_min);
            result = false;
        }
        if (this.gran_max != other.gran_max) {
            console.log("gran_max different", this.gran_max, other.gran_max);
            result = false;
        }

        if (this.directed != other.directed) {
            console.log("directed different", this.directed, other.directed);
            result = false;
        }

        if (this._nodes.length != other._nodes.length
            || !compareTypesDeep(this._nodes, other._nodes, 2)) {
            console.log("nodes different");
            result = false;
        }
        if (this._links.length != other._links.length
            || !compareTypesDeep(this._links, other._links, 2)) {
            console.log("links different");
            result = false;
        }
        if (this._nodePairs.length != other._nodePairs.length
            || !compareTypesDeep(this._nodePairs, other._nodePairs, 2)) {
            console.log("nodePairs different");
            result = false;
        }
        if (this._locations.length != other._locations.length
            || !compareTypesDeep(this._locations, other._locations, 2)) {
            console.log("locations different");
            result = false;
        }
        if (this._times.length != other._times.length
            || !compareTypesDeep(this._times, other._times, 2)) {
            console.log("times different");
            result = false;
        }

        if ((this.nodeOrders && this.nodeOrders.length != other.nodeOrders.length)
            || !compareTypesDeep(this.nodeOrders, other.nodeOrders, 2)) {
            console.log("nodeOrders different", this.nodeOrders, other.nodeOrders);
            result = false;
        }

        if (this.matrix.length != other.matrix.length
            || !compareTypesDeep(this.matrix, other.matrix, 2)) {
            console.log("matrix different", this.matrix, other.matrix);
            result = false;
        }

        if (this.nodeArrays.length != other.nodeArrays.length
            || !compareTypesDeep(this.nodeArrays, other.nodeArrays, 2)) {
            console.log("nodeArrays different", this.nodeArrays, other.nodeArrays);
            result = false;
        }

        if (this.linkArrays.length != other.linkArrays.length
            || !compareTypesDeep(this.linkArrays, other.linkArrays, 2)) {
            console.log("linkArrays different", this.linkArrays, other.linkArrays);
            result = false;
        }

        if (this.nodePairArrays.length != other.nodePairArrays.length
            || !compareTypesDeep(this.nodePairArrays, other.nodePairArrays, 2)) {
            console.log("nodePairArrays different", this.nodePairArrays, other.nodePairArrays);
            result = false;
        }

        if (this.timeArrays.length != other.timeArrays.length
            || !compareTypesDeep(this.timeArrays, other.timeArrays, 2)) {
            console.log("timeArrays different", this.timeArrays, other.timeArrays);
            result = false;
        }

        if (this.linkTypeArrays.length != other.linkTypeArrays.length
            || !compareTypesDeep(this.linkTypeArrays, other.linkTypeArrays, 2)) {
            console.log("linkTypeArrays different", this.linkTypeArrays, other.linkTypeArrays);
            result = false;
        }

        if (this.nodeTypeArrays.length != other.nodeTypeArrays.length
            || !compareTypesDeep(this.nodeTypeArrays, other.nodeTypeArrays, 2)) {
            console.log("nodeTypeArrays different", this.nodeTypeArrays, other.nodeTypeArrays);
            result = false;
        }

        if (this.locationArrays.length != other.locationArrays.length
            || !compareTypesDeep(this.locationArrays, other.locationArrays, 2)) {
            console.log("locationArrays different", this.locationArrays, other.locationArrays);
            result = false;
        }

        if (this.defaultLinkSelection.elementIds.length != other.defaultLinkSelection.elementIds.length
            || !compareTypesDeep(this.defaultLinkSelection, other.defaultLinkSelection, 2)) {
            console.log("defaultLinkSelection different", this.defaultLinkSelection, other.defaultLinkSelection);
            result = false;
        }

        if (this.defaultNodeSelection.elementIds.length != other.defaultNodeSelection.elementIds.length
            || !compareTypesDeep(this.defaultNodeSelection, other.defaultNodeSelection, 2)) {
            console.log("defaultNodeSelection different", this.defaultNodeSelection, other.defaultNodeSelection);
            result = false;
        }

        if (this.selections.length != other.selections.length
            || !compareTypesDeep(this.selections, other.selections, 2)) {
            console.log("selections different", this.selections, other.selections);
            result = false;
        }

        return result;
    }

    // creates this graph and fills node, link and time arrays from
    // data tables.
    initDynamicGraph(data: DataSet): void {


        // must agree with version in main.ts
        const TIME_FORMAT = 'YYYY-MM-DD hh:mm:ss';

        this.clearSelections();
        console.log('[dynamicgraph.ts] Create dynamic graph for ', data.name, data)

        //this.data = data;s
        this.name = data.name;
        this.directed = data.directed;

        // fill node, link arrays and time

        // CREATE TIME OBJECT for all events
        this.gran_min = 0;
        this.gran_max = 0;

        let timeLabel: string;
        const unixTimes: number[] = [];
        let unixTime: number;

        if (isValidIndex(data.linkSchema.time)) {

            // get unix times for all times
            console.log("GEtting unix times for all times - linktable")
            console.log(data.linkTable)
            for (let i = 0; i < data.linkTable.length; i++) {
                timeLabel = data.linkTable[i][data.linkSchema.time];
                console.log(data.linkTable[i])
                unixTime = parseInt(moment.utc(timeLabel, TIME_FORMAT).format('x'));
                if (unixTime == undefined)
                    continue;

                if (unixTimes.indexOf(unixTime) == -1) {
                    unixTimes.push(unixTime);
                }
            }
            // obtain granularity
            unixTimes.sort(sortNumber)

            let diff = 99999999999999;
            for (let i = 0; i < unixTimes.length - 2; i++) {
                diff = Math.min(diff, unixTimes[i + 1] - unixTimes[i]);
            }

            const diff_min = diff;
            if (diff >= 1000) this.gran_min = 1;
            if (diff >= 1000 * 60) this.gran_min = 2;
            if (diff >= 1000 * 60 * 60) this.gran_min = 3;
            if (diff >= 1000 * 60 * 60 * 24) this.gran_min = 4;
            if (diff >= 1000 * 60 * 60 * 24 * 7) this.gran_min = 5;
            if (diff >= 1000 * 60 * 60 * 24 * 30) this.gran_min = 6;
            if (diff >= 1000 * 60 * 60 * 24 * 30 * 12) this.gran_min = 7;
            if (diff >= 1000 * 60 * 60 * 24 * 30 * 12 * 10) this.gran_min = 8;
            if (diff >= 1000 * 60 * 60 * 24 * 30 * 12 * 100) this.gran_min = 9;
            if (diff >= 1000 * 60 * 60 * 24 * 30 * 12 * 1000) this.gran_min = 10;

            diff = unixTimes[unixTimes.length - 1] - unixTimes[0];
            this.gran_max = 0;
            if (diff >= 1000) this.gran_max = 1;
            if (diff >= 1000 * 60) this.gran_max = 2;
            if (diff >= 1000 * 60 * 60) this.gran_max = 3;
            if (diff >= 1000 * 60 * 60 * 24) this.gran_max = 4;
            if (diff >= 1000 * 60 * 60 * 24 * 7) this.gran_max = 5;
            if (diff >= 1000 * 60 * 60 * 24 * 30) this.gran_max = 6;
            if (diff >= 1000 * 60 * 60 * 24 * 30 * 12) this.gran_max = 7;
            if (diff >= 1000 * 60 * 60 * 24 * 30 * 12 * 10) this.gran_max = 8;
            if (diff >= 1000 * 60 * 60 * 24 * 30 * 12 * 100) this.gran_max = 9;
            if (diff >= 1000 * 60 * 60 * 24 * 30 * 12 * 1000) this.gran_max = 10;

            console.log('[Dynamic Graph] Minimal granularity', GRANULARITY[this.gran_min]);
            console.log('[Dynamic Graph] Maximal granularity', GRANULARITY[this.gran_max]);

            // create one time object for every time point of gran_min, between start and end time.
            // [bb] deprecated
            // var start = moment(unixTimes[0] + '', 'x').startOf(GRANULARITY[this.gran_min]);
            // var end = moment(unixTimes[unixTimes.length - 1] + '', 'x').startOf(GRANULARITY[this.gran_min]);
            // var numTimes = Math.ceil(Math.abs(start.diff(end, GRANULARITY[this.gran_min] + 's')));

            // var curr_t = start;
            // this._times = [];
            for (let i = 0; i < unixTimes.length; i++) {
                this.timeArrays.id.push(i);
                this.timeArrays.momentTime.push(moment.utc(unixTimes[i]));
                this.timeArrays.label.push(this.timeArrays.momentTime[i].format(TIME_FORMAT));
                this.timeArrays.unixTime.push(unixTimes[i]);
                this.timeArrays.selections.push([]);
                this.timeArrays.filter.push(false)
                this.timeArrays.links.push([]);

                // create time objects
                this._times.push(new Time(i, this));
                // curr_t = start.add(1, GRANULARITY[this.gran_min] + 's');
            }

            // Now, all existing times with events and potentially
            // attributes associated, have been created.
            // Below, we create a simple array of moment.moments
            // for any possible time unit for every aggregation level.
            // In fact, those structures are created on-demand, i.e.
            // the first time they are needed.
            // Here, we only create the meta-structure
            for (let g = 0; g <= GRANULARITY.length; g++) {
                this.timeObjects.push([]) // AQUIIIII
            }
        }

        // if no valid have been found:
        if (this.timeArrays.length == 0) {
            // null time object that represents one time step for the entire graph, i.e. a static graph
            this.timeArrays.id.push(0);
            this.timeArrays.momentTime.push(moment.utc(0));
            this.timeArrays.unixTime.push(0);
            this.timeArrays.selections.push([]);
            this.timeArrays.filter.push(false)
            this.timeArrays.links.push([])
            this._times.push(new Time(0, this));
        }

        // from here on, there is at least one time object present.


        // CREATE LOCATIONS
        let id_loc;
        let location: Location;

        // if there is a location table, then there needs to be locationSchema
        console.assert(!data.locationTable || isValidIndex(data.locationSchema.id));

        if (data.locationTable) {
            for (let i = 0; i < data.locationTable.length; i++) {
                this.locationArrays.id.push(data.locationTable[i][data.locationSchema.id]);
                this.locationArrays.label.push(data.locationTable[i][data.locationSchema.label]);
                this.locationArrays.longitude.push(data.locationTable[i][data.locationSchema.longitude]);
                this.locationArrays.latitude.push(data.locationTable[i][data.locationSchema.latitude]);
                this.locationArrays.x.push(data.locationTable[i][data.locationSchema.x]);
                this.locationArrays.y.push(data.locationTable[i][data.locationSchema.y]);
                this.locationArrays.z.push(data.locationTable[i][data.locationSchema.z]);
                this.locationArrays.radius.push(data.locationTable[i][data.locationSchema.radius]);
            }
        }
        if ('id' in this.locationArrays)
            console.log('locations', this.locationArrays.id.length);


        // CREATE NODES
        let row: any[];
        let nodeId_data; // node id in data set
        let nodeId_table; // node id in table
        let attribute: any;
        let time: Time;
        console.assert(data.nodeTable.length == 0 || isValidIndex(data.nodeSchema.id),
            'either there is no nodeTable data, or we have a schema for the nodetable');

        let typeName: string;
        let typeId: number;

        const nodeUserProperties = []
        // Get user-properties on links, if exist
        for (const prop in data.nodeSchema) {
            if (Object.prototype.hasOwnProperty.call(data.nodeSchema, prop)
                && prop != 'id'
                && prop != 'label'
                && prop != 'time'
                && prop != 'name'
                && prop != 'nodeType'
                && prop != 'location'
                && prop != 'constructor') {
                nodeUserProperties.push(prop);
                // create property
                (this.nodeArrays as any)[prop] = []
            }
        }

        for (let i = 0; i < data.nodeTable.length; i++) {
            row = data.nodeTable[i];

            // check if id already exists
            nodeId_data = row[data.nodeSchema.id];
            nodeId_table = this.nodeArrays.id.indexOf(nodeId_data);
            if (nodeId_table == -1) {
                nodeId_table = this.nodeArrays.id.length;
                this.nodeArrays.id.push(nodeId_data);
                this.nodeArrays.nodeType.push('');
                this.nodeArrays.outLinks.push(new ArrayTimeSeries<number>());
                this.nodeArrays.inLinks.push(new ArrayTimeSeries<number>());
                this.nodeArrays.links.push(new ArrayTimeSeries<number>());      // both, in and out
                this.nodeArrays.outNeighbors.push(new ArrayTimeSeries<number>());
                this.nodeArrays.inNeighbors.push(new ArrayTimeSeries<number>());
                this.nodeArrays.neighbors.push(new ArrayTimeSeries<number>());
                this.nodeArrays.selections.push([]);
                this.nodeArrays.filter.push(false);
                this.nodeArrays.locations.push(new ScalarTimeSeries<number>());
                this.nodeArrays.attributes.push(new Object());
                this.nodeArrays.color.push('')
                this.nodeArrays.shape.push('')
                if (isValidIndex(data.nodeSchema.label)) {
                    this.nodeArrays.label.push(row[data.nodeSchema.label]);
                } else {
                    this.nodeArrays.label.push(row[data.nodeSchema.id]);
                }
            }

            // get time
            // if (isValidIndex(data.nodeSchema.time)) {

            if (isValidIndex(data.nodeSchema.time)) {
                timeLabel = row[data.nodeSchema.time];
                console.log("params")
                console.log(timeLabel)
                console.log(TIME_FORMAT)
                console.log(moment.utc(timeLabel, TIME_FORMAT))
                console.log(moment.utc(timeLabel, TIME_FORMAT).format('x'))
                const timeIdForUnixTime = this.getTimeIdForUnixTime(parseInt(moment.utc(timeLabel, TIME_FORMAT).format('x')))
                if (timeLabel == undefined || timeIdForUnixTime == undefined) {//} || timeStamp.indexOf('null')) {
                    time = this._times[0];
                } else {
                    time = this._times[timeIdForUnixTime];
                }
            } else {
                time = this._times[0];
            }
            if (time == undefined)
                time = this._times[0];

            // check locations
            if (isValidIndex(data.nodeSchema.location)) {
                const locId = row[data.nodeSchema.location];
                if (locId == null || locId == undefined)
                    continue;
                this.nodeArrays.locations[nodeId_data].set(time, locId);
            }

            // check shapes
            if (isValidIndex(data.nodeSchema.shape)) {
                const shape = row[data.nodeSchema.shape];
                this.nodeArrays.shape.push(shape);
            }

            // gather node type
            if (isValidIndex(data.nodeSchema.nodeType)) {
                typeName = data.nodeTable[i][data.nodeSchema.nodeType]
                typeId = this.nodeTypeArrays.name.indexOf(typeName)
                if (typeId < 0) {
                    typeId = this.nodeTypeArrays.length;
                    this.nodeTypeArrays.id.push(typeId)
                    this.nodeTypeArrays.name.push(typeName)
                }
                this.nodeArrays.nodeType[nodeId_table] = typeName;
                data.nodeTable[i][data.nodeSchema.nodeType] = typeId;
            }

            // gather user-properties:
            for (let p = 0; p < nodeUserProperties.length; p++) {
                const prop = nodeUserProperties[p];
                (this.nodeArrays as any)[prop].push(row[(data.nodeSchema as any)[prop]]);
            }


            // see if temporal information is available
            // if(data.nodeSchema.time && data.nodeSchema.time > -1){
            //     for(var field in data.nodeSchema){
            //         if (field != undefined
            //             && data.nodeSchema.hasOwnProperty(field)
            //             && data.©nodeSchema[field] > -1
            //             && field != 'label'
            //             && field != 'time'
            //             && field != 'locations'
            //             && field != 'id'
            //             ){
            //                 if(this.nodeArrays.attributes[nodeId_table][field] == undefined){
            //                     this.nodeArrays.attributes[nodeId_table][field] = new ScalarTimeSeries();
            //                 }
            //                 timeLabel = data.nodeTable[i][data.nodeSchema.time];
            //                 if(timeLabel == undefined)
            //                     continue;
            //                 timeStamp = parseInt(moment(timeLabel, networkcube.TIME_FORMAT).format('x'));
            //                 time = this.times[this.getTimeIdForTimeStamp(timeStamp)];
            //                 this.nodeArrays[field][nodeId_table].set(time, row[data.nodeSchema[field]]);

            //             // //in case of locations:
            //             // if(field == 'location'){
            //             //     if(typeof row[data.nodeSchema[field]] == 'number'){
            //             //         id_loc = row[data.nodeSchema[field]];
            //             //     }
            //             // }
            //          }
            //     }
            // }else{
            //     // no time information available on nodes
            //     for(var field in data.nodeSchema){
            //         if (field != undefined
            //             && data.nodeSchema.hasOwnProperty(field)
            //             && data.nodeSchema[field] > -1
            //             && field != 'label'
            //             && field != 'time'
            //             && field != 'id'
            //             && field != 'locations'
            //             )
            //         {
            //             // check for non temporal information
            //             if(this.nodeArrays.attributes[nodeId_table][field] == undefined){
            //                 this.nodeArrays.attributes[nodeId_table][field] = new ScalarTimeSeries();
            //             }
            //             // eternal attributes are assigned no time.
            //             this.nodeArrays[field][nodeId_table].set(undefined, row[data.nodeSchema[field]]);
            //         }
            //     }
            // }
        }

        // create matrix and initialize with -1, i.e. nodes are not connected.
        if ('id' in this.nodeArrays) {
            for (let i = 0; i < this.nodeArrays.id.length; i++) {
                this.matrix.push(array(undefined, this.nodeArrays.id.length));
            }
        }


        // CREATE LINKS

        let s: number, t: number;
        let id: number;
        let timeId: number;
        let nodePairId: number;
        let linkId: number;

        const linkUserProperties = []
        // Get user-properties on links, if exist
        for (const prop in data.linkSchema) {
            if (Object.prototype.hasOwnProperty.call(data.linkSchema, prop)
                && prop != 'id'
                && prop != 'linkType'
                && prop != 'time'
                && prop != 'name'
                && prop != 'source'
                && prop != 'target'
                && prop != 'weight'
                && prop != 'directed') {
                linkUserProperties.push(prop);
                // create property
                (this.linkArrays as any)[prop] = []
            }
        }
        console.log('linkUserProperties', linkUserProperties)


        console.assert(data.linkTable.length == 0 || (
            isValidIndex(data.linkSchema.id)
            && isValidIndex(data.linkSchema.source)
            && isValidIndex(data.linkSchema.target)),
            'either there are no links, or the linkschema is defined');

        for (let i = 0; i < data.linkTable.length; i++) {
            row = data.linkTable[i];
            linkId = row[data.linkSchema.id];
            this.linkArrays.directed.push(false); // this is default and can be overwritten in the following.

            // check if linkId, i.e. link exists
            if (this.linkArrays.id.indexOf(linkId) == -1) {
                // init new link
                this.linkArrays.id[linkId] = linkId;
                this.linkArrays.source[linkId] = row[data.linkSchema.source];
                this.linkArrays.target[linkId] = row[data.linkSchema.target];
                this.linkArrays.linkType[linkId] = row[data.linkSchema.linkType];
                this.linkArrays.directed[linkId] = row[data.linkSchema.directed];
                this.linkArrays.weights[linkId] = new ScalarTimeSeries<any>();
                this.linkArrays.presence[linkId] = [];
                this.linkArrays.selections.push([]);
                this.linkArrays.nodePair.push(undefined);
                this.linkArrays.filter.push(false);
            }

            // set time information
            if (isValidIndex(data.linkSchema.time)) {
                timeLabel = data.linkTable[i][data.linkSchema.time];
                unixTime = parseInt(moment.utc(timeLabel, TIME_FORMAT).format('x'));
                const timeIdForUnixTime = this.getTimeIdForUnixTime(unixTime);
                if (timeIdForUnixTime != undefined) {
                    timeId = timeIdForUnixTime;
                }
                else {
                    timeId = 0;
                }
            } else {
                timeId = 0;
            }

            time = this._times[timeId];
            this.linkArrays.presence[linkId].push(timeId);

            // set weight if applies
            if (isValidIndex(data.linkSchema.weight) && data.linkTable[i][data.linkSchema.weight] != undefined) {
                this.linkArrays.weights[linkId].set(time, data.linkTable[i][data.linkSchema.weight])
                this.minWeight = Math.min(this.minWeight, data.linkTable[i][data.linkSchema.weight])
                this.maxWeight = Math.max(this.maxWeight, data.linkTable[i][data.linkSchema.weight])
            } else {
                // set one = presence
                this.minWeight = 0
                this.maxWeight = 1
                this.linkArrays.weights[linkId].set(time, 1)
            }

            // add graph specific information
            s = this.nodeArrays.id.indexOf(row[data.linkSchema.source]);
            t = this.nodeArrays.id.indexOf(row[data.linkSchema.target]);
            this.nodeArrays.neighbors[s].add(time, t);
            this.nodeArrays.neighbors[t].add(time, s);

            this.nodeArrays.links[s].add(time, linkId);
            this.nodeArrays.links[t].add(time, linkId);

            // for directed links, fill the in/out arrays
            if (this.linkArrays.directed[i]) {
                this.nodeArrays.outNeighbors[s].add(time, t);
                this.nodeArrays.inNeighbors[t].add(time, s);

                this.nodeArrays.outLinks[s].add(time, linkId);
                this.nodeArrays.inLinks[t].add(time, linkId);
            }

            //link pairs
            // a node pair is stored in a matrix structure for easy access.
            // For every direction (s,t) and (t,s), an individual link pair
            // exists. If an underlying link is undirected, it is referenced
            // in both node pairs.
            nodePairId = this.matrix[s][t];
            if (!isValidIndex(nodePairId)) {
                nodePairId = this.nodePairArrays.length;
                this.matrix[s][t] = nodePairId;
                this.nodePairArrays.id.push(nodePairId);
                this.nodePairArrays.source.push(s);
                this.nodePairArrays.target.push(t);
                this.nodePairArrays.links.push([]);
                this.nodePairArrays.selections.push([]);
                this.nodePairArrays.filter.push(false);
            }
            // add link only, if not already exist
            if (this.nodePairArrays.links[nodePairId].indexOf(linkId) == -1) {
                this.nodePairArrays.links[nodePairId].push(linkId);
                this.linkArrays.nodePair[linkId] = nodePairId;
            }

            //May affect matrix view, but breaks nodelink directionality
            // if (this.linkArrays.directed[i]) {
            //     nodePairId = this.matrix[t][s];
            //     if (!nodePairId) {
            //         nodePairId = this.nodePairArrays.id.length;
            //         this.matrix[t][s] = nodePairId;
            //         this.nodePairArrays.id.push(nodePairId);
            //         this.nodePairArrays.source.push(t);
            //         this.nodePairArrays.target.push(s);
            //         this.nodePairArrays.links.push(doubleArray(this._times.length));
            //     }
            //     // add link only, if not already exist
            //     if (this.nodePairArrays.links[nodePairId].indexOf(linkId) == -1) {
            //         this.nodePairArrays.links[nodePairId].push(linkId);
            //         this.linkArrays.nodePair[linkId] = nodePairId;
            //     }
            // }

            // gather link types
            if (isValidIndex(data.linkSchema.linkType)) {
                typeName = data.linkTable[i][data.linkSchema.linkType]
                typeId = this.linkTypeArrays.name.indexOf(typeName)
                if (typeId < 0) {
                    typeId = this.linkTypeArrays.length;
                    this.linkTypeArrays.id.push(typeId)
                    this.linkTypeArrays.name.push(typeName)
                }
                data.linkTable[i][data.linkSchema.linkType] = typeId;
            }

            // gather user-properties:
            for (let p = 0; p < linkUserProperties.length; p++) {
                const prop = linkUserProperties[p];
                (this.linkArrays as any)[prop].push(row[(data.linkSchema as any)[prop]]);
            }
        }

        // For every time, store a pointer to all its links:
        // var allLinks = links().toArray();
        // var allTimes = this.g.times().toArray();
        for (let i = 0; i < this.linkArrays.length; i++) {
            for (let j = 0; j < this.timeArrays.length; j++) {
                if(this.linkArrays.weights[i]) {
                    if (Object.prototype.hasOwnProperty.call(this.linkArrays.weights[i].toArray(), this.timeArrays.id[j].toString())) {
                        this.timeArrays.links[j].push(this.linkArrays.id[i]);
                    }
                }
            }
        }

        //Build a color mapping
        const colorSet = new Set(['#e4549b', '#a33a36', '#bd6221', '#dfba47', '#b5b867', '#479b7f', '#335b8e', '#78387d']);
        const colorMappings: { [color: string]: string; } = {};
        this.nodeArrays.color.forEach(function (color: any) {
            if (!colorMappings[color]) {
                const colorSetAsArray = Array.from(colorSet)
                const generatedColor = colorSetAsArray[Math.floor(Math.random() * colorSetAsArray.length)]
                colorMappings[color] = generatedColor;
                colorSet.delete(generatedColor);
            }
        });

        //Add color values to nodeArray colors
        /*
        for(let i=0; i<this.nodeArrays.color.length; i++) {
            this.nodeArrays.color[i] = this.nodeArrays.color[i], colorMappings[this.nodeArrays.color[i]];
        }
        */

        //Build a shape mapping
        const shapeSet = new Set(['cross', 'diamond', 'square', 'triangle']);
        const shapeMappings: { [shape: string]: string; } = {};
        this.nodeArrays.shape.forEach(function (shape: any) {
            if (!shapeMappings[shape]) {
                const shapeSetAsArray = Array.from(shapeSet)
                const generatedShape = shapeSetAsArray[Math.floor(Math.random() * shapeSetAsArray.length)]
                shapeMappings[shape] = generatedShape;
                shapeSet.delete(generatedShape);
            }
        });

        //Add shapes to nodeArray shapes
        /*
        for(let i=0; i<this.nodeArrays.shape.length; i++) {
            this.nodeArrays.shape[i] = this.nodeArrays.shape[i], shapeMappings[this.nodeArrays.shape[i]];
        }
        */


        // create color map for link types
        const linkTypeCount: number = this.linkTypeArrays.length;

        console.log('[Dynamic Graph] Dynamic Graph created: ', this.nodeArrays.length);
        console.log('[Dynamic Graph]    - Nodes: ', this.nodeArrays.length);
        console.log('[Dynamic Graph]    - Edges: ', this.linkArrays.length);
        console.log('[Dynamic Graph]    - Times: ', this.timeArrays.length);
        console.log('[Dynamic Graph]    - Link types: ', this.linkTypeArrays.length);
        console.log('[Dynamic Graph]    - Node Pairs: ', this.nodePairArrays.length);


        console.log('>>>this.nodeArrays["neighbors"][0]', this.nodeArrays['neighbors'][0])

        // inits the WindowGraph for this dynamic graph, i.e.
        // the all-aggregated graph.
        this.createGraphObjects(true, true); //false, false);

        this.createSelections(false);
    }

    createSelections(shouldCreateArrays: boolean): void {
        // CREATE SELECTIONS
        if (shouldCreateArrays) {
            if (!('nodeArrays' in this && this.nodeArrays)) {
                this.nodeArrays = new NodeArray();
                this.linkArrays = new LinkArray();
                this.timeArrays = new TimeArray();
                this.nodePairArrays = new NodePairArray();
            }
            this.nodeArrays.selections = new Array(this.nodeArrays.length);
            for (let i = 0; i < this.nodeArrays.selections.length; i++) {
                this.nodeArrays.selections[i] = [];
            }

            this.linkArrays.selections = new Array(this.linkArrays.length);
            for (let i = 0; i < this.linkArrays.selections.length; i++) {
                this.linkArrays.selections[i] = [];
            }

            this.timeArrays.selections = new Array(this.timeArrays.length);
            for (let i = 0; i < this.timeArrays.selections.length; i++) {
                this.timeArrays.selections[i] = [];
            }

            this.nodePairArrays.selections = new Array(this.nodePairArrays.length);
            for (let i = 0; i < this.nodePairArrays.selections.length; i++) {
                this.nodePairArrays.selections[i] = [];
            }
        }

        // create default selections for each type
        this.defaultNodeSelection = this.createSelection('node');
        this.defaultNodeSelection.name = 'Unselected';
        for (let i = 0; i < this._nodes.length; i++) {
            this.defaultNodeSelection.elementIds.push(i);
            this.addToAttributeArraysSelection(this.defaultNodeSelection, 'node', this._nodes[i].id());
        }
        this.defaultNodeSelection.color = '#000000';
        this.defaultNodeSelection.showColor = false;
        this.defaultNodeSelection.priority = 10000;
        this.selectionColor_pointer--;


        this.defaultLinkSelection = this.createSelection('link');
        this.defaultLinkSelection.name = 'Unselected';
        for (let i = 0; i < this._links.length; i++) {
            this.defaultLinkSelection.elementIds.push(i);
            this.addToAttributeArraysSelection(this.defaultLinkSelection, 'link', this._links[i].id());
        }
        this.defaultLinkSelection.color = '#000000';
        this.defaultLinkSelection.showColor = false;
        this.defaultLinkSelection.priority = 10000;
        this.selectionColor_pointer--;

        // create selections for node types
        let types: string[] = []
        let type, index;
        let selection: Selection;
        const nodeSelections: Selection[] = [];

        for (let i = 0; i < this.nodeArrays.nodeType.length; i++) {
            type = this.nodeArrays.nodeType[i];
            if (type == undefined || type.length == 0 || type == 'undefined')
                continue;
            index = types.indexOf(type);
            if (index == -1) {
                selection = this.createSelection('node');
                selection.name = type;
                nodeSelections.push(selection)
                types.push(type);
            } else {
                selection = nodeSelections[index];
            }
            this.addElementToSelection(selection, this._nodes[i]);
            // this.addToSelection(selection, this._nodes[i].id(), 'node');
        }
        if (nodeSelections.length == 1) {
            console.log('nodeSelections[0]:', nodeSelections[0])
            nodeSelections[0].color = '#444';
        }

        // create selections for link type
        types = [];
        const linkSelections: Selection[] = [];
        for (let i = 0; i < this.linkArrays.linkType.length; i++) {
            type = this.linkArrays.linkType[i];
            if (!type || type == 'undefined')
                continue;
            index = types.indexOf(type);
            if (index == -1) {
                selection = this.createSelection('link');
                selection.name = type;
                linkSelections.push(selection)
                types.push(type);
            } else {
                selection = linkSelections[index];
            }
            this.addElementToSelection(selection, this._links[i]);
            // this.addToSelection(selection, this._links[i].id(), 'link');
        }
        if (linkSelections.length == 1)
            linkSelections[0].color = '#444';


        // create selections for node type
        // types = [];
        // var nodeSelections: Selection[] = [];
        // for (var i = 0; i < this.nodeArrays.nodeType.length; i++) {
        //     type = this.nodeArrays.nodeType[i];
        //     if (!type || type == 'undefined')
        //         continue;
        //     index = types.indexOf(type);
        //     if (index == -1) {
        //         selection = this.createSelection('node');
        //         selection.name = type;
        //         nodeSelections.push(selection)
        //         types.push(type);
        //     } else {
        //         selection = nodeSelections[index];
        //     }
        //     this.addElementToSelection(selection, this._nodes[i]);
        //     // this.addToSelection(selection, this._links[i].id(), 'link');
        // }

        this.currentSelection_id = 0;

    }



    // GRAPH API //////////////////

    /**
     *
     * Returns a window graph for the passed time point
     * or period
     * @param  {any}    start First time point of this graph
     * @param  {any}    end   Last time point of this graph.
     * @return {[type]}       [description]
     */
    // getGraph(start: Time, end?: Time): WindowGraph {
    //     var g: WindowGraph = new WindowGraph();
    //     return this.createGraph(g, start, end);
    // }

    // Creates a new graph with all nodes and edges from start to end.
    // CACHEGRAPH : this code needs to be leveraged to initialize all of the fields from
    // windowGraph that are now part of this class
    private createGraphObjects(shouldCreateTimes: boolean, shouldCreateLinkTypes: any): void {

        // measure time:
        console.log('[DynamicNetwork:createGraph()] >>> ')
        const d = Date.now();

        // POPULATE WINDOW GRAPH

        // populate locations
        if (this.locationArrays && 'id' in this.locationArrays) {
            for (let i = 0; i < this.locationArrays.id.length; i++) {
                this._locations.push(new Location(this.locationArrays.id[i], this));
            }
        }
        else {
            this.locationArrays = new LocationArray();
        }

        // Populate nodes
        const nodes: Node[] = [];
        let locations;
        if ('nodeArrays' in this && this.nodeArrays) {
            for (let i = 0; i < this.nodeArrays.id.length; i++) {
                nodes.push(new Node(i, this));
            }
        }

        // Populate links
        const links: Link[] = [];
        let link: Link;
        let source: Node, target: Node;
        if ('linkArrays' in this && this.linkArrays) {
            for (let i = 0; i < this.linkArrays.source.length; i++) {

                link = new Link(i, this);
                links.push(link);

            }
        }

        // Populate node pairs
        let s: number, t: number;
        let pairLinks: number[];
        let pair: NodePair;
        let pairLinkId: number;
        const thisGraphNodePairIds: number[] = [];
        if ('nodePairArrays' in this && this.nodePairArrays) {
            for (let i = 0; i < this.nodePairArrays.length; i++) {
                pairLinks = this.nodePairArrays.links[i];
                this._nodePairs.push(new NodePair(i, this));
                // for (var j = 0; j < pairLinks.length; j++) {
                //     pairLinkId = pairLinks[j];
                //     pair = undefined;
                //     for (var k = 0; k < nodePairs.length; k++) {
                //         if (nodePairs[k].id == i) {
                //             pair = nodePairs[k];
                //             break;
                //         }
                //     }
                //     if (!pair) {
                //         pair = new NodePair(i, this);
                //         nodePairs.push(pair)
                //         thisGraphNodePairIds.push(i)
                //         pair.source = nodes[this.pairAttr('source', i)];
                //         pair.target = nodes[this.pairAttr('target', i)];
                //     }

                //     for (var k = 0; k < links.length; k++) {
                //         if (links[k].id == pairLinkId) {
                //             link = links[k];
                //             break;
                //         }
                //     }

                //     pair.links.push(link);
                //     link.nodePair = pair;
                // }
            }
        }

        this._nodes = nodes;
        this._links = links;
        // this.nodePairs = nodePairs;

        if (shouldCreateTimes) {// && 'timesArrays' in this && this.timeArrays) {
            this._times = [];
            for (let i = 0; i < this.timeArrays.length; i++)
                this._times.push(new Time(i, this));
        }

        // if (shouldCreateLinkTypes) {
        //     var linkTypeCount: number = this.linkTypeArrays.length;
        //     var colorScale;
        //     if (linkTypeCount <= 10) {
        //         colorScale = d3.scale.category10();
        //     } else {
        //         colorScale = d3.scale.category20();
        //     }
        //     for (var i = 0; i < this.linkTypeArrays.name.length; i++) {
        //         this.linkTypes.push(new LinkType(
        //             this.linkTypeArrays.id[i],
        //             this.linkTypeArrays.name[i],
        //             this.linkTypeArrays.color[i]
        //         ));
        //     }
        // }

        console.log('[DynamicNetwork:getGraph()] <<< ', Date.now() - d, 'msec')
    }

    // all attribute accessor method
    nodeAttr(attr: string, id: number): any {
        return this.attr(attr, id, 'node');
    }
    linkAttr(attr: string, id: number): any {
        return this.attr(attr, id, 'link');
    }
    pairAttr(attr: string, id: number): any {
        return this.attr(attr, id, 'nodePair');
    }
    timeAttr(attr: string, id: number): any {
        return this.attr(attr, id, 'time');
    }

    get startTime(): Time { return this._times[0]; }
    get endTime(): Time { return this._times[this._times.length - 1]; }

    // /// SELECTIONS
    // // selections store ids of objects only.



    highlight(action: string, idCompound?: IDCompound): void {

        if (action == 'reset') {
            // reset all
            this.highlightArrays.nodeIds = [];
            this.highlightArrays.linkIds = [];
            this.highlightArrays.nodePairIds = [];
            this.highlightArrays.timeIds = [];
            return;
        }
        if (!idCompound) {
            console.error('[DynamicGraph] highlight: idCompound not set!')
            return;
        }

        if (action == 'set') {
            this.highlight('reset');
            this.highlight('add', idCompound);
            return;
        }


        // if(action == 'add'){
        //     for(var i=0 ; i<elementIds.length ; i++){
        //         if(this.highlightArrays[type].indexOf(elementIds[i]) == -1)
        //             this.highlightArrays[type].push(elementIds[i]);
        //     }
        // }else
        // if(action == 'remove'){
        //     for(var i=0 ; i<elementIds.length ; i++){
        //         if(this.highlightArrays[type].indexOf(elementIds[i]) > -1)
        //              this.highlightArrays[type].splice(this.highlightArrays[type].indexOf(elementIds[i]),1)
        //     }
        // }
        if (action == 'add') {
            for (const type in idCompound) {
                for (let i = 0; i < (idCompound as any)[type].length; i++) {
                    (this.highlightArrays as any)[type].push((idCompound as any)[type][i]);
                }
            }
        } else
            if (action == 'remove') {
                let index: number;
                for (const type in idCompound) {
                    for (let i = 0; i < (idCompound as any)[type].length; i++) {
                        index = (this.highlightArrays as any)[type].indexOf((idCompound as any)[type][i]);
                        if (index >= 0)
                            (this.highlightArrays as any)[type].splice(index, 1);
                    }
                }
            }
    }


    // SELECT
    selection(action: string, idCompound: IDCompound, selectionId?: number): void {

        if (selectionId == undefined)
            selectionId = this.currentSelection_id;

        const selection: any = this.getSelection(selectionId);
        if (!selection) {
            console.error('[DynamicGraph] Selection with ', selectionId, 'not found in ', this.selections);
            return; // WITH RETURN ?
        }

        if (action == 'set') {
            const c: IDCompound = new IDCompound();
            (c as any)[selection.acceptedType] = selection.elementIds;
            this.selection('remove', c, selectionId);
            this.selection('add', idCompound, selectionId);
        } else if (action == 'add') {
            idCompound.linkIds.forEach((v, i, arr) => this.addToSelectionByTypeAndId(selection, 'link', v));
            idCompound.nodeIds.forEach((v, i, arr) => this.addToSelectionByTypeAndId(selection, 'node', v));
            idCompound.timeIds.forEach((v, i, arr) => this.addToSelectionByTypeAndId(selection, 'time', v));
            idCompound.nodePairIds.forEach((v, i, arr) => this.addToSelectionByTypeAndId(selection, 'nodePair', v));
        } else if (action == 'remove') {
            idCompound.linkIds.forEach((v, i, arr) => this.removeFromSelectionByTypeAndId(selection, 'link', v));
            idCompound.nodeIds.forEach((v, i, arr) => this.removeFromSelectionByTypeAndId(selection, 'node', v));
            idCompound.timeIds.forEach((v, i, arr) => this.removeFromSelectionByTypeAndId(selection, 'time', v));
            idCompound.nodePairIds.forEach((v, i, arr) => this.removeFromSelectionByTypeAndId(selection, 'nodePair', v));
        }
    }



    // SELFIX : delegate to dgraph
    addToAttributeArraysSelection(selection: Selection, type: string, id: number): void {
        // check for priority of selections, then add where appropriate
        const elementSelections = (this.attributeArrays as any)[type].selections[id];
        for (let i = 0; i < elementSelections.length; i++) {
            if (elementSelections[i].priority > selection.priority) {
                (this.attributeArrays as any)[type].selections[id].splice(i, 0, selection);
                return;
            }
        }
        // if not already selected and if not higher priority than any other
        // selection, append to the end.
        (this.attributeArrays as any)[type].selections[id].push(selection);
    }

    // SELFIX : delegate to dgraph
    removeFromAttributeArraysSelection(selection: Selection, type: string, id: number): void {
        const arr = (this.attributeArrays as any)[type].selections[id];
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] == selection)
                (this.attributeArrays as any)[type].selections[id].splice(i, 1);
        }
    }

    addElementToSelection(selection: Selection, e: BasicElement): void {
        this.addToSelectionByTypeAndId(selection, e.type, e.id());
    }

    addToSelectionByTypeAndId(selection: Selection, type: string, id: number): void {
        if (type != selection.acceptedType) {
            console.log('attempting to put object of the wrong type into a selection');
            return; // don't proceed with selection;
        }
        selection.elementIds.push(id);
        this.addToAttributeArraysSelection(selection, type, id);
        // =======
        //                 this.selection('add', idCompound, selectionId);
        //             } else {
        //                 if (action == 'add') {
        //                     for (var field in idCompound) {
        //                         for (var i = 0; i < idCompound[field].length; i++) {
        //                             this.addToSelection(selection, idCompound[field][i], field)
        //                         }
        //                     }
        //                 } else {
        //                     if (action == 'remove') {
        //                         for (var field in idCompound) {
        //                             for (var i = 0; i < idCompound[field].length; i++) {
        //                                 for (var j = 0; j < selection.elementIds.length; j++) {
        //                                     if (selection.elementIds[j] == idCompound[field][i].id) {
        //                                         this.removeFromSelection(selection, idCompound[field][i], field);
        //                                     }
        //                                 }
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //         addToSelection(selection: Selection, id:number, elementType:string) {
        //             selection.elementIds.push(id);

        //             var e:BasicElement = this.get(elementType, id);
        //             e.addToSelection(selection);
        // >>>>>>> api
        // remove from default selection
        let i;
        if (type == 'node') {
            i = this.defaultNodeSelection.elementIds.indexOf(id);
            if (i > -1) {
                this.removeFromAttributeArraysSelection(this.defaultNodeSelection, type, id);
                this.defaultNodeSelection.elementIds.splice(i, 1);
            }
        } else
            if (type == 'link') {
                i = this.defaultLinkSelection.elementIds.indexOf(id);
                if (i > -1) {
                    this.removeFromAttributeArraysSelection(this.defaultLinkSelection, type, id);
                    this.defaultLinkSelection.elementIds.splice(i, 1);
                }
            }

    }
    // <<<<<<< HEAD

    removeElementFromSelection(selection: Selection, e: BasicElement): void {
        this.removeFromSelectionByTypeAndId(selection, e.type, e.id());
    }

    removeFromSelectionByTypeAndId(selection: Selection, type: string, id: number): void {
        // selection.elements.push(compound[field][i])
        // e.addToSelection(selection);
        // =======
        //         removeFromSelection(selection: Selection, id:number, elementType:string) {
        // >>>>>>> api
        const i = selection.elementIds.indexOf(id)
        if (i == -1)
            return;

        selection.elementIds.splice(i, 1);
        // <<<<<<< HEAD
        this.removeFromAttributeArraysSelection(selection, type, id);
        // =======
        //             var e:BasicElement = this.get(elementType, id);
        //             e.removeFromSelection(selection);
        // >>>>>>> api

        // add to default selection
        if (this.getSelectionsByTypeAndId(type, id).length == 0) {
            if (type == 'node') {
                this.defaultNodeSelection.elementIds.push(id);
                this.addToAttributeArraysSelection(this.defaultNodeSelection, type, id);
            } else
                if (type == 'link') {
                    this.defaultLinkSelection.elementIds.push(id);
                    this.addToAttributeArraysSelection(this.defaultLinkSelection, type, id);
                }
        }
    }

    getSelectionsByTypeAndId(type: string, id: number): Selection[] {
        return (this.attributeArrays as any)[type].selections[id];
    }


    filterSelection(selectionId: number, filter: boolean): void {
        const selection: any = this.getSelection(selectionId);
        if (selection != undefined) {
            selection.filter = filter;
        }
    }

    isFiltered(id: number, type: string): boolean {
        return (this.attributeArrays as any)[type + 's'].filter;
    }

    isHighlighted(id: number, type: string): boolean {
        return (this.highlightArrays as any)[type + 'Ids'].indexOf(id) > -1;
    }

    getHighlightedIds(type: string): any {
        return (this.highlightArrays as any)[type + 'Ids'];
    }


    setCurrentSelection(id: number): void {
        // [bbach] why should we ignore them?
        // if (id < 2) // i.e. either default node or link selection..
        //     return;  // ignore
        console.log('[DynamicGraph] setCurrentSelectionId ', id)
        this.currentSelection_id = id;
    }
    getCurrentSelection(): Selection | undefined { // before onoly Selection!
        return this.getSelection(this.currentSelection_id);
    }

    addSelection(id: number, color: string, acceptedType: string, priority: number): void {
        const s: Selection = this.createSelection(acceptedType);
        s.id = id;
        s.color = color;
        s.priority = priority;
    }

    // creates a selection for the passed type.
    createSelection(type: string): Selection {
        const s = new Selection(this.selections.length, type);
        s.color = this.BOOKMARK_COLORS(this.selectionColor_pointer % 10);
        this.selectionColor_pointer++;
        this.selections.push(s);
        return s;
    }

    deleteSelection(selectionId: number): void {
        const s = this.getSelection(selectionId);

        // remove all elements from this selection
        // <<<<<<< HEAD
        //             var compound: ElementCompound = new ElementCompound();
        //             compound[s.acceptedType + 'Ids'] = s.elementIds.slice(0);
        //             this.selection('remove', compound, s.id)
        // =======

        // remove
        if (s != undefined) {
            const idCompound: IDCompound = new IDCompound();
            (idCompound as any)[s.acceptedType + 'Ids'] = s.elementIds.slice(0);
            console.log('Delete selection->remove elemeents', s.elementIds.slice(0))
            this.selection('remove', idCompound, s.id)
            // >>>>>>> api

            // delete selection
            this.selections.splice(this.selections.indexOf(s), 1);
        }
    }

    setSelectionColor(id: number, color: string): void {
        const s = this.getSelection(id);
        if (!s) {
            return;
        }
        s.color = color;
    }
    getSelections(type?: string): Selection[] {
        const selections: Selection[] = [];
        if (type) {
            for (let i = 0; i < this.selections.length; i++) {
                if ((<Selection>this.selections[i]).acceptsType(type))
                    selections.push(this.selections[i])
            }
            return selections;
        } else {
            return this.selections;
        }
    }
    getSelection(id: number): Selection | undefined { // before only Selection return
        for (let i = 0; i < this.selections.length; i++) {
            if (id == this.selections[i].id)
                return this.selections[i];
        }
        console.error('[DynamicGraph] No selection with id ', id, 'found!');
        /* If not found ?? */
        return undefined;
    }

    clearSelections(): void {
        this.selections = [];
    }



    // internal utils
    getTimeIdForUnixTime(unixTime: number): number | undefined { // before only number
        let timeId: number;
        console.log("unixTime: ")
        console.log(unixTime)
        for (timeId = 0; timeId < this.timeArrays.length; timeId++) {
            if (unixTime == this.timeArrays.unixTime[timeId]) {
                timeId;
                return timeId;
            }
        }
        console.error('Time object for unix time', unixTime, 'not found!')
        return undefined;
    }

    // ORDERING
    /* adds an specific node order (e.g. alphabetical) */


    // go into dynamicgraph
    addNodeOrdering(name: string, order: number[]): void {
        for (let i = 0; i < this.nodeOrders.length; i++) {
            if (this.nodeOrders[i].name == name) {
                console.error('Ordering', name, 'already exists');
                return;
            }
        }
        const o = new Ordering(name, order);
        this.nodeOrders.push(o);
    }
    setNodeOrdering(name: string, order: number[]): void {
        for (let i = 0; i < this.nodeOrders.length; i++) {
            if (this.nodeOrders[i].name == name) {
                this.nodeOrders[i].order = order;
                return;
            }
        }
        console.error('Ordering', name, 'does not exist');
    }
    removeNodeOrdering(name: string, order: number[]): void {
        for (let i = 0; i < this.nodeOrders.length; i++) {
            if (this.nodeOrders[i].name == name) {
                this.nodeOrders.splice(i, 1);
            }
        }
    }
    getNodeOrder(name: string): Ordering | undefined {
        for (let i = 0; i < this.nodeOrders.length; i++) {
            if (this.nodeOrders[i].name == name) {
                return this.nodeOrders[i];
            }
        }
        console.error('Ordering', name, 'not found!');
        return;
    }


    // returns elements
    nodes(): NodeQuery {
        return new NodeQuery(this.nodeArrays.id, this);
    }
    links(): LinkQuery {
        return new LinkQuery(this.linkArrays.id, this);
    }
    times(): TimeQuery {
        return new TimeQuery(this.timeArrays.id, this);
    }
    locations(): LocationQuery {
        return new LocationQuery(this.locationArrays.id, this);
    }
    nodePairs(): NodePairQuery {
        return new NodePairQuery(this.nodePairArrays.id, this);
    }


    linksBetween(n1: Node, n2: Node): LinkQuery {
        let nodePairId = this.matrix[n1.id()][n2.id()];
        if (nodePairId == undefined)
            nodePairId = this.matrix[n2.id()][n1.id()];
        if (nodePairId == undefined)
            return new LinkQuery([], this);

        /* UNDEFINED? */
        const node_pair: any = this.nodePair(nodePairId);
        if (node_pair != undefined)
            return new LinkQuery(node_pair.links().toArray(), this);
        else
            return new LinkQuery([], this);
    }


    // generic accessor method. should not be used externally
    get(type: string, id: number): BasicElement | undefined {
        if (type.indexOf('nodePair') > -1)
            return this.nodePair(id);
        if (type.indexOf('node') > -1)
            return this.node(id);
        if (type.indexOf('link') > -1)
            return this.link(id);
        if (type.indexOf('time') > -1)
            return this.time(id);
        if (type.indexOf('locations') > -1)
            return this.location(id);
    }

    getAll(type: string): GraphElementQuery {
        if (type == 'nodes')
            return this.nodes();
        if (type == 'links')
            return this.links();
        if (type == 'times')
            return this.times();
        if (type == 'nodePairs')
            return this.nodePairs();
        // if (type == 'locations')
        return this.locations();
    }

    // returns the node with ID
    node(id: number): Node | undefined {
        for (let i = 0; i < this._nodes.length; i++) {
            if (this._nodes[i].id() == id)
                return this._nodes[i];
        }
    }

    link(id: number): Link | undefined {
        for (let i = 0; i < this._links.length; i++) {
            if (this._links[i].id() == id)
                return this._links[i];
        }
    }
    time(id: number): Time | undefined {
        for (let i = 0; i < this._times.length; i++) {
            if (this._times[i].id() == id)
                return this._times[i];
        }
    }
    location(id: number): Location | undefined {
        for (let i = 0; i < this._locations.length; i++) {
            if (this._locations[i].id() == id)
                return this._locations[i];
        }
    }
    nodePair(id: number): NodePair | undefined {
        for (let i = 0; i < this._nodePairs.length; i++) {
            if (this._nodePairs[i].id() == id)
                return this._nodePairs[i];
        }
    }

    getMinGranularity(): number { return this.gran_min; }
    getMaxGranularity(): number { return this.gran_max; }
}

// A time series with one scalar value for every time point

export class AttributeArray {
    id: number[] = [];
    get length(): number {
        return this.id.length;
    }
}

export class NodeArray extends AttributeArray {
    id: number[] = [];
    label: string[] = [];
    // nodeType: ScalarTimeSeries<string>[] = [];
    outLinks: ArrayTimeSeries<number>[] = [];  // contains link ids only, since every GRAPH has its own EDGE object instance
    inLinks: ArrayTimeSeries<number>[] = [];    // contains link ids only, since every GRAPH has its own EDGE object instance
    links: ArrayTimeSeries<number>[] = [];
    outNeighbors: ArrayTimeSeries<number>[] = [];   // contains node ids only, since every GRAPH has its own NODE object instance
    inNeighbors: ArrayTimeSeries<number>[] = [];   // contains node ids only, since every GRAPH has its own NODE object instance
    neighbors: ArrayTimeSeries<number>[] = [];
    selections: Selection[][] = [];
    attributes: Record<any, any>[] = []; // arbitrary attributes (key -> value)
    locations: ScalarTimeSeries<number>[] = []
    filter: boolean[] = [];
    nodeType: string[] = [];
    color: string[] = [];
    shape: string[] = [];
}

export class LinkArray extends AttributeArray {
    source: number[] = [];
    target: number[] = [];
    linkType: string[] = [];
    directed: boolean[] = [];
    nodePair: any[] = []; // before number but it don't accept undefined
    // array of all time ids (temporally ordered) when this link is present
    presence: number[][] = [];
    // array of weights per time this link is present. This is a generic field
    // that can be used for weights, e.g.
    weights: ScalarTimeSeries<any>[] = [];
    selections: Selection[][] = [];
    filter: boolean[] = [];
    attributes: Record<any, any> = new Object; // arbitrary attributes (key -> value)
}

export class NodePairArray extends AttributeArray {
    source: number[] = [];
    target: number[] = [];
    links: number[][] = [];
    selections: Selection[][] = [];
    filter: boolean[] = [];
}

export class TimeArray extends AttributeArray {
    id: number[] = [];
    momentTime: moment.Moment[] = [];         // moment object
    label: string[] = []
    unixTime: number[] = [];         // unix time object
    selections: Selection[][] = [];
    filter: boolean[] = [];
    links: number[][] = []; // all links at that time
}

export class LinkTypeArray extends AttributeArray {
    name: string[] = [];
    count: string[] = [];
    color: string[] = [];
    filter: boolean[] = [];
}

export class NodeTypeArray extends AttributeArray {
    name: string[] = [];
    count: string[] = [];
    color: string[] = [];
    filter: boolean[] = [];
}

export class LocationArray extends AttributeArray {
    id: number[] = [];
    label: string[] = [];
    longitude: number[] = [];
    latitude: number[] = [];
    x: number[] = [];
    y: number[] = [];
    z: number[] = [];
    radius: number[] = [];
}

export class NodeType implements LegendElement {
    id: number;
    name: string;
    color: string;
    constructor(id: number, name: string, color: string) {
        this.id = id;
        this.name = name;
        this.color = color;
    }
}

export class Ordering {
    name: string;
    order: number[] = [];
    constructor(name: string, order: number[]) {
        this.name = name;
        this.order = order;
    }
}

/* MOVED FROM QUERIES TO DYNAMICGRAPH */

//// QUERIES

export class Query {
    _elements: number[] = [];

    constructor(elements?: number[]) {
        if (elements) {
            for (let i = 0; i < elements.length; i++) {
                if (elements[i] != undefined)
                    this._elements.push(elements[i]);
            }
        }
    }
    // contains(element: number): boolean {
    //     return this._elements.indexOf(element) > -1;
    // }

    addUnique(element: number): void {
        if (this._elements.indexOf(element) == -1)
            this._elements.push(element);
    }
    add(element: number): void {
        this._elements.push(element);
    }
    addAll(elements: number[]): void {
        for (let i = 0; i < elements.length; i++) {
            if (elements[i] != undefined)
                this._elements.push(elements[i]);
        }
    }
    addAllUnique(elements: number[]): void {
        for (let i = 0; i < elements.length; i++) {
            this.addUnique(elements[i]);
        }
    }

    /** @returns numbr of elements in this query. Same as size(). */
    get length(): number {
        return this._elements.length
    }

    /** @returns numbr of elements in this query. Same as length getter. */
    size(): number { return this._elements.length }

    /** @returns all ids in this query. */
    ids(): number[] {
        return this._elements;
    }
    removeDuplicates(): Query {
        const elements = this._elements.slice(0)
        this._elements = [];
        for (let i = 0; i < elements.length; i++) {
            if (this._elements.indexOf(elements[i]) == -1)
                this._elements.push(elements[i])
        }
        return this;
    }
    generic_intersection(q: Query): Query {
        const intersection = [];
        for (let i = 0; i < this._elements.length; i++) {
            for (let j = 0; j < q._elements.length; j++) {
                if (this._elements[i] == q._elements[j]) {
                    intersection.push(this._elements[i])
                }
            }
        }
        return new Query(intersection);
    }


}

export class GraphElementQuery extends Query {
    g: DynamicGraph;
    elementType: string;

    constructor(elements: any[], g: DynamicGraph, elementType: string) {
        super(elements);
        this.g = g;
        this.elementType = elementType;
    }

    /** @returns a query that contains only the elements matching
     * the filter critera;
     * @param attribute - name of attribute that is used on filter
     * @param filter - function evaluating if the attribute's value is valid.
      */
    generic_filter(filter: (d: any) => boolean): any[] {
        const arr: any[] = [];
        for (let i = 0; i < this._elements.length; i++) {
            try {
                if (filter(this.g.get(this.elementType, this._elements[i]))) {
                    arr.push(this._elements[i])
                }
            } catch (ex) {
                // TODO: catch this exception?
            }
        }
        return arr;
    }
    /** @returns a query with selected elements, i.e. elements that are in at least
     * one selection.
     */
    generic_selected(): any[] {
        const arr: any[] = [];
        for (let i = 0; i < this._elements.length; i++) {
            const element = this.g.get(this.elementType, this._elements[i]);
            if (element != undefined && element.isSelected()) {
                arr.push(this._elements[i])
            }
        }
        return arr;
    }
    /** @returns a query with visible elements.
     */
    generic_visible(): any[] {
        const arr: any[] = [];
        for (let i = 0; i < this._elements.length; i++) {
            const element = this.g.get(this.elementType, this._elements[i]);
            if (element != undefined && element.isVisible()) {
                arr.push(this._elements[i])
            }
        }
        return arr;
    }
    /** @returns a query with highighted elements.
     */
    generic_highlighted(): any[] {
        const arr: any[] = [];
        for (let i = 0; i < this._elements.length; i++) {
            const element = this.g.get(this.elementType, this._elements[i]);
            if (element != undefined && element.isHighlighted()) {
                arr.push(this._elements[i]);
            }
        }
        return arr;
    }
    /** @returns a query with only the elements present in the specified time step
     * or period.
     */
    generic_presentIn(start: Time, end?: Time): any[] {
        const arr: any[] = [];
        for (let i = 0; i < this._elements.length; i++) {
            const element = this.g.get(this.elementType, this._elements[i]);
            if (element != undefined && element.presentIn(start, end)) {
                arr.push(this._elements[i]);
            }
        }
        return arr;
    }
    /** @returns this query with elements sorted */
    generic_sort(attrName: string, asc?: boolean): GraphElementQuery {
        if (this._elements.length == 0) {
            return this;
        }
        const array = this._elements.slice(0);

        // ITS POSSIBLE AN UNDEFINED VALUE??
        array.sort((e1, e2) => {
            const e1_get = this.g.get(this.elementType, e1);
            const e2_get = this.g.get(this.elementType, e2);
            if (e1_get != undefined && e2_get != undefined) {
                return attributeSort(
                    e1_get,
                    e2_get,
                    attrName,
                    asc);
            }
            else if (e1_get == undefined && e2_get == undefined) {
                return 0;
            }
            return e1_get == undefined ? 1 : -1;
        });
        this._elements = array;
        return this;
    }
    generic_removeDuplicates(): GraphElementQuery {
        const uniqueElements = [];
        for (let i = 0; i < this._elements.length; i++) {
            // for(var j=i+1 ; j <this._elements.length ; j++){
            //     if(this._elements[i]==this._elements[j])
            //         this._elements.slice(j,1);
            // }
            if (uniqueElements.indexOf(this._elements[i]) == -1)
                uniqueElements.push(this._elements[i])
        }
        this._elements = uniqueElements;
        return this;
    }


    // sortByFunction(sortFunction:(a:any,b:any)=>number){
    //     if(this._elements.length == 0){
    //         console.error('This query has no elements')
    //         return new Query<any>();
    //     }
    //     var array = this._elements.slice(0);
    //     array.sort(sortFunction);
    //     var result:GraphElementQuery<T> = new GraphElementQuery<T>();
    //     for(var i=0 ; i<array.length ; i++){
    //         result.add(array[i]);
    //     }
    //     return result;
    // }
}

/** Basic class for every object in networkcube with an ID.
 * A BasicElement is a wrapper to the DynamicGraph and that
 * represents any object, i.e. node, link, node pair, time, location.
*/

export class BasicElement {
    _id: number;
    type: string;
    g: DynamicGraph;

    // CONSTRUCTOR

    constructor(id: number, type: string, dynamicGraph: DynamicGraph) {
        this._id = id;
        this.type = type;
        this.g = dynamicGraph;
    }


    // GETTER

    /** @returns the object's id */
    id(): number {
        return this._id;
    }

    /** Generic method to return an attribute value for this element
     * @param attr: attribute name on this object.
     * @returns the attribute's value. */
    attr(attr: string): any {
        return this.g.attr(attr, this._id, this.type);
    }



    // SELECTIONS

    /** @returns all selections this object is part of. */
    getSelections(): Selection[] {
        return (this.g.attributeArrays as any)[this.type].selections[this._id];
    }

    /** Adds this object to a selection
     * @param selection - the Selection object
     */
    addToSelection(b: Selection): void {
        (this.g.attributeArrays as any)[this.type].selections[this._id].push(b);
    }

    /** Removes this object from a selection.
     * @param selection - the Selection objects
     */
    removeFromSelection(b: Selection): void {
        const arr: Selection[] = (this.g.attributeArrays as any)[this.type].selections[this._id];
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] == b)
                (this.g.attributeArrays as any)[this.type].selections[this._id].splice(i, 1);
        }
    }

    inSelection(s: Selection): boolean {
        return this.getSelections().indexOf(s) > -1;
    }


    // DISPLAY STATES

    /** @returns true if this object is selected.
     * @param selection - (optional) if specified returns true if this object
     * is in the passed selection.
     */
    isSelected(selection?: Selection): boolean {
        if (!selection)
            return this.getSelections().length > 0;

        const selections = (this.g.attributeArrays as any)[this.type].selections[this._id];
        for (let i = 0; i < selections.length; i++) { // start with 1 to avoid default selection.
            if (selections[i] == this.g.defaultNodeSelection || selections[i] == this.g.defaultLinkSelection) {
                continue;
            }
            if (selections[i] == selection)
                return true;
        }
        return false;
    }

    /** @returns true if this object is highlighted */
    isHighlighted(): boolean {
        return this.g.isHighlighted(this._id, this.type);
    }

    /** @returns true if this object is filtered, i.e. removed from display. */
    isFiltered(): boolean {
        return this.g.isFiltered(this._id, this.type);
    }

    /** @returns true if this object is visible. */
    isVisible(): boolean {
        const selections = this.getSelections();
        if (selections.length == 0)
            return true;
        for (let i = 0; i < selections.length; i++) {
            if (selections[i].filter)
                return false;
        }
        return true;
    }


    // OTHER QUERIES

    /** @returns true if this object is present in the graph
     * in a specific time or a time period.
     * @param start -  start time. If only this parameter is passed to the
     * function, method returns if this object is present in this time step.
     * @param end - end time. If this parameter is specified, returns if this
     * object is present between start and end.
     */
    presentIn(start: Time, end?: Time): boolean {
        const presence: number[] = this.attr('presence');
        if (!end)
            end = start;
        for (let i = start._id; i <= end._id; i++) {
            if (presence.indexOf(i) > -1)
                return true;
        }
        return false;
    }
}

/** A time series with a scalar value per time step.
 * This class nestes an object that holds information for time
 * steps in the format key->value. I.e. the value for the
 * time step with ID 3 is accessed by this.3   */
export class ScalarTimeSeries<T>{
    private serie: any = {};

    /** @returns a ScalarTimeSeries for the specified period. */
    period(t1: Time, t2: Time): ScalarTimeSeries<T> {
        const t1id = t1.id();
        const t2id = t2.id();
        const s = new ScalarTimeSeries<T>();
        for (const prop in this.serie) {
            if (parseInt(prop) >= t1id
                && parseInt(prop) <= t2id) {
                s.serie[prop] = this.serie[prop];
            }
        }
        return s;
    }

    /** Sets a value for a specified time point. */
    set(t: Time, element: T): void {
        this.serie[t.id()] = element
    }
    /** @returns the value for a specified time point. */
    get(t: Time): any { // before T!!
        if (this.serie[t.id()] == undefined)
            return ; // this is avoid!!
        return this.serie[t.id()];
    }

    size(): number {
        return this.toArray().length;
    }

    getSerie(): any[]{
        return this.serie;
    }

    /** Returns all values as array.
     * @param removeDuplicates
     * @returns array with values;
     */
    toArray(removeDuplicates?: boolean): T[] {
        if (removeDuplicates == undefined)
            removeDuplicates = false;
        const a: T[] = [];
        if (removeDuplicates) {
            for (const prop in this.serie) {
                a.push(this.serie[prop])
            }
        } else {
            for (const prop in this.serie) {
                if (a.indexOf(this.serie[prop]) == -1)
                    a.push(this.serie[prop])
            }
        }
        return a;
    }
}


/** A time series with an array per time step.
* This class nestes an object that holds information for time
* steps in the format key->value. I.e. the value for the
* time step with ID 3 is accessed by this.3   */
export class ArrayTimeSeries<T>{
    serie: any = {};

    period(t1: Time, t2: Time): ArrayTimeSeries<T> {
        const t1id = t1.id();
        const t2id = t1.id();
        const s = new ArrayTimeSeries<T>();
        for (const prop in this.serie) {
            if (parseInt(prop) >= t1id
                && parseInt(prop) <= t1id) {
                (s.serie as any)[prop] = (this.serie as any)[prop];
            }
        }
        return s;
    }

    add(t: Time, element: T): void {
        if (t == undefined) {
            return;
        }

        if (!(this.serie as any)[t._id])
            (this.serie as any)[t._id] = [];
        (this.serie as any)[t._id].push(element);
    }
    get(t: Time): T[] {
        return (this.serie as any)[t._id];
    }

    toArray(): T[][] {
        const a: T[][] = [];
        for (const prop in this.serie) {
            a.push((this.serie as any)[prop]);
        }
        return a;
    }

    toFlatArray(removeDuplicates?: boolean): T[] {
        if (removeDuplicates == undefined)
            removeDuplicates = false;
        const a: T[] = [];
        for (const prop in this.serie) {
            for (let i = 0; i < (this.serie as any)[prop].length; i++) {
                if (!removeDuplicates || (removeDuplicates && a.indexOf((this.serie as any)[prop]) == -1)) {
                    a.push((this.serie as any)[prop][i]);
                }
            }
        }
        return a;
    }

}

export class TimeQuery extends GraphElementQuery {
    //elementType = 'time';

    constructor(elements: any[], g: DynamicGraph) {
        super(elements, g, 'time');
        //this.elementType = 'time';
        if (elements.length > 0 && elements[0] instanceof Time) {
            this._elements = []
            for (let i = 0; i < elements.length; i++) {
                this._elements.push(elements[i].id());
            }
        }
        if (elements.length > 0 && typeof elements[0] == 'number') {
            this._elements = []
            for (let i = 0; i < elements.length; i++) {
                this._elements.push(elements[i]);
            }
        }
    }

    contains(t: Time): boolean {
        return this._elements.indexOf(t.id()) > -1;
    }

    highlighted(): TimeQuery {
        return new TimeQuery(super.generic_highlighted(), this.g);
    }
    visible(): TimeQuery {
        return new TimeQuery(super.generic_visible(), this.g);
    }
    selected(): TimeQuery {
        return new TimeQuery(super.generic_selected(), this.g);
    }
    filter(filter: (d: any) => boolean): TimeQuery {
        return new TimeQuery(super.generic_filter(filter), this.g);
    }
    presentIn(t1: Time, t2: Time): TimeQuery {
        return new TimeQuery(super.generic_presentIn(t1, t2), this.g);
    }
    sort(attributeName: string): TimeQuery {
        return <TimeQuery>super.generic_sort(attributeName);
    }

    links(): LinkQuery {
        let links: number[] = [];
        // var allLinks = this.g.links().toArray();
        // var allTimes = this.g.times().toArray();
        // for(var i=0 ; i<allLinks.length ; i++){
        // for(var j=0 ; j<allTimes.length ; j++){
        //     if(allLinks[i].presentIn(allTimes[j])){
        //         links.push(allLinks[i].id());
        //         break
        //     }
        // }
        // }
        for (let i = 0; i < this._elements.length; i++) {
            links = links.concat(this.g.attr('links', this._elements[i], 'time'));
        }
        return new LinkQuery(links, this.g);
    }

    // returns the i-th element in this query
    get(i: number): Time { return this.g._times[this._elements[i]] }

    last(): Time { return this.g._times[this._elements[this._elements.length - 1]] }

    // return array of times
    toArray(): Time[] {
        const a: Time[] = [];
        const allTimes = this.g._times;
        for (let i = 0; i < this._elements.length; i++) {
            a.push(allTimes[this._elements[i]]);
        }
        return a;
    }
    createAttribute(attrName: string, f: (t: Time) => void): TimeQuery {
        // create and init new attribute array if necessary
        if ((this.g.timeArrays as any)[attrName] == undefined) {
            (this.g.timeArrays as any)[attrName] = []
            for (let i = 0; i < this.g._times.length; i++) {
                (this.g.timeArrays as any)[attrName].push();
            }
        }
        for (let i = 0; i < this._elements.length; i++) {
            (this.g.timeArrays as any)[attrName][this._elements[i]] = f(this.g._times[this._elements[i]]);
        }
        return this;
    }
    unixTimes(): number[] {
        const unixTimes: number[] = [];
        for (let i = 0; i < this._elements.length; i++) {
            const time = this.g.time(this._elements[i]); // UNDEFINED ??
            if (time != undefined) {
                unixTimes.push(time.unixTime());
            }
        }
        return unixTimes;
    }

    intersection(q: TimeQuery): TimeQuery {
        return new TimeQuery(this.generic_intersection(q)._elements, this.g);
    }
    forEach(f: (t: Time | undefined, i: number) => void): TimeQuery {
        for (let i = 0; i < this._elements.length; i++) {
            f(this.g.time(this._elements[i]), i);
        }
        return this;
    }


}


/**
* Represents a Time object
*/
export class Time extends BasicElement {

    constructor(id: number, dynamicGraph: DynamicGraph) {
        super(id, 'time', dynamicGraph)
    }

    // SPECIFIC ATTRIBUTE QUERIES

    /** @returns the moment object associated to this time object. */
    time(): moment.Moment { return this.attr('momentTime'); }
    moment(): moment.Moment { return this.attr('momentTime'); }

    label(): string { return this.attr('label') }

    /** @returns the unix time for this time object. */
    unixTime(): number { return this.attr('unixTime'); }

    /** @returns a string label for this object. */
    // label(): String { return this.attr('label') + ''; }

    links(): LinkQuery {
        // var links:number[] = [];
        // for(var i=0 ; i<allLinks.length ; i++){
        //     if(allLinks[i].presentIn(this))
        //         links.push(allLinks[i].id());
        // }
        return new LinkQuery(this.attr('links'), this.g);
    }

    // wrapper to moment.js
    year(): number { return this.time().year(); }
    month(): number { return this.time().month(); }
    week(): number { return this.time().week(); }
    day(): number { return this.time().day(); }
    hour(): number { return this.time().hour(); }
    minute(): number { return this.time().minute(); }
    second(): number { return this.time().second(); }
    millisecond(): number { return this.time().millisecond(); }

    format(format: string): string {
        return this.time().format(format)
    }
}

export class LocationQuery extends GraphElementQuery {
    // elementType = 'location';

    constructor(elements: any[], g: DynamicGraph) {
        super(elements, g, 'location');
        // this.elementType = 'location';
        if (elements.length > 0 && elements[0] instanceof Location) {
            this._elements = []
            for (let i = 0; i < elements.length; i++) {
                this._elements = elements[i].id();
            }
        }
        if (elements.length > 0 && typeof elements[0] == 'number') {
            this._elements = []
            for (let i = 0; i < elements.length; i++) {
                this._elements.push(elements[i]);
            }
        }
    }

    contains(l: Location): boolean {
        return this._elements.indexOf(l.id()) > -1;
    }

    highlighted(): LocationQuery {
        return new LocationQuery(super.generic_highlighted(), this.g);
    }
    visible(): LocationQuery {
        return new LocationQuery(super.generic_visible(), this.g);
    }
    selected(): LocationQuery {
        return new LocationQuery(super.generic_selected(), this.g);
    }
    filter(filter: (d: any) => boolean): LocationQuery {
        return new LocationQuery(super.generic_filter(filter), this.g);
    }
    presentIn(t1: Time, t2: Time): LocationQuery {
        return new LocationQuery(super.generic_presentIn(t1, t2), this.g);
    }
    sort(attributeName: string): LocationQuery {
        return <LocationQuery>super.generic_sort(attributeName);
    }

    // returns the i-th element in this query
    get(i: number): Location { return this.g._locations[this._elements[i]] }

    last(): Location { return this.g._locations[this._elements[this._elements.length - 1]] }

    // return array of locations
    toArray(): Location[] {
        const a: Location[] = [];
        for (let i = 0; i < this._elements.length; i++) {
            a.push(this.g._locations[this._elements[i]]);
        }
        return a;
    }
    createAttribute(attrName: string, f: (l: Location) => void): LocationQuery {
        // create and init new attribute array if necessary
        if ((this.g.locationArrays as any)[attrName] == undefined) {
            (this.g.locationArrays as any)[attrName] = []
            for (let i = 0; i < this.g._locations.length; i++) {
                (this.g.locationArrays as any)[attrName].push();
            }
        }
        for (let i = 0; i < this._elements.length; i++) {
            (this.g.locationArrays as any)[attrName][this._elements[i]] = f(this.g._locations[this._elements[i]]);
        }
        return this;
    }

    intersection(q: LocationQuery): LocationQuery {
        return new LocationQuery(this.generic_intersection(q)._elements, this.g);
    }
    removeDuplicates(): LocationQuery {
        return new LocationQuery(this.generic_removeDuplicates()._elements, this.g);
    }
    forEach(f: (l: Location | undefined, i: number) => any): LocationQuery {
        for (let i = 0; i < this._elements.length; i++) {
            f(this.g.location(this._elements[i]), i);
        }
        return this;
    }

}

/**
 * Represents a simple array of numbers that can be used to calculate
 * max, mean, min values etc..
 */
export class NumberQuery extends Query {


    clone(): number[] {
        return this._elements.slice(0);
    }

    min(): number {
        this._elements = this.makeNumbers(this._elements);
        let min: number = parseInt(this._elements[0]+'');
        for (let i = 1; i < this._elements.length; i++) {
            if (this._elements[i] != undefined)
                min = Math.min(min, parseInt(this._elements[i]+''));
        }
        return min;
    }
    max(): number {
        let max: number = parseInt(this._elements[0]+'');
        for (let i = 1; i < this._elements.length; i++) {
            if (this._elements[i] != undefined)
                max = Math.max(max,  parseInt(this._elements[i]+''));
        }
        return max;
    }
    mean(): number {
        this._elements = this.makeNumbers(this._elements);
        let v = 0;
        let count = 0;
        for (let i = 0; i < this._elements.length; i++) {
            if (typeof this._elements[i] == 'number') {
                v += parseInt(this._elements[i]+'');
                count++;
            }
        }
        return v / count;
    }
    sum(): number {
        let sum = 0;
        for (let i = 0; i < this._elements.length; i++) {
            if (typeof this._elements[i] == 'number') {
                sum += parseInt(this._elements[i]+'');
            }
        }
        return sum;
    }

    toArray(): number[] {
        return this._elements.slice(0);
    }

    get(index: number): number {
        return this._elements[index];
    }

    forEach(f: (n: number, i: number) => any): NumberQuery {
        for (let i = 0; i < this._elements.length; i++) {
            f(this._elements[i], i);
        }
        return this;
    }
    
    makeNumbers(elements:number[]): number[] 
    {
        if(elements && elements.length > 0){
            const first = elements[0]
            if(typeof first == 'string'){
                const numberElements:number[] = []
                for (let i = 0; i < elements.length; i++){
                    numberElements.push(parseFloat(elements[i]+''))
                }
                console.log('string array converted', numberElements)
                return numberElements;
            }
        }

        return elements;
    }

}


export class Location extends BasicElement {

    constructor(id: number, graph: DynamicGraph) {
        super(id, 'location', graph)
    }

    // SPECIFIC ATTRIBUTE QUERIES

    label(): string { return this.attr('label') + ''; }
    longitude(): number { return this.attr('longitude'); }
    latitude(): number { return this.attr('latitude'); }
    x(): number { return this.attr('x'); }
    y(): number { return this.attr('y'); }
    z(): number { return this.attr('z'); }
    radius(): number { return this.attr('radius'); }

}

export class NodePairQuery extends GraphElementQuery {
    //elementType = 'nodePair';

    constructor(elements: any[], g: DynamicGraph) {
        super(elements, g, 'nodePair');
        //this.elementType = 'nodePair';
        if (elements.length > 0 && elements[0] instanceof NodePair) {
            this._elements = []
            for (let i = 0; i < elements.length; i++) {
                this._elements.push(elements[i].id());
            }
        }
        if (elements.length > 0 && typeof elements[0] == 'number') {
            this._elements = []
            for (let i = 0; i < elements.length; i++) {
                this._elements.push(elements[i]);
            }
        }
    }

    contains(n: NodePair): boolean {
        return this._elements.indexOf(n.id()) > -1;
    }


    highlighted(): NodePairQuery {
        return new NodePairQuery(super.generic_highlighted(), this.g);
    }
    visible(): NodePairQuery {
        return new NodePairQuery(super.generic_visible(), this.g);
    }
    selected(): NodePairQuery {
        return new NodePairQuery(super.generic_selected(), this.g);
    }
    filter(filter: (d: any) => boolean): NodePairQuery {
        return new NodePairQuery(super.generic_filter(filter), this.g);
    }
    presentIn(t1: Time, t2: Time): NodePairQuery {
        return new NodePairQuery(super.generic_presentIn(t1, t2), this.g);
    }
    sort(attributeName: string): NodePairQuery {
        return <NodePairQuery>super.generic_sort(attributeName);
    }

    // returns the i-th element in this query
    get(i: number): NodePair { return this.g._nodePairs[this._elements[i]] }

    last(): Link { return this.g._links[this._elements[this._elements.length - 1]] }

    // returns array of NodePair
    toArray(): NodePair[] {
        const a: NodePair[] = [];
        for (let i = 0; i < this._elements.length; i++) {
            a.push(this.g._nodePairs[this._elements[i]]);
        }
        return a;
    }
    createAttribute(attrName: string, f: (np: NodePair) => void): NodePairQuery {
        // create and init new attribute array if necessary
        if ((this.g.nodePairArrays as any)[attrName] == undefined) {
            (this.g.nodePairArrays as any)[attrName] = []
            for (let i = 0; i < this.g._nodePairs.length; i++) {
                (this.g.nodePairArrays as any)[attrName].push();
            }
        }
        for (let i = 0; i < this._elements.length; i++) {
            (this.g.nodePairArrays as any)[attrName][this._elements[i]] = f(this.g._nodePairs[this._elements[i]]);
        }
        return this;
    }
    intersection(q: NodePairQuery): NodePairQuery {
        return new NodePairQuery(this.generic_intersection(q)._elements, this.g);
    }
    removeDuplicates(): NodePairQuery {
        return new NodePairQuery(this.generic_removeDuplicates()._elements, this.g);
    }
    forEach(f: (np: NodePair | undefined, i: number) => any): NodePairQuery {
        for (let i = 0; i < this._elements.length; i++) {
            f(this.g.nodePair(this._elements[i]), i);
        }
        return this;
    }

}

export class NodePair extends BasicElement {

    constructor(id: number, graph: DynamicGraph) {
        super(id, 'nodePair', graph)
    }


    // SPECIFIC ATTRIBUTE QUERIES

    get source(): Node { return this.g._nodes[this.attr('source')]; }
    get target(): Node { return this.g._nodes[this.attr('target')]; }
    links(): LinkQuery { return new LinkQuery(this.attr('links'), this.g); }
    nodeType(): string { return this.attr('nodeType'); }

    presentIn(start: Time, end?: Time): boolean {
        for (let i = 0; i < this.links.length; i++) {
            if ((this.links as any)[i].presentIn(start, end))
                return true;
        }
        return false;
    }
}

export class StringQuery {
    _elements: string[];

    constructor(elements?: string[]) {
        if (elements)
            this._elements = elements.slice(0);
        else
            this._elements = []; // INIT WHEN ELEMENTS DOESN'T EXIST
    }
    contains(element: string): boolean {
        return this._elements.indexOf(element) > -1;
    }

    addUnique(element: string): void {
        if (this._elements.indexOf(element) == -1)
            this._elements.push(element);
    }
    add(element: string): void {
        this._elements.push(element);
    }
    addAll(elements: string[]): void {
        for (let i = 0; i < elements.length; i++) {
            if (elements[i] != undefined)
                this._elements.push(elements[i]);
        }
    }
    addAllUnique(elements: string[]): void {
        for (let i = 0; i < elements.length; i++) {
            this.addUnique(elements[i]);
        }
    }

    get length(): number { return this._elements.length }
    size(): number { return this._elements.length }

    toArray(): string[] {
        return this._elements.slice(0);
    }
    forEach(f: (s: string, i: number) => void): StringQuery {
        for (let i = 0; i < this._elements.length; i++) {
            f(this._elements[i], i);
        }
        return this;
    }

}

function getBulkAttributes(attrName: string, ids: number[], type: string, g: DynamicGraph, t1?: Time, t2?: Time): any[] {
    let a: any[] = [];
    let temp: any[];
    for (let i = 0; i < ids.length; i++) {
        if (t2 != undefined && t1 != undefined) {
            temp = (<ScalarTimeSeries<number>>g.attr(attrName, ids[i], type)).period(t1, t2).toArray();
        } else
            if (t1 != undefined) {
                temp = [(<ScalarTimeSeries<number>>g.attr(attrName, ids[i], type)).get(t1)];
            } else {
                temp = (<ScalarTimeSeries<number>>g.attr(attrName, ids[i], type)).toArray();
            }
        for (let j = 0; j < temp.length; j++) {
            if (temp[j] instanceof Array) {
                a = a.concat(temp[j]);
            } else {
                if (a.indexOf(temp[j]) == -1)
                    a.push(temp[j]);
            }
        }
    }
    return a;
}

export class NodeQuery extends GraphElementQuery {
    // elementType = 'node';

    constructor(elements: any[], g: DynamicGraph) {
        super(elements, g, 'node');
        if (elements.length > 0 && elements[0] instanceof Node) {
            this._elements = []
            for (let i = 0; i < elements.length; i++) {
                this._elements.push(elements[i].id());
            }
        } else
            if (elements.length > 0 && typeof elements[0] == 'number') {
                this._elements = []
                for (let i = 0; i < elements.length; i++) {
                    this._elements.push(elements[i]);
                }
            }
        // this.elementType = 'node';
    }

    contains(n: Node): boolean {
        return this._elements.indexOf(n.id()) > -1;
    }


    // WRAPPERS TO GENERIC FUNCTIONS IN GRAPH_ELEMENT_QUERY
    highlighted(): NodeQuery {
        return new NodeQuery(super.generic_highlighted(), this.g);
    }
    visible(): NodeQuery {
        return new NodeQuery(super.generic_visible(), this.g);
    }
    selected(): NodeQuery {
        return new NodeQuery(super.generic_selected(), this.g);
    }
    filter(filter: (d: any) => boolean): NodeQuery {
        return new NodeQuery(super.generic_filter(filter), this.g);
    }
    presentIn(t1: Time, t2: Time): NodeQuery {
        return new NodeQuery(super.generic_presentIn(t1, t2), this.g);
    }
    sort(attributeName: string, asc?: boolean): NodeQuery {
        return <NodeQuery>super.generic_sort(attributeName, asc);
    }

    // proper functions

    label(): StringQuery {
        const q: StringQuery = new StringQuery();
        for (let i = 0; i < this._elements.length; i++) {
            q.add('' + this.g.attr('label', this._elements[i], 'node'))
        }
        return q;
    }
    neighbors(t1?: Time, t2?: Time): NodeQuery {
        return new NodeQuery(getBulkAttributes('neighbors', this._elements, 'node', this.g, t1, t2), this.g);
    }
    links(t1?: Time, t2?: Time): LinkQuery {
        return new LinkQuery(getBulkAttributes('links', this._elements, 'node', this.g, t1, t2), this.g);
    }
    locations(t1?: Time, t2?: Time): LocationQuery {
        return new LocationQuery(getBulkAttributes('locations', this._elements, 'node', this.g, t1, t2), this.g);
    }
    nodeTypes(): StringQuery {
        const q: StringQuery = new StringQuery();
        for (let i = 0; i < this._elements.length; i++) {
            q.add(this.g.attr('nodeType', this._elements[i], 'node'))
        }
        return q;
    }

    // returns the i-th element in this query
    get(i: number): Node { return this.g._nodes[this._elements[i]] }

    last(): Node { return this.g._nodes[this._elements[this._elements.length - 1]] }

    // returns array of nodes
    toArray(): Node[] {
        const a: Node[] = [];
        for (let i = 0; i < this._elements.length; i++) {
            a.push(this.g._nodes[this._elements[i]]);
        }
        return a;
    }
    createAttribute(attrName: string, f: (n: Node) => any): NodeQuery {
        // create and init news attribute array if necessary
        if ((this.g.nodeArrays as any)[attrName] == undefined) {
            (this.g.nodeArrays as any)[attrName] = []
            for (let i = 0; i < this.g._nodes.length; i++) {
                (this.g.nodeArrays as any)[attrName].push();
            }
        }
        for (let i = 0; i < this._elements.length; i++) {
            (this.g.nodeArrays as any)[attrName][this._elements[i]] = f(this.g._nodes[this._elements[i]]);
        }
        return this;
    }

    intersection(q: NodeQuery): NodeQuery {
        return new NodeQuery(this.generic_intersection(q)._elements, this.g);
    }
    removeDuplicates(): NodeQuery {
        return new NodeQuery(this.generic_removeDuplicates()._elements, this.g);
    }

    forEach(f: (n: Node | undefined, i: number) => void): NodeQuery {
        for (let i = 0; i < this._elements.length; i++) {
            f(this.g.node(this._elements[i]), i);
        }
        return this;
    }

}


/**
 * Represents a node object
 */
export class Node extends BasicElement {

    constructor(id: number, graph: DynamicGraph) {
        super(id, 'node', graph)
    }


    // SPECIFIC ATTRIBUTE QUERIES

    /** @returns this node's label, specified by the user.
     * If no string value was delivered by the user, returns the ID as string.
     */
    label(): string { return '' + this.attr('label'); }

    shape(): string { return '' + this.attr('shape');}

    color(): string { return '' + this.attr('color');}

    nodeType(): string { return this.attr('nodeType') }

    /** Returns this nodes neighbors in a NodeQuery. No duplicates.
     * If no parameter is supplied, returns *all* neighbors of this
     * node over all time steps.
     * @param t1 - start time. If only this parameter is specified, returns
     * neighbors in this time step only.
     * @param t2 - end time. If this parameter is specified, returns
     * neighbors between t1 and t2.
    */
    neighbors(t1?: Time, t2?: Time): NodeQuery {
        if (t2 != undefined && t1 != undefined) {
            return new NodeQuery((<ArrayTimeSeries<number>>this.attr('neighbors')).period(t1, t2).toFlatArray(true), this.g);
        }
        if (t1 != undefined) {
            return new NodeQuery((<ArrayTimeSeries<number>>this.attr('neighbors')).get(t1), this.g);
        }
        return new NodeQuery((<ArrayTimeSeries<number>>this.attr('neighbors')).toFlatArray(), this.g);
    }
    inNeighbors(t1?: Time, t2?: Time): NodeQuery {
        if (t2 != undefined && t1 != undefined) {
            return new NodeQuery((<ArrayTimeSeries<number>>this.attr('inNeighbors')).period(t1, t2).toFlatArray(true), this.g);
        }
        if (t1 != undefined) {
            return new NodeQuery((<ArrayTimeSeries<number>>this.attr('inNeighbors')).get(t1), this.g);
        }
        return new NodeQuery((<ArrayTimeSeries<number>>this.attr('inNeighbors')).toFlatArray(true), this.g);
    }
    outNeighbors(t1?: Time, t2?: Time): NodeQuery {
        if (t2 != undefined && t1 != undefined) {
            return new NodeQuery((<ArrayTimeSeries<number>>this.attr('outNeighbors')).period(t1, t2).toFlatArray(true), this.g);
        }
        if (t1 != undefined) {
            return new NodeQuery((<ArrayTimeSeries<number>>this.attr('outNeighbors')).get(t1), this.g);
        }
        return new NodeQuery((<ArrayTimeSeries<number>>this.attr('outNeighbors')).toFlatArray(), this.g);
    }
    links(t1?: Time, t2?: Time): LinkQuery {
        if (t2 != undefined && t1 != undefined) {
            return new LinkQuery((<ArrayTimeSeries<number>>this.attr('links')).period(t1, t2).toFlatArray(true), this.g);
        }
        if (t1 != undefined) {
            return new LinkQuery((<ArrayTimeSeries<number>>this.attr('links')).get(t1), this.g);
        }
        return new LinkQuery((<ArrayTimeSeries<number>>this.attr('links')).toFlatArray(true), this.g);
    }
    inLinks(t1?: Time, t2?: Time): LinkQuery {
        if (t2 != undefined && t1 != undefined) {
            return new LinkQuery((<ArrayTimeSeries<number>>this.attr('inLinks')).period(t1, t2).toFlatArray(true), this.g);
        }
        if (t1 != undefined) {
            return new LinkQuery((<ArrayTimeSeries<number>>this.attr('inLinks')).get(t1), this.g);
        }
        return new LinkQuery((<ArrayTimeSeries<number>>this.attr('inLinks')).toFlatArray(true), this.g);
    }
    outLinks(t1?: Time, t2?: Time): LinkQuery {
        if (t2 != undefined && t1 != undefined) {
            return new LinkQuery((<ArrayTimeSeries<number>>this.attr('outLinks')).period(t1, t2).toFlatArray(true), this.g);
        }
        if (t1 != undefined) {
            return new LinkQuery((<ArrayTimeSeries<number>>this.attr('outLinks')).get(t1), this.g);
        }
        return new LinkQuery((<ArrayTimeSeries<number>>this.attr('outLinks')).toFlatArray(true), this.g);
    }
    locations(t1?: Time, t2?: Time): LocationQuery {
        if (t2 != undefined && t1 != undefined) {
            return new LocationQuery((<ScalarTimeSeries<number>>this.attr('locations')).period(t1, t2).toArray(), this.g);
        }
        if (t1 != undefined) {
            return new LocationQuery([(<ScalarTimeSeries<number>>this.attr('locations')).get(t1)], this.g);
        }
        return new LocationQuery((<ScalarTimeSeries<number>>this.attr('locations')).toArray(), this.g);
    }
    locationSerie(t1?: Time, t2?: Time): ScalarTimeSeries<Location> {
        let serie: ScalarTimeSeries<number>;
        if (t2 != undefined && t1 != undefined)
            serie = (<ScalarTimeSeries<number>>this.attr('locations')).period(t1, t2);
            // return this.attr('locations').period(t1, t2);
        else if (t1 != undefined)
            serie = (<ScalarTimeSeries<number>>(this.attr('locations')).get(t1));
            // return this.attr('locations').get(t1);
        else
            serie = (<ScalarTimeSeries<number>>this.attr('locations'));
            // return this.attr('locations');

        const serie2 = serie.getSerie();
        // replace numbers by locations
        const serie3 = new ScalarTimeSeries<Location>();
        for (const t in serie2) {
            const time = this.g.time(parseInt(t));
            const location = this.g.location((serie2 as any)[t]);
            if (time != undefined && location != undefined) {
                serie3.set(time, location);
            }
        }
        return serie3;
    }


    linksBetween(n: Node): LinkQuery {
        const links = this.links().toArray();
        const finalLinks = []
        let l
        for (let i = 0; i < links.length; i++) {
            l = links[i]
            if (l.source == n || l.target == n)
                finalLinks.push(l)
        }
        return new LinkQuery(finalLinks, this.g);

    }


    // TODO
    // presentIn(start: Time, end?: Time): boolean {
    //     // TODO, consider present times for nodes.
    //     return true;
    // }
}


export class LinkQuery extends GraphElementQuery {
    //elementType = 'link';

    constructor(elements: any[], g: DynamicGraph) {
        super(elements, g, 'link');
        if (elements.length > 0 && elements[0] instanceof Link) {
            this._elements = []
            for (let i = 0; i < elements.length; i++) {
                this._elements.push(elements[i].id());
            }
        }
        if (elements.length > 0 && typeof elements[0] == 'number') {
            this._elements = []
            for (let i = 0; i < elements.length; i++) {
                this._elements.push(elements[i]);
            }
        }
    }

    contains(l: Link): boolean {
        return this._elements.indexOf(l.id()) > -1;
    }

    highlighted(): LinkQuery {
        return new LinkQuery(super.generic_highlighted(), this.g);
    }
    visible(): LinkQuery {
        return new LinkQuery(super.generic_visible(), this.g);
    }
    selected(): LinkQuery {
        return new LinkQuery(super.generic_selected(), this.g);
    }
    filter(filter: (d: any) => boolean): LinkQuery {
        return new LinkQuery(super.generic_filter(filter), this.g);
    }
    presentIn(t1: Time, t2?: Time): LinkQuery {
        return new LinkQuery(super.generic_presentIn(t1, t2), this.g);
    }
    sort(attributeName: string): LinkQuery {
        return <LinkQuery>super.generic_sort(attributeName);
    }

    // returns the i-th element in this query
    get(i: number): Link { return this.g._links[this._elements[i]] }

    last(): Link { return this.g._links[this._elements[this._elements.length - 1]] }

    // returns array of links
    toArray(): Link[] {
        const a: Link[] = [];
        for (let i = 0; i < this._elements.length; i++) {
            a.push(this.g._links[this._elements[i]]);
        }
        return a;
    }

    weights(start?: Time, end?: Time): NumberQuery {
        const s: NumberQuery = new NumberQuery();
        for (let i = 0; i < this._elements.length; i++) {
            const gLink = this.g.link(i);
            if (gLink != undefined)
                s.addAll(gLink.weights(start, end).toArray());
            // ELSE ???
        }
        return s;
    }

    createAttribute(attrName: string, f: (link: Link) => any): LinkQuery {
        // create and init new attribute array if necessary
        if ((this.g.linkArrays as any)[attrName] == undefined) {
            (this.g.linkArrays as any)[attrName] = []
            for (let i = 0; i < this.g._links.length; i++) {
                (this.g.linkArrays as any)[attrName].push();
            }
        }
        for (let i = 0; i < this._elements.length; i++) {
            (this.g.linkArrays as any)[attrName][this._elements[i]] = f(this.g._links[this._elements[i]]);
        }
        return this;
    }
    linkTypes(): string[] {
        const linkTypes: string[] = [];
        let s;
        for (let i = 0; i < this._elements.length; i++) {
            const gLink = this.g.link(this._elements[i]);
            if (gLink != undefined) {
                s = gLink.linkType();
                if (linkTypes.indexOf(s) == -1)
                    linkTypes.push(s);
            }
            // ELSE ??
        }
        return linkTypes;
    }

    sources(): NodeQuery {
        const nodes: number[] = []
        let link;
        for (let i = 0; i < this._elements.length; i++) {
            link = this.g.link(this._elements[i]);
            if (link != undefined) { // UNDEFINED??
                if (nodes.indexOf(link.source.id()) == -1) // ID??
                    nodes.push(link.source.id());
            }
        }
        return new NodeQuery(nodes, this.g);
    }

    targets(): NodeQuery {
        const nodes: number[] = []
        let link;
        for (let i = 0; i < this._elements.length; i++) {
            link = this.g.link(this._elements[i]);
            if (link != undefined) { // UNDEFINED??
                if (nodes.indexOf(link.target.id()) == -1) // ID??
                    nodes.push(link.target.id());
            }
        }
        return new NodeQuery(nodes, this.g);
    }

    intersection(q: LinkQuery): LinkQuery {
        return new LinkQuery(this.generic_intersection(q)._elements, this.g);
    }
    removeDuplicates(): LinkQuery {
        return new LinkQuery(this.generic_removeDuplicates()._elements, this.g);
    }
    forEach(f: (link: Link | undefined, i: number) => void): LinkQuery {
        for (let i = 0; i < this._elements.length; i++) {
            f(this.g.link(this._elements[i]), i);
        }
        return this;
    }

}

/**
  * Represents a link object on a WindowGraph
  */
export class Link extends BasicElement {

    targetNPO: any = undefined;
    sourceNPO: any = undefined;
    constructor(id: number, graph: DynamicGraph) {
        super(id, 'link', graph)
    }

    // SPECIFIC ATTRIBUTE QUERIES

    linkType(): string { return this.attr('linkType'); }
    get source(): Node { return this.g._nodes[this.attr('source')]; }
    get target(): Node { return this.g._nodes[this.attr('target')]; }
    nodePair(): NodePair { return this.g._nodePairs[this.attr('nodePair')]; }
    directed(): boolean { return this.attr('directed'); }

    other(n: Node): Node {
        return this.source == n ? this.target : this.source;
    }

    /** Returns this link's weights over time as NumberQuery
    * If no time parameter is supplied, returns *all* weights of this
     * link over all time steps.
     * @param t1 - start time. If only this parameter is specified, returns
     * only the value for t1.
     * @param t2 - end time. If this parameter is specified, returns
     * weights between t1 and t2.
    */
    weights(start?: Time, end?: Time): NumberQuery {
        if (start == undefined)
            return new NumberQuery((<ScalarTimeSeries<number>>this.attr('weights')).toArray());
        if (end == undefined)
            return new NumberQuery([(<ScalarTimeSeries<number>>this.attr('weights')).get(start)]);
        return new NumberQuery((<ScalarTimeSeries<number>>this.attr('weights')).period(start, end).toArray());
    }

    presentIn(start: Time, end?: Time): boolean {
        const presence: number[] = this.weights(start, end).toArray();
        return presence.length > 0;
    }
    /** Returns all times in which this link's weight != 0  */
    times(): TimeQuery {
        // var weights:ScalarTimeSeries<number> = <ScalarTimeSeries<number>>this.attr('weights');
        // var times = []
        // var allTimes = this.g.times().toArray();
        // for(var t in weights.serie){
        //     times.push(allTimes[parseInt(t)]);
        // }
        return new TimeQuery(this.attr('presence'), this.g);
    }


}

export class LinkType implements LegendElement {
    id: number;
    name: string;
    color: string;
    constructor(id: number, name: string, color: string) {
        this.id = id;
        this.name = name;
        this.color = color;
    }
}

/* Moved from utils to dynamicgraph to eliminate circular dependency */
/* used by dynamicgraph, but not used none of utils*/

export function attributeSort(a: BasicElement, b: BasicElement, attributeName: string, asc?: boolean): number {
    const value = a.attr(attributeName);
    let result;
    if (typeof value == 'string') {
        result = a.attr(attributeName).localeCompare(b.attr(attributeName));
    }
    else if (typeof value == 'number') {
        result = b.attr(attributeName) - a.attr(attributeName);
    } else {
        result = 0;
    }

    if (asc == false) {
        result = -result;
    }
    return result;
}

/* moved from utils to dynamicgraph */
export class IDCompound {
    nodeIds: number[] = [];
    linkIds: number[] = [];
    timeIds: number[] = [];
    nodePairIds: number[] = [];
    locationIds: number[] = [];
}

export interface LegendElement {
    name: string;
    color: string;
}

/******** MOVED FROM UTILS TO DYNAMICGRAPH *********/

export function copyPropsShallow(source: any, target: any): any {
    for (const p in source) {
        if (Object.prototype.hasOwnProperty.call(source, p))
            target[p] = source[p];
    }
    return target;
}

export function copyTimeseriesPropsShallow(source: any, target: any): any {
    for (const q in source) {
        if (Object.prototype.hasOwnProperty.call(source, q)) {
            for (const p in source[q]) {
                if (Object.prototype.hasOwnProperty.call(source[q], p)) {
                    target[q][p] = source[q][p];
                }
            }
        }
    }
    return target;
}

export function copyTimeSeries<TElement>(arr: any[], ctorFunc: () => TElement): TElement[] {
    const arrayClone: TElement[] = [];
    for (const elem in arr) {
        arrayClone.push(copyTimeseriesPropsShallow(arr[elem], ctorFunc()));
    }
    return arrayClone;
}

export function compareTypesDeep(a: any, b: any, depth: number): boolean {
    let result = true;
    if (a == null || b == null)
        return a == b;
    if (typeof a != typeof b)
        return false;
    else if (typeof a != 'object')
        return true;
    else if (a.constructor !== b.constructor)
        return false;
    else {
        if (depth > 0) {
            for (const key in a) {
                if (key in b
                    && Object.prototype.hasOwnProperty.call(a, key)
                    && Object.prototype.hasOwnProperty.call(b, key)
                    && !compareTypesDeep(a[key], b[key], depth - 1)) {
                    console.log("compareFailed for key", key, a[key], b[key]);
                    result = false;
                }
            }
        }
        return result;
    }
}

export function sortNumber(a: number, b: number): number {
    return a - b;
}

export function array(value: any, size: number): any[] {
    const array: any[] = []
    while (size--) array[size] = value;
    return array;
}

export function doubleArray(size1: number, size2?: number, value?: any): any[] {
    const array: any[] = []
    if (value == undefined)
        value = []
    const a: any[] = [];

    if (size2) {
        while (size2--) a[size2] = value;
    }
    while (size1--) array[size1] = a.slice(0);

    return array;
}

/********* MOVED FROM DATAMANAGER TO DYNAMICGRAPH **********/

export interface DataManagerOptions {
    keepOnlyOneSession: boolean;
}

export class DataManager {

    constructor(options?: DataManagerOptions) {
        if (options) {
            // initialize stuff differently here
            if (options.keepOnlyOneSession)
                this.setOptions(options);
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
    session = '';

    sessionDataPrefix = "ncubesession";
    // sessionDataPrefix: string = "";

    clearSessionData(session: string): void {
        const searchPrefix = this.sessionDataPrefix + this.SEP + session;
        // var searchPrefix = session;
        const keysToClear: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            if (key.indexOf(searchPrefix) == 0)
                keysToClear.push(key);
            // these are the old keys that we used to store before we
            // added support for multiple sessions
            else if (key.indexOf('connectoscope1') == 0)
                keysToClear.push(key);
        }
        for (let i = 0; i < keysToClear.length; i++) {
            const k = keysToClear[i];
            localStorage.removeItem(k);
        }
    }

    clearAllSessionData(): void {
        this.clearSessionData('');
    }

    isSessionCached(session: string, dataSetName: string): boolean {
        const prefix = this.sessionDataPrefix + this.SEP + session + this.SEP + dataSetName;
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
            console.log('Empty tables. No data imported.')
            return;
        }

        if (!data.nodeTable) {
            console.log('[n3] Node table missing!')
        }
        if (!data.linkTable) {
            console.log('[n3] Link table missing!')
        }
        if (!data.nodeSchema) {
            console.log('[n3] Node schema missing!')
        }
        if (!data.linkSchema) {
            console.log('[n3] Link schema missing!')
        }

        // format data
        for (let i = 0; i < data.nodeTable.length; i++) {
            for (let j = 0; j < data.nodeTable[i].length; j++) {
                if (typeof data.nodeTable[i][j] == 'string')
                    data.nodeTable[i][j] = data.nodeTable[i][j].trim();
            }
        }
        for (let i = 0; i < data.linkTable.length; i++) {
            for (let j = 0; j < data.linkTable[i].length; j++) {
                if (typeof data.linkTable[i][j] == 'string')
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
            console.log('data is well-schematized, caching dynamicGraph');
            // in order to ensure that we have enough quota, we only keep one session
            // cached at a time.
            if (this.keepOnlyOneSession)
                this.clearAllSessionData();

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
            console.log('data is not well-schematized, so not caching dynamicGraph');
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
    saveToStorage<T>(dataName: string, valueName: string, value: T, replacer?: (key: string, value: any) => any): void {
        if (value == undefined) {
            console.log('attempting to save undefined value. aborting', dataName, valueName);
            return;
        }
        const stringifyResult = JSON.stringify(value, replacer);

        let stringToSave;
        if (stringifyResult.length > 1024 * 1024 * 4)
            stringToSave = LZString.compress(stringifyResult);
        else
            stringToSave = stringifyResult;

        localStorage[this.sessionDataPrefix + this.SEP
            + this.session
            + this.SEP + dataName
            + this.SEP + valueName] = stringToSave;
    }

    getFromStorage<TResult>(
        dataName: string,
        valueName: string,
        reviver?: (key: any, value: any, state: any) => any,
        state?: any): TResult | undefined { // : TResult

        console.assert(this.session != '');

        let statefulReviver;
        if (reviver)
            statefulReviver = function (key: any, value: any): any {
                return reviver(key, value, state);
            };
        else
            statefulReviver = undefined;

        const storedResult = localStorage[
            this.sessionDataPrefix
            + this.SEP + this.session
            + this.SEP + dataName
            + this.SEP + valueName];


        if (storedResult && storedResult != "undefined") {
            // we try to detect whether the string was compressed or not. Given that it is
            // JSON, we would expect it to begin with either a quote, a bracket, or a curly-brace
            let parseText;
            if(storedResult == "true"){
                parseText = true;
            }
            else if(storedResult == "false"){
                parseText = false;
            }
            else if ("\"'[{0123456789".indexOf(storedResult[0]) >= 0)
                parseText = storedResult;
            else
                parseText = LZString.decompress(storedResult);

            return <TResult>JSON.parse(parseText, statefulReviver);
        }
        else {
            return undefined;
        }
    }

    removeFromStorage(dataName: string, valueName: string): void {
        localStorage.removeItem(this.sessionDataPrefix
            + this.SEP + this.session
            + this.SEP + dataName
            + this.SEP + valueName);
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
        console.log('isSchemaWellDefined');
        if (data.locationTable && !isValidIndex(data.locationSchema.id))
            return false;
        if (data.nodeTable.length > 0 && !isValidIndex(data.nodeSchema.id))
            return false;
        if (data.linkTable.length > 0
            && !(isValidIndex(data.linkSchema.id)
                && isValidIndex(data.linkSchema.source)
                && isValidIndex(data.linkSchema.target)))
            return false;

        return true;
    }
}
