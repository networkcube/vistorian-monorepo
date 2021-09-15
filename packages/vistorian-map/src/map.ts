/// <reference path="./lib/google.maps.d.ts" />

/* Tried adding to tsconfig.json:
  "typeRoots": [
    "node_modules/@types"
  ]

 */

import * as d3 from "d3";

import * as dynamicgraph from 'vistorian-core/src/dynamicgraph';
import * as utils from 'vistorian-core/src/utils';
import * as main from 'vistorian-core/src/main';
import * as messenger from 'vistorian-core/src/messenger';

import * as ui from 'vistorian-core/src/ui';
import * as timeslider from 'vistorian-core/src/timeslider';

import * as moment from 'moment';

const COLOR_DEFAULT_LINK = '#999999';
const COLOR_DEFAULT_NODE = '#999999';
const COLOR_HIGHLIGHT = '#ff8800';
let LINK_OPACITY = 0.4;
let NODE_UNPOSITIONED_OPACITY = 0.4
let LINK_WIDTH_SCALE = 1;
const LOCATION_MARKER_WIDTH = 10;
let OVERLAP_FRACTION = 0.3;
const NODE_SIZE = 4;
const OUT_OF_TIME_NODES_OPACITY = 0;
const LABEL_OFFSET_X = 20;
const SHOW_NON_PLACE = true;
let LINK_GAP = 2;

const width: number = window.innerWidth
const height: number = window.innerHeight - 100;

interface Bounds {
    left: number;
    top: number;
}
const margin: Bounds = { left: 20, top: 20 };
const TIMELINE_HEIGHT = 50;
const MENU_HEIGHT = 50;

const dgraph: dynamicgraph.DynamicGraph = main.getDynamicGraph();
// get dynamic graph
const links: dynamicgraph.Link[] = dgraph.links().toArray();
const times: any[] = dgraph.times().toArray();
const locations: any[] = dgraph.locations().toArray();
for (let i = 0; i < locations.length; i++) {
    locations[i]['npos'] = [];
}
let time_start: any = dgraph.time(0); // BEFORE queries.Time
let time_end: any = dgraph.times().last(); // BEFORE queries.Time

// world map to show node positions
const mapCanvas: any = d3.select('#visDiv').node();
$(mapCanvas).css('width', '100%');
$(mapCanvas).css('height', $(window).height() - 60);

// one empty default nodeposition object for every node
// for the cases this node has no position at a given time.
const emptyNodePositions: any = {}

// VISUAL ELEMENTS
const nodePositionObjects: any[] = [];
const nodePositionObjectsLookupTable: any[] = [];

let geoMultiLinks:GeoMultiLink[] = [];

// class GeoLink extends dynamicgraph.Link{

//     GeoLink(){
//         super();
//     }
//     sourceNPO: NodePositionObject;
//     targetNPO: NodePositionObject;
// }

class GeoMultiLink{

    // private sourceNPOs: NodePositionObject[] = [];
    // private targetNPOs: NodePositionObject[] = [];
    private links:dynamicgraph.Link[] = []

    public numLinks()
    {
        return this.links.length;
    }
    public addLink(link:any)
    {
        if(this.links.indexOf(link) == -1)
        {
            this.links.push(link)
            link.geoMultiLink = this;
        }
    }
    public getLinks():dynamicgraph.Link[]{
        return this.links;
    }
    public linkIndex(l:any):number
    {
        return this.links.indexOf(l);
    }
} 

export class NodePositionObject {
    timeIds: number[] = [];
    location: any; // BEFORE queries.Location;
    node: any; // BEFORE queries.Node;
    x = 0; // INIT ?? 
    y = 0; // INIT ??
    xOrig = 0; // INIT ??
    yOrig = 0; // INIT ??
    geoPos: google.maps.LatLng = new google.maps.LatLng(0, 0); // INIT ??
    displaced = false; // INIT ??
    displacementVector: number[] = []; // INIT ??
    fixedPosition = true;
    inLinks: dynamicgraph.Link[] = [];
    outLinks: dynamicgraph.Link[] = [];
    inNeighbors: dynamicgraph.Node[] = [];
    outNeighbors: dynamicgraph.Node[] = [];
}

let overlay: any;
let map: any;


const linkWeightScale = d3.scaleLinear().range([0, 2]);
linkWeightScale.domain([
    0,
    dgraph.links().weights().max()
]);

messenger.setDefaultEventListener(updateEvent);

dgraph.nodes().toArray().forEach((n: any) => {
    n['width'] = n.attr('label').length * 5 + 10,
        n['height'] = 10;
})


const nodeSizeFunction: any = d3.scaleLinear()
    .domain([0, 100])
    .range([NODE_SIZE, NODE_SIZE])


// DRAW 
let svg: any;
let line: any;
let visualNodes: any;
let visualLinks: any;
let vNodeLabels: any;
let vNodeLabelBackgrounds: any;
let geoProjection: google.maps.MapCanvasProjection;
let layer: any;
let locationsPanelDiv: HTMLDivElement;


const locationDisplayTimeoutHandle: any = -1;
let prevIntersectedLink: any;
let prevIntersectedNode: any;
let intersectedLink: any;
let intersectedNode: any;
let prevDist: any;
let f: any;
const F = 1000;


messenger.addEventListener(messenger.MESSAGE_SET_STATE, setStateHandler);
messenger.addEventListener(messenger.MESSAGE_GET_STATE, getStateHandler);


