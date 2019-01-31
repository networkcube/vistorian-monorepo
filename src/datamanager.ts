// namespace networkcube {


/* moved from utils to datamanager */
export function isValidIndex(v: number | undefined): boolean {
    return v != undefined && v > -1;
}

/* moved from dynamicgraph to datamanager */
export class Selection {
    name: string;
    elementIds: number[];
    acceptedType: string;
    color: string = "#3366cc"; // INIT??
    id: number;
    showColor: boolean = true;
    filter: boolean = false;
    priority: number = 0;

    constructor(id: number, acceptedType: string) {
        this.id = id;
        this.name = 'Selection-' + this.id
        this.elementIds = [];
        this.acceptedType = acceptedType;
        this.priority = id;
    }

    acceptsType(type: string) {
        return this.acceptedType == type;
    }
}

// data set / graph with name
export class DataSet {
    name: string;
    nodeTable: any[];
    linkTable: any[];
    locationTable: any[] = [];
    nodeSchema: NodeSchema;
    linkSchema: LinkSchema;
    locationSchema: LocationSchema;
    selections: Selection[] = [] //predefined selections (not link type)

    timeFormat: string = ''; // INIT?????????????

    // constructor(name:string, nodeTable:any[], linkTable:any[], nodeSchema:NodeSchema, linkSchema:LinkSchema, locationTable?:any, locationSchema?:LocationSchema){
    constructor(params: any) { // before without any
        this.name = params.name;
        this.nodeTable = params.nodeTable;
        this.linkTable = params.linkTable;

        if (params.nodeSchema == undefined)
            this.nodeSchema = getDefaultNodeSchema();
        else
            this.nodeSchema = params.nodeSchema;

        if (params.linkSchema == undefined)
            this.linkSchema = getDefaultLinkSchema();
        else
            this.linkSchema = params.linkSchema;

        if (params.locationTable != undefined)
            this.locationTable = params.locationTable;

        if (params.locationSchema == undefined)
            this.locationSchema = getDefaultLocationSchema();
        else
            this.locationSchema = params.locationSchema;

        console.log('[n3] data set created', this);
    }
}

export function getDefaultNodeSchema(): NodeSchema {
    return new NodeSchema(0);
}
export function getDefaultLinkSchema(): LinkSchema {
    return new LinkSchema(0, 1, 2);
}
export function getDefaultLocationSchema(): LocationSchema {
    return new LocationSchema(0, 1, 2, 3, 4, 5, 6, 7, 8);
}

export class TableSchema {
    name: string;
    constructor(name: string) {
        this.name = name;
    }
}

// default node schema for node table
export class NodeSchema extends TableSchema {
    id: number;
    /* INIT ?????????????????? */
    label: number = -1;
    time: number = -1;
    location: number = -1;
    nodeType: number = -1;
    constructor(id: number) {
        super('nodeSchema');
        this.id = id;
    }
}

// default node schema for link table
export class LinkSchema extends TableSchema {
    id: number;
    source: number;
    target: number;
    weight: number = -1; // INIT????????
    linkType: number = -1;
    directed: number = -1;
    time: number = -1;
    constructor(id: number, source: number, target: number) {
        super('linkSchema');
        this.source = source;
        this.target = target;
        this.id = id;
    }
}
export class LocationSchema extends TableSchema {
    id: number;
    label: number; // user given label
    geoname: number = -1; // actual geo name (english)
    longitude: number = -1;
    latitude: number = -1;
    x: number = -1;
    y: number = -1;
    z: number = -1;
    radius: number = -1;

    constructor(
        id: number,
        label: number,
        geoname?: number,
        longitude?: number,
        latitude?: number,
        x?: number,
        y?: number,
        z?: number,
        radius?: number) {

        super('locationSchema');

        this.id = id;
        this.label = label;

        if (isValidIndex(geoname))
            this.geoname = geoname != undefined ? geoname : -1; // geoname never will be undefined at this point
        if (isValidIndex(longitude))
            this.longitude = longitude != undefined ? longitude : -1;
        if (isValidIndex(latitude))
            this.latitude = latitude != undefined ? latitude : -1;
        if (isValidIndex(x))
            this.x = x != undefined ? x : -1;
        if (isValidIndex(y))
            this.y = y != undefined ? y : -1;
        if (isValidIndex(z))
            this.z = z != undefined ? z : -1;
        if (isValidIndex(radius))
            this.radius = radius != undefined ? radius : -1;
    }
}
//}