// STYLING MAP
function init() {
    const mapOptions: any = {
        center: new google.maps.LatLng(48.8588589, 2.3470599),
        zoom: 5,
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: true,
        fullscreenControl: true,
        draggableCursor: 'cooperative',
        styles: [
            {
                "featureType": "landscape", "stylers": [
                    { "visibility": "off" }
                ]
            },
            {
                "featureType": "poi", "stylers": [
                    { "visibility": "off" }
                ]
            },
            {
                "featureType": "road.highway", "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road.arterial", "stylers": [
                    { "visibility": "off" }
                ]
            },
            {
                "featureType": "road.local", "stylers": [
                    { "visibility": "off" }
                ]
            },
            {
                "featureType": "transit", "stylers": [
                    { "visibility": "off" }
                ]
            },
            {
                "featureType": "administrative.province", "stylers": [
                    { "visibility": "off" }
                ]
            },
            {
                "featureType": "administrative.locality", "stylers": [
                    { "visibility": "off" }
                ]
            },
            {
                "featureType": "administrative.country",
                "elementType": "geometry.stroke",
                "stylers": [
                    { "lightness": 60 }
                ]
            },
            {
                "featureType": "water", "elementType": "labels", "stylers": [
                    { "visibility": "off" },
                ]
            },
            {
                "featureType": "water", "elementType": "geometry", "stylers": [
                    { "lightness": 100 },
                ]
            },
            {
                featureType: "administrative.country", elementType: "labels", stylers: [
                    { visibility: "off" }
                ]
            },
        ]
    };


    map = new google.maps.Map(mapCanvas, mapOptions);
    map.addListener('zoom_changed', function () {
        $('#weirdDiv').css('width', window.innerWidth * Math.random());
        $('#weirdDiv').parent().parent().css('width', window.innerWidth * Math.random());
        messenger.zoomInteraction("map","zoom");
    });

    const bcNode = new BroadcastChannel('row_hovered_over_node');
    bcNode.onmessage = function (ev) {
        updateNodes(ev.data.id);
    };

    const bcLink = new BroadcastChannel('row_hovered_over_link');
    bcLink.onmessage = function (ev) {
        updateLinks(ev.data.id);
    };

    let lastPanUpdate: number = window.performance.now();
    map.addListener('center_changed', function (e: any) {

        const current: any = window.performance.now();
        const delta: any = current - lastPanUpdate;
        if (delta < 1000) {
            const pps = (1000 / delta).toFixed(0);
        }
        lastPanUpdate = current;
        $('#weirdDiv').css('width', window.innerWidth * Math.random());
        $('#weirdDiv').parent().parent().css('width', window.innerWidth * Math.random());

        const northWest: any = { x: map.getBounds().getSouthWest().lng(), y: map.getBounds().getNorthEast().lat() }
        messenger.zoomInteraction("map","span");

    });

    // create overlay over googlemaps
    overlay = new google.maps.OverlayView();

    overlay.onAdd = function () {

        layer = document.createElement('div');
        $(layer).attr('id', 'weirdDiv');
        $(layer).css('width', '100%');
        locationsPanelDiv = document.createElement('div');
        $(locationsPanelDiv).attr('id', 'locationsPanel').addClass('hidden');

        this.getPanes().overlayLayer.appendChild(layer);
        this.getPanes().overlayLayer.appendChild(locationsPanelDiv);

        // setup locationsWindow        

        function hideLocationsWindow() {
            $(locationsPanelDiv).addClass('hidden').removeClass('shown');
        }

        map.addListener('mouseout', function (ev: any) {
            hideLocationsWindow();
        });

        geoProjection = this.getProjection();

        svg = d3.select(layer).append("svg:svg")
            .attr('id', 'svgOverlay')
            .style('overflow', 'visible');

        // CREATE LOCATION MARKERS (Cirle for every location)

        const locationMarker: any = svg.selectAll('.locationMarker')
            .data(locations)
            .enter()
            .append('g')
            .attr('class', 'locationMarker');

        locationMarker.append('rect')
            .attr('width', LOCATION_MARKER_WIDTH)
            .attr('height', LOCATION_MARKER_WIDTH)
            .attr('x', -LOCATION_MARKER_WIDTH / 2)
            .attr('y', -LOCATION_MARKER_WIDTH / 2)
            .style('opacity', .4)

        // define arrow markers for directed links

        const defs: any = svg.append('svg:defs');
        defs.append('svg:marker')
            .attr('id', 'end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 6)
            .attr('markerWidth', 10)
            .attr('markerHeight', 10)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-3L10,0L0,3L2,0')
            .attr('stroke-width', '0px')
            .attr('fill', '#555')
            .attr('opacity', .5)
            .attr('transform', 'translate(-5, 0)')

        const grad: any = defs.append('svg:linearGradient')
            .attr('id', 'line-gradient')
        grad.append('svg:stop')
            .attr('offset', 0)
            .attr('stop-color', '#000')
        grad.append('svg:stop')
            .attr('offset', .5)
            .attr('stop-color', '#000')
        grad.append('svg:stop')
            .attr('offset', 1)
            .attr('stop-color', '#eee')


        svg = svg.append('g')

        // DRAW EDGES  

        line = d3.line()
            .x(function (d: any) { return d.x; })
            .y(function (d: any) { return d.y; })
         .curve(d3.curveBasis);

        visualLinks = svg.selectAll(".link")
            .data(dgraph.links().toArray())
            .enter()
            .append("path")
            .attr("class", "link")
            .style('fill', 'none')
            .on('mouseover', (ev: MouseEvent, d: any) => {
                messenger.highlight('set', <utils.ElementCompound>{ links: [d] })
            })
            .on('mouseout', () => {
                messenger.highlight('reset')
            })
            .attr('marker-end',function (d: any) {
                if(d.directed){
                    let color = utils.getPriorityColor(d);
                    if(!color)
                        color = COLOR_DEFAULT_LINK;
                    // if(highlightId && highlightId == d._id) {
                        // return 'black';
                    // }
                    return marker(color);
                }
            })

        // DRAW NODES (one for every node x position it is at)

        // obtain nodePositionObjects
        // one npo per node x position 
        let npo: NodePositionObject = new NodePositionObject();
        const nodes: dynamicgraph.Node[] = dgraph.nodes().toArray();
        let n: dynamicgraph.Node, positions: any;
        let googleLatLng: any;
        let serie: any;
        for (let i = 0; i < nodes.length; i++) 
        {
            n = nodes[i];
            positions = n.locationSerie().getSerie();
            serie = new dynamicgraph.ScalarTimeSeries<Object>();
            nodePositionObjectsLookupTable.push(serie);
            for (const tId in positions) {
                googleLatLng = new google.maps.LatLng(
                    positions[parseInt(tId)].latitude(),
                    positions[parseInt(tId)].longitude());
                // check if npo for this node and position does 
                // already exist, if norun t its created in side this function
                npo = getNodePositionObjectsForLocation(n, positions[tId].longitude(), positions[tId].latitude());
                npo.location = positions[tId]
                if (positions[tId].npos.indexOf(npo) == -1) {
                    positions[tId].npos.push(npo);
                }
                npo.geoPos = googleLatLng
                npo.timeIds.push(parseInt(tId))
                serie.set(dgraph.time(parseInt(tId)), npo)
            }
        }

        // assign NPOs to links
        let loc: any; // BEFORE queries.Location;
        visualLinks
            .each((link: any) => {
                // get source and target NPO
                link.sourceNPO = getNodePositionObjectAtTime(link.source, link.times().get(0).id())
                link.sourceNPO.outLinks.push(link)

                link.targetNPO = getNodePositionObjectAtTime(link.target, link.times().get(0).id())
                link.targetNPO.inLinks.push(link)

                link.sourceNPO.outNeighbors.push(link.targetNPO)
                link.targetNPO.inNeighbors.push(link.sourceNPO)
            })

        visualNodes = svg.selectAll(".node")
            .data(nodePositionObjects)
            .enter()
            .append('g')

        // NODE CIRLCE
        visualNodes.append("circle")
            .attr("class", "nodeCircle")
            .attr("r", function (d: any) {
                return nodeSizeFunction(d.node.neighbors().length);
            })

        // bb: not any longer needed for labeling is handled globally
        // maybe include again later 
        vNodeLabelBackgrounds = visualNodes.append("rect")
            .attr("class", "nodeLabelBackground")
            .attr('rx', 2)
            .attr('ry', 2)
            .attr('x', LABEL_OFFSET_X)
            .attr('y', -7)
            .attr("width", (d: any) => getTextWidth(createNodeLabel(d)))
            .attr("height", 18)
            .attr('visibility', 'hidden');


        // NODE LABEL
        vNodeLabels = visualNodes.append('text')
            .text((d: any) => createNodeLabel(d))
            .attr('x', LABEL_OFFSET_X + 2)
            .attr('y', 7)
            .attr('class', 'nodeLabel')
            .attr('visibility', 'hidden')

        updateNodeDisplacementVectors();
        updateNodePositions()
        updateLinks();
        updateNodes();
    }



    map.addListener('mousemove', (ev: google.maps.MouseEvent) => {

        if (locationDisplayTimeoutHandle >= 0) {
            window.clearTimeout(locationDisplayTimeoutHandle);
        }

        // test for hovering nodes
        let minDist: number = 0.5 * F;
        const mouse: any = { x: ev.latLng.lng() * F, y: ev.latLng.lat() * F }
        let pos: any;
        intersectedNode = undefined;
        const projection: any = overlay.getProjection();
        let d: any;
        for (let i = 0; i < nodePositionObjects.length; i++) {

            pos = projection.fromDivPixelToLatLng({ x: nodePositionObjects[i].x, y: nodePositionObjects[i].y })
            pos = { x: pos.lng() * F, y: pos.lat() * F };

            d = Math.hypot(mouse.x - pos.x, mouse.y - pos.y);
            if (isNaN(d))
                continue

            if (d < minDist) {
                intersectedNode = nodePositionObjects[i].node;
                minDist = d;
            }
        }

        intersectedLink = undefined;
        if (intersectedNode == undefined) {
            // test for hovering links
            let l: any;
            let sourceNPO: any, targetNPO: any;
            let sourcePoint: google.maps.Point = new google.maps.Point(0, 0);
            let targetPoint: google.maps.Point = new google.maps.Point(0, 0);
            for (let i = 0; i < links.length; i++) {
                l = links[i]

                if (!l.isVisible())
                    continue;

                sourceNPO = l.sourceNPO
                if (sourceNPO == undefined) {
                    sourcePoint = new google.maps.Point(0, 0); // NOT NECCESARY
                } else {
                    sourcePoint = projection.fromDivPixelToLatLng({ x: sourceNPO.x, y: sourceNPO.y });
                    sourcePoint = new google.maps.Point(sourcePoint.y * F, sourcePoint.x * F); //{ x: sourcePoint.lng() * F, y: sourcePoint.lat() * F };
                }

                targetNPO = l.targetNPO
                if (targetNPO == undefined) {
                    targetPoint = new google.maps.Point(0, 0); // NOT NECCESARY
                } else {
                    targetPoint = projection.fromDivPixelToLatLng({ x: targetNPO.x, y: targetNPO.y });
                    targetPoint = new google.maps.Point(targetPoint.y * F, targetPoint.x * F);
                }

                // collision detection   
                d = distToSegmentSquared(mouse, sourcePoint, targetPoint);
                if (isNaN(d))
                    continue

                if (d < minDist) {
                    intersectedLink = l;
                    minDist = d;
                }
            }
        }

        if (prevIntersectedNode != intersectedNode) {
            messenger.highlight('reset');
            if (intersectedNode != undefined) {
                const newElement = new utils.ElementCompound();
                newElement.nodes = [intersectedNode]
                messenger.highlight('set', newElement);
            }
        }
        prevIntersectedNode = intersectedNode;

        if (prevIntersectedLink != intersectedLink) {
            messenger.highlight('reset');
            if (intersectedLink != undefined) {
                intersectedNode == undefined;
                const newElement = new utils.ElementCompound();
                newElement.nodes = [intersectedLink]
                messenger.highlight('set', newElement);
            }
        }
        prevIntersectedLink = intersectedLink;

        if (intersectedLink == undefined && intersectedNode == undefined) {
            if (ev.pixel)
                displayLocationsWindow(overlay.getProjection(), ev.pixel, ev.latLng)
        }

    });



    overlay.draw = function () {
        updateGeoNodePositions()
        updateNodePositions();
        updateLocationMarkers();
    }

    overlay.setMap(map);
}



function createNodeLabel(npo: any) {
    let locationLabel = '';
    if (npo.location != undefined && npo.location.label() != undefined)
    {
        locationLabel = ', ' + npo.location.label();
    }

    const time: any = dgraph.time(npo.timeIds[0]);
    let timeLabel = ''
    if (time)
        timeLabel = ' (' + moment.utc(time.unixTime()).format('MM/DD/YYYY') + ')';

    return npo.node.label() + locationLabel + timeLabel;
}

let hittestRect: google.maps.LatLngBounds = new google.maps.LatLngBounds();
const hittestRadius = 20;

function displayLocationsWindow(currentProjection: google.maps.MapCanvasProjection, point: google.maps.Point, latLng: google.maps.LatLng): boolean {
    // define hit-test rectangle
    const projection = currentProjection;
    // if we have drifted outside the original, then hide the location div
    if (!hittestRect.isEmpty() && !hittestRect.contains(projection.fromContainerPixelToLatLng(point))) {
        $(locationsPanelDiv).addClass('hidden').removeClass('shown');
    }
    const southwest: google.maps.Point = new google.maps.Point(
        point.x - hittestRadius,
        point.y + hittestRadius);
    const northeast: google.maps.Point = new google.maps.Point(
        point.x + hittestRadius,
        point.y - hittestRadius);

    hittestRect = new google.maps.LatLngBounds(
        projection.fromContainerPixelToLatLng(southwest),
        projection.fromContainerPixelToLatLng(northeast));

    // hit-test against every location we know about
    //      
    const foundLocations: Array<dynamicgraph.Location> = [];
    locations.forEach(function (v, i, arr): void {
        const latlng = new google.maps.LatLng(v.latitude(), v.longitude());
        if (hittestRect.contains(latlng))
            foundLocations.push(v);
    });
    // if there are any locations, then we need to find the
    // associated nodes
    let foundNodes: Array<dynamicgraph.Node>;
    if (foundLocations.length > 0) {
        foundNodes = hittestNodeGeoPositions(hittestRect);
    } else {
        return false;
    }

    const locationGroups: Array<{ loc: dynamicgraph.Location, nodes: Array<dynamicgraph.Node> }> = [];
    foundLocations.forEach(function (v, i, arr) {
        locationGroups.push({
            loc: v,
            nodes: foundNodes.filter(function (v2, i2, arr2): boolean {
                const nodeLoc = getNodeLocation(v2);
                return nodeLoc !== null && nodeLoc.label() == v.label();
            })
        });
    });
    // so now we have the locations and the nodes, so we fill out the locationPanel
    //
    let panelContents: any;

    $(locationsPanelDiv).html('');
    const locListItemSelection = d3.select(locationsPanelDiv)
        .selectAll('.locListItem')
        .data(locationGroups)
        .enter()
        .append('div')
        .attr('class', 'locListItem');

    locListItemSelection
        .append('p')
        .attr('class', 'locpara')
        .append('nobr')
        .text(function (d: any) { return d.loc.label(); });

    locListItemSelection
        .selectAll('.nodeListItem')
        .data(function (d: any, i: any) { return d.nodes; })
        .enter()
        .append('p')
        .attr('class', 'nodeListItem')
        .append('nobr')
        .text(function (d: any) { return d.label(); })

    const translatePoint: google.maps.Point = projection.fromLatLngToDivPixel(latLng);
    translatePoint.x += 20;
    translatePoint.y -= 30;
    // and then show it at the correct location
    $(locationsPanelDiv)
        .css('left', translatePoint.x.toString() + 'px')
        .css('top', translatePoint.y.toString() + 'px')
        .addClass('shown').removeClass('hidden');

    return true;
}



function hittestNodeGeoPositions(bounds: google.maps.LatLngBounds): Array<dynamicgraph.Node> {
    const pos: google.maps.Point = new google.maps.Point(0, 0);
    const result: Array<dynamicgraph.Node> = [];
    let n, locations;
    let llpos;
    for (let i = 0; i < dgraph.nodes().length; i++) {
        n = dgraph.node(i);
        if (n) {
            locations = n.locations(time_start, time_end).toArray();
            for (let j = 0; j < locations.length; j++) {
                llpos = new google.maps.LatLng(locations[j].latitude(), locations[j].longitude());
                if (bounds.contains(llpos))
                    result.push(n); // BEFORE dgraph.node(i);
            }
        }
    }
    return result;
}

function getNodeRelevantLocation(node: dynamicgraph.Node): dynamicgraph.Location | null {
    if (node.locations().length == 0)
        return null;
    else
        return node.locations().last();
}

function getNodeLatLng(node: dynamicgraph.Node): google.maps.LatLng {
    if (node.locations().length == 0) {
        return new google.maps.LatLng(0, 0);
    } else {
        return new google.maps.LatLng(
            node.locations().last().latitude(),
            node.locations().last().longitude());
    }
}

function getNodeLocation(node: dynamicgraph.Node): dynamicgraph.Location | null {
    if (node.locations().length == 0) {
        return null;
    } else {
        return node.locations().last();
    }
}


function updateGeoNodePositions() {

    let pos: google.maps.Point;
    let npo: NodePositionObject;
    for (let i = 0; i < nodePositionObjects.length; i++) {
        npo = nodePositionObjects[i];

        pos = geoProjection.fromLatLngToDivPixel(npo.geoPos);

        if (pos.x == undefined) {
            npo.xOrig = 0;
            npo.yOrig = 0;
        } else {
            npo.xOrig = pos.x;
            npo.yOrig = pos.y;
        }
    }
}

function updateLinks(highlightId?: number) {

    visualLinks
        .transition().duration(100)
        .style('stroke', function (d: any) {
            let color = utils.getPriorityColor(d);
            if(highlightId && highlightId == d._id){
                return 'orange';
            }
            if (!color)
                color = COLOR_DEFAULT_LINK;
            return color;
        })
        .attr('opacity', (d: any) => {
            if(highlightId && highlightId == d._id){
                return 1;
            }
            const visible = d.isVisible();
            if (!visible || !d.presentIn(time_start, time_end))
                return 0;

            if (intersectedLink != undefined) {
                if (intersectedLink == d)
                    return 1;
                else
                    return LINK_OPACITY * .3;
            }

            return d.isHighlighted()
                || d.source.isHighlighted()
                || d.target.isHighlighted() ?
                // 1 :
                // INNER_OPACITY;
                Math.min(1, LINK_OPACITY) : LINK_OPACITY;

        })
        .style('stroke-width', function (d: any) {
            let weight = linkWeightScale(d.weights(time_start, time_end).mean()) * LINK_WIDTH_SCALE;
            const thisSelection = d3.select(this);
            if (weight < 0) {
                weight = -weight;
                thisSelection.attr('stroke-dasharray', '1,2') // BEFORE this ??
            } else {
                thisSelection.attr('stroke-dasharray', '0') // BEFORE this ??
            }
            if(highlightId && highlightId == d._id){
                weight *=3;
            }
            else if(d.isHighlighted())
                weight *= 2;
            return weight;
        })

}

function marker(color: any) 
{
    svg.append("svg:defs").append("svg:marker")
        .attr("id", color.replace("#", ""))
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 12)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto") //auto-start-reverse to flip
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5")
        .style("fill", color);

    return "url(" + color + ")";
}

let visibleLabels: any[] = []
function updateNodes(highlightId?: number) {

    visibleLabels = [];

    visualNodes
        .attr('opacity', (d: any) => {
            if (!d.node.isVisible())
                return 0;
            return d.timeIds[0] <= time_end.id() && d.timeIds[d.timeIds.length - 1] >= time_start.id() ?
                1
                : OUT_OF_TIME_NODES_OPACITY;
        })

    svg.selectAll(".nodeCircle")
        .classed('highlighted', (n: any) =>
            n.node.isHighlighted()
            || n.node.links().highlighted().length > 0
            || n.node.neighbors().highlighted().length > 0
        )
        .style('fill', (d: any) => {
            let color: any;
            if (d.node.isHighlighted()) {
                color = COLOR_HIGHLIGHT;
            }
            else if(highlightId && highlightId == d.node._id){
                    return 'orange';
            } else {
                color = utils.getPriorityColor(d.node);
            }
            if (!color)
                color = COLOR_DEFAULT_NODE;
            return color;
        })
        .style('opacity', (d: any) => {
            if(highlightId && highlightId == d.node._id){
                return 1;
            }
            if (!d.node.isVisible())
                return 0;
            return d.timeIds[0] <= time_end.id() && d.timeIds[d.timeIds.length - 1] >= time_start.id() ?
                d.fixedPosition ?
                    1 :
                    NODE_UNPOSITIONED_OPACITY
                : OUT_OF_TIME_NODES_OPACITY;

        })

    // update node labels
    vNodeLabels
        .attr('visibility', (n: any) => {
            let visible: any = n.node.isHighlighted()
                || intersectedLink && n == intersectedLink.sourceNPO
                || intersectedLink && n == intersectedLink.targetNPO;

            let npo1: any, npo2: any;
            if (visible) {
                // test collision with other visible labels
                for (let i = 0; i < visibleLabels.length; i++) {
                    npo1 = n;
                    npo2 = visibleLabels[i];
                    const l1: any = npo1.x + LABEL_OFFSET_X;
                    const r1: any = npo1.x + LABEL_OFFSET_X + npo1.node.label().length * 8;
                    const t1: any = npo1.y - 7;
                    const b1: any = npo1.y + 7;

                    const l2: any = npo2.x + LABEL_OFFSET_X;
                    const r2: any = npo2.x + LABEL_OFFSET_X + npo2.node.label().length * 8;
                    const t2: any = npo2.y - 7;
                    const b2: any = npo2.y + 7;

                    // check overlap
                    visible = r1 < l2 || r2 < l1 || t1 > b2 || t2 > b1;
                    if (visible) {
                        continue;
                    }

                    // if both labels/nodes are the same, show the first one
                    if (npo1.node == npo2.node) {
                        // if both nodes are the same, hide the node that is currently tested,
                        // because the other one is alreay visible.
                        break;
                    } else {
                        // resolve overlap by flipping label to other side of node
                        // 1. decide which one to flip 
                        let leftFlip: any = npo1;
                        let rightFlip: any = npo2;
                        if (l1 > l2) {
                            rightFlip = npo1;
                            leftFlip = npo2;
                        }

                        // flip label to other side of node   
                        vNodeLabels
                            .filter((n: any) => n == rightFlip)
                            .attr('x', LABEL_OFFSET_X)
                            .attr('text-anchor', 'start')
                        vNodeLabels
                            .filter((n: any) => n == leftFlip)
                            .attr('x', -LABEL_OFFSET_X)
                            .attr('text-anchor', 'end')
                        vNodeLabelBackgrounds
                            .filter((n: any) => n == rightFlip)
                            .attr('x', LABEL_OFFSET_X)
                            .attr('text-anchor', 'start')
                            .attr('visibility', 'visible')
                        vNodeLabelBackgrounds
                            .filter((n: any) => n == leftFlip)
                            .attr('x', (d: any) => -LABEL_OFFSET_X - getTextWidth(createNodeLabel(d)))
                            .attr('text-anchor', 'end')
                            .attr('visibility', 'visible')

                        visible = true; // set back to visible
                    }
                }
            }
            if (visible)
                visibleLabels.push(n);

            return visible ? 'visible' : 'hidden';
        })
    vNodeLabelBackgrounds
        .filter((m: any) => visibleLabels.indexOf(m) > -1)
        .attr('visibility', 'visible')
    vNodeLabelBackgrounds
        .filter((m: any) => visibleLabels.indexOf(m) == -1)
        .attr('visibility', 'hidden')
}


function updateLocationMarkers() {
    d3.selectAll('.locationMarker')
        .attr("transform", function (d: any) {
            const pos: google.maps.LatLng = new google.maps.LatLng(d.latitude(), d.longitude());
            const pixelpos: google.maps.Point = geoProjection.fromLatLngToDivPixel(pos);
            return 'translate(' + (pixelpos.x) + ',' + (pixelpos.y) + ')';
        })
}

// Calculates curve paths for links
function updateLinkPaths() {

    let path: any, dir: any, offset: any;
    let center: any;
    let link, link2: dynamicgraph.Link | any;
    let sourceNPO: any, targetNPO: any;
    const EDGE_GAP: any = 5
    let cx1: any, cy1: any, cx2: any, cy2: any;
    
    // reinit geoMultiLinks
    geoMultiLinks = [];
    let geoMultiLink:GeoMultiLink;
    for (let i = 0; i < dgraph.links().length; i++)
    {
        link = dgraph.link(i);
        (<any>link).geoMultiLink = undefined;        
    }

    for (let i = 0; i < dgraph.links().length; i++)
    {

        link = dgraph.link(i);
        
        // check for NPOs
        if (link)
            sourceNPO = link.sourceNPO;
        else
            sourceNPO = undefined;

        if (sourceNPO == undefined)
            sourceNPO = { x: 0, y: 0 };

        if (link)
            targetNPO = link.targetNPO;
        else
            targetNPO = undefined;

        if (targetNPO == undefined)
            targetNPO = { x: 0, y: 0 };

        (<any>link).sourceNPO = sourceNPO;
        (<any>link).targetNPO = targetNPO;
        
        // check for geomultilinks
        for (let j = 0; j < i; j++)
        {
            link2 = dgraph.link(j);
            if(linkOverlapTest(link, link2))
            {
                // console.log('link overlap', i,j)
                if((<any>link2).geoMultiLink)
                {
                    geoMultiLink = (<any>link2).geoMultiLink;
                    geoMultiLink.addLink(link);
                }else{
                    geoMultiLink = new GeoMultiLink();
                    geoMultiLinks.push(geoMultiLink);
                    geoMultiLink.addLink(link);
                    geoMultiLink.addLink(link2);
                }
            }
        }
    }
    console.log('>> TOTAL MULTILINKS:', geoMultiLinks.length);

    for (let i = 0; i < dgraph.links().length; i++)
    {
        link = dgraph.link(i);
        sourceNPO = link?.sourceNPO;
        targetNPO = link?.targetNPO;

        dir = {
            x: targetNPO.x - sourceNPO.x,
            y: targetNPO.y - sourceNPO.y
        }

        // normalize
        offset = stretchVector([-dir.y, dir.x], EDGE_GAP)
        center = {
            x: sourceNPO.x + dir.x / 2,
            y: sourceNPO.y + dir.y / 2
        }

        // self-links
        if (sourceNPO.x == targetNPO.x
            && sourceNPO.y == targetNPO.y) 
        {
            cx1 = center.x + 30 + Math.random() * 30;
            cy1 = center.y - 10 + Math.random() * 30;
            cx2 = center.x + 10 + Math.random() * 30;
            cy2 = center.y - 30 + Math.random() * 30;
            (link as any)['path'] = [
                { x: sourceNPO.x, y: sourceNPO.y },
                { x: cx1, y: cy1 },
                { x: cx2, y: cy2 },
                { x: targetNPO.x, y: targetNPO.y }]
        } else 
        {
            // non-self links
            cx1 = center.x;
            cy1 = center.y;
        
            // let linkLength : number = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
            let multiplier = 0;
            if((<any>link).geoMultiLink)
            {
                const multiLink:GeoMultiLink = (<GeoMultiLink>(<any>link).geoMultiLink); 
                multiplier = multiLink.linkIndex(link);            
            }
            const stretch = multiplier * LINK_GAP;
            (link as any)['path'] = [
                { x: sourceNPO.x, y: sourceNPO.y },
                { x: center.x + (offset[0] * stretch), y: center.y + (offset[1] * stretch)},
                { x: targetNPO.x, y: targetNPO.y }]
        }
    }

    visualLinks
        .attr("d", function (d: any) { return line(d.path); })

}


function linkOverlapTest(l1: any, l2: any): boolean
{
    return (l1.sourceNPO == l2.sourceNPO && l1.targetNPO == l2.targetNPO)
        || (l1.sourceNPO == l2.targetNPO && l1.targetNPO == l2.sourceNPO);

    // var distX = l1.sourceNPO.x - l2.sourceNPO.x 
    // var distY = l1.sourceNPO.y - l2.sourceNPO.y
    // var dist = Math.sqrt(distX * distX + distY * distY); 
    // if(dist > NODE_SIZE*2)
    // {
    //     // source NPOs are not overlapping, hence return at this point.
    //     return false;
    // }else{
    //     distX = l1.targetNPO.x - l2.targetNPO.x 
    //     distY = l1.targetNPO.y - l2.targetNPO.y
    //     dist = Math.sqrt(distX * distX + distY * distY); 
    //     if(dist > NODE_SIZE*2)
    //     {
    //         return false;
    //     }        
    // }
    // return true;
}

// somehow is not called!
// function randomSeed(link: dynamicgraph.Link)
// {
//     console.log('randomseed');
//     var nodes = this.dynamicgraph.nodes().toArray();
//     var numNodes = nodes.length;
//     var si = nodes.indexOf(link.source)
//     var ti = nodes.indexOf(link.target)
//     var v = (si * ti + si + ti) / (numNodes*numNodes + numNodes+numNodes)   
//     console.log('v', v)
//     return v * .2;
// }

function showLabel(i: any, b: any) {
    if (b) {
        d3.select('#nodeLabelBackground_' + i)
            .attr('visibility', 'visible')
        d3.select('#nodeLabel_' + i)
            .attr('visibility', 'visible')
    } else {
        d3.select('#nodeLabelBackground_' + i)
            .attr('visibility', 'hidden')
        d3.select('#nodeLabel_' + i)
            .attr('visibility', 'hidden')
    }
}

function setRelationTypeVisibility(relType: any, b: any) {
    d3.selectAll('.link')
        .filter(function (d: any) {
            return d.type == relType
        })
        .style('opacity', function (d: any) {
            return b ? 1 : 0
        })
}


/// TIMELINE/SLIDER

const timeSvg: any = d3.select('#timelineDiv')
    .append('svg')
    .attr('width', width)
    .attr('height', TIMELINE_HEIGHT)


const OVERLAP_SLIDER_WIDTH = 100;
let timeSlider: timeslider.TimeSlider;
if (dgraph.times().size() > 1) {
    timeSlider = new timeslider.TimeSlider(dgraph, width - OVERLAP_SLIDER_WIDTH - 20);
    timeSlider.appendTo(timeSvg);
    messenger.addEventListener('timeRange', timeChangedHandler);
}

// OVERLAP SLIDER    
let menuDiv = d3.select('#menuDiv');
ui.makeSlider(menuDiv, 'Node Overlap', 100, MENU_HEIGHT, OVERLAP_FRACTION, -.05, 3, function (value: number) {
    OVERLAP_FRACTION = value;
    updateNodePositions();
})
ui.makeSlider(menuDiv, 'Edge Gap', 100, MENU_HEIGHT, LINK_GAP, 0, 10, function (value: number) {
    LINK_GAP = value;
    updateLinkPaths();
})
// LINK OPACITY SLIDER    
menuDiv = d3.select('#menuDiv');
ui.makeSlider(menuDiv, 'Link Opacity', 100, MENU_HEIGHT, LINK_OPACITY, 0, 1, function (value: number) {
    LINK_OPACITY = value;
    updateLinks();
})
ui.makeSlider(menuDiv, 'Link Width', 100, MENU_HEIGHT, LINK_WIDTH_SCALE, 0, 10, function (value: number) {
    LINK_WIDTH_SCALE = value;
    updateLinks();
})

// NON-POSITIONED NODES OPACITY SLIDER    
menuDiv = d3.select('#menuDiv');
ui.makeSlider(menuDiv, 'Positionless Nodes', 150, MENU_HEIGHT, LINK_OPACITY, 0, 1, function (value: number) {
    NODE_UNPOSITIONED_OPACITY = value;
    updateNodes();
})

function stretchVector(vec: any, finalLength: any) {
    let len = 0
    for (let i = 0; i < vec.length; i++) {
        len += Math.pow(vec[i], 2)
    }
    len = Math.sqrt(len)
    for (let i = 0; i < vec.length; i++) {
        vec[i] = vec[i] / len * finalLength
    }

    return vec;
}

function timeChangedHandler(m: messenger.TimeRangeMessage) {

    time_start = times[0];
    time_end = times[times.length - 1];
    let i = 0;
    for (i; i < times.length; i++) {
        if (times[i].unixTime() > m.startUnix) {
            time_start = times[i - 1];
            break;
        }
    }
    for (i; i < times.length; i++) {
        if (times[i].unixTime() > m.endUnix) {
            time_end = times[i - 1];
            break;
        }
    }

    timeSlider.set(m.startUnix, m.endUnix);

    updateNodeDisplacementVectors();
    updateNodePositions();
    updateNodes();
    updateLinks();
}


function updateEvent(m: messenger.TimeRangeMessage) { // BEFORE messenger.Message) {
    if (m && m.type == 'timeRange' && dgraph.times().size() > 1) {
        timeSlider.set(m.startUnix, m.endUnix);
    }

    updateLinks();
    updateNodes();
}


function reorderLabels() {
    console.log('updateEvents')
}


function updateNodePositions() {

    let npo: any;
    for (let i = 0; i < nodePositionObjects.length; i++)
    {
        npo = nodePositionObjects[i];
        npo.x = npo.xOrig + npo.displacementVector[0] * OVERLAP_FRACTION;
        npo.y = npo.yOrig + npo.displacementVector[1] * OVERLAP_FRACTION;
    }

    for (let i = 0; i < nodePositionObjects.length; i++)
    {
        if (!nodePositionObjects[i].fixedPosition) 
        {
            // npo = nodePositionObjects[i]

            // // calculate barycenter of related npos
            // var x_bar: number = 0
            // var y_bar: number = 0
            // for (var j = 0; j < npo.inNeighbors.length; j++) 
            // {
            //     x_bar += npo.inNeighbors[j].x
            //     y_bar += npo.inNeighbors[j].y
            // }
            // for (var j = 0; j < npo.outNeighbors.length; j++) 
            // {
            //     x_bar += npo.outNeighbors[j].x
            //     y_bar += npo.outNeighbors[j].y
            // }
            // x_bar /= (npo.inNeighbors.length + npo.outNeighbors.length)
            // y_bar /= (npo.inNeighbors.length + npo.outNeighbors.length)

            // var x_vec: number = npo.x - x_bar;
            // var y_vec: number = npo.y - y_bar;
            // var d: number = Math.sqrt(x_vec * x_vec + y_vec * y_vec);
            // if (d == 0) 
            // {
            //     d = 1;
            // }
            // x_vec /= d;
            // y_vec /= d;

            // npo.x = x_bar + 200 * x_vec;
            // npo.y = y_bar + 200 * y_vec;
            npo.x = 0;
            npo.y = 0;
        }
    }


    visualNodes
        .attr("transform", function (d: any) {
            return 'translate(' + d.x + ',' + d.y + ')';
        })

    updateLinkPaths();
}


function updateNodeDisplacementVectors() {

    // calculate angles: 
    let l: dynamicgraph.Location;
    let localNPOs: any[];
    for (let i = 0; i < locations.length; i++) {
        l = locations[i];
        localNPOs = []
        // filter npos present in this time
        for (let j = 0; j < (l as any)['npos'].length; j++) {
            if ((l as any)['npos'][j].timeIds[0] <= time_end.id()
                && (l as any)['npos'][j].timeIds[(l as any)['npos'][j].timeIds.length - 1] >= time_start.id()) {
                localNPOs.push((l as any)['npos'][j]);
            }
        }
        if (localNPOs.length == 1) {
            localNPOs[0].displacementVector[0] = 0;
            localNPOs[0].displacementVector[1] = 0;
        } else {
            // calculate andle
            const alpha: number = Math.PI * 2 / localNPOs.length;
            let npo: any;
            const radius: number = localNPOs.length * NODE_SIZE / Math.PI;
            for (let j = 0; j < localNPOs.length; j++) {
                npo = localNPOs[j]
                npo.displacementVector[0] = Math.sin(alpha * j) * radius;
                npo.displacementVector[1] = Math.cos(alpha * j) * radius;
            }
        }
    }

    // create displacement vector for each NPO
}

function getNodePositionObjectsForLocation(n: dynamicgraph.Node, long: number, lat: number): NodePositionObject {
    const s: any = nodePositionObjectsLookupTable[n.id()]
    long = Math.round(long * 100) / 100
    lat = Math.round(lat * 100) / 100
    let a: any, b: any;
    if (s != undefined) {
        for (const t in s.serie) {
            a = Math.round(s.serie[t].geoPos.lng() * 100) / 100
            b = Math.round(s.serie[t].geoPos.lat() * 100) / 100
            if (a == long && b == lat) {
                return s.serie[t];
            }
        }
    }
    // init node positions
    const npo : any = new NodePositionObject();
    npo.node = n,
        npo.x = 0,
        npo.y = 0,
        npo.xOrig = 0,
        npo.yOrig = 0,
        npo.displaced = false
    npo.displacementVector = [0, 0]
    nodePositionObjects.push(npo);

    return npo
}


function getNodePositionObjectAtTime(n: dynamicgraph.Node, tId: number): Object {
    const s: any = nodePositionObjectsLookupTable[n.id()]
    let npo: any;

    if (s.serie[tId] == undefined) {
        // check if empty node object exist for n
        if (emptyNodePositions[n.id()] != undefined) {
            npo = emptyNodePositions[n.id()];

        } else {
            // create node
            npo = new NodePositionObject();
            npo.x = 0;
            npo.y = 0;
            npo.timeIds.push(tId);
            npo.xOrig = 0;
            npo.yOrig = 0;
            npo.node = n;
            npo.geoPos = new google.maps.LatLng(0, 0);
            npo.displaced = false
            npo.displacementVector = [0, 0]
            npo.fixedPosition = false;
            nodePositionObjects.push(npo)
            emptyNodePositions[n.id()] = npo;
        }
    } else {
        npo = s.serie[tId];
    }
    return npo;
}


////////////////////
/// SOME HELPERS /// 
////////////////////

function sqr(x: number) {
    return x * x
}
function dist2(v: any, w: any) {
    return sqr(v.x - w.x) + sqr(v.y - w.y)
}
function distToSegmentSquared(p: any, v: any, w: any) {
    const l2: number = dist2(v, w);

    if (l2 == 0) return dist2(p, v);

    const t: number = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;

    if (t < 0) return dist2(p, v);
    if (t > 1) return dist2(p, w);

    return dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
}

function distToSegment(p: any, v: any, w: any) {
    return Math.sqrt(distToSegmentSquared(p, v, w));
}


function getTextWidth(s: string) {
    return s.length * 8.8;
}


$(document).ready(function () { init(); })

function setStateHandler(m: messenger.SetStateMessage){
    if (m.viewType=="map"){

    const state: messenger.MapControls = m.state as messenger.MapControls;    
    // unpack / query that state object

    OVERLAP_FRACTION = state.nodeOverlap;
    updateNodePositions();

    LINK_OPACITY = state.linkOpacity;
    updateLinks();

    NODE_UNPOSITIONED_OPACITY = state.opacityOfPositionlessNodes;
    updateNodes();


    
    time_start=state.timeSliderStart;
    time_end=state.timeSliderEnd;

    // set time (start/end)
    messenger.timeRange(state.timeSliderStart, state.timeSliderEnd, times[0], true);
    }

}

function getStateHandler( m: messenger.GetStateMessage){
    if (m.viewType=="map"){

        const mapNetwork: messenger.NetworkControls=new messenger.MapControls("map",time_start.unixTime(),time_end.unixTime(),OVERLAP_FRACTION,LINK_OPACITY,NODE_UNPOSITIONED_OPACITY);
      /*   var bookmarksArray=JSON.parse(localStorage.getItem("vistorianBookmarks") || "[]");

      if (m.bookmarkIndex!=bookmarksArray.length-1){
          bookmarksArray[m.bookmarkIndex].controlsValues[3]=mapNetwork;
      }
      else{
          bookmarksArray[m.bookmarkIndex].controlsValues.push(mapNetwork);
        
      }
      localStorage.setItem("vistorianBookmarks", JSON.stringify(bookmarksArray)) */
  
    messenger.stateCreated(mapNetwork,m.bookmarkIndex,m.viewType,m.isNewBookmark,m.typeOfMultiView);
}

}