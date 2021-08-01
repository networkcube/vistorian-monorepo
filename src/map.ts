/// <reference path="lib/google.maps.d.ts" />
/// <reference path="./lib/d3.d.ts"/>

import * as dynamicgraph from 'vistorian-core/src/dynamicgraph';
import * as utils from 'vistorian-core/src/utils';
import * as main from 'vistorian-core/src/main';
import * as messenger from 'vistorian-core/src/messenger';

import * as ui from 'vistorian-core/src/ui';
import * as timeslider from 'vistorian-core/src/timeslider';

import * as moment from 'moment';

var COLOR_DEFAULT_LINK: string = '#999999';
var COLOR_DEFAULT_NODE: string = '#999999';
var COLOR_HIGHLIGHT: string = '#ff8800';
var LINK_OPACITY: number = 0.4;
var NODE_UNPOSITIONED_OPACITY: number = 0.4
var LOCATION_MARKER_WIDTH: number = 10;
var OVERLAP_FRACTION: number = 0.3;
var NODE_SIZE: number = 4;
var OUT_OF_TIME_NODES_OPACITY: number = 0;
var LABEL_OFFSET_X: number = 20;
var SHOW_NON_PLACE: boolean = true;
var LINK_GAP = 2;

var width: number = window.innerWidth
var height: number = window.innerHeight - 100;

interface Bounds {
    left: number;
    top: number;
}
var margin: Bounds = { left: 20, top: 20 };
var TIMELINE_HEIGHT: number = 50;
var MENU_HEIGHT: number = 50;

var dgraph: dynamicgraph.DynamicGraph = main.getDynamicGraph();
// get dynamic graph
var links: dynamicgraph.Link[] = dgraph.links().toArray();
var times: any[] = dgraph.times().toArray();
var locations: any[] = dgraph.locations().toArray();
for (var i = 0; i < locations.length; i++) {
    locations[i]['npos'] = [];
}
var time_start: any = dgraph.time(0); // BEFORE queries.Time
var time_end: any = dgraph.times().last(); // BEFORE queries.Time

// world map to show node positions
var mapCanvas: any = d3.select('#visDiv').node();
$(mapCanvas).css('width', '100%');
$(mapCanvas).css('height', $(window).height() - 60);

// one empty default nodeposition object for every node
// for the cases this node has no position at a given time.
var emptyNodePositions: any = {}

// VISUAL ELEMENTS
var nodePositionObjects: any[] = [];
var nodePositionObjectsLookupTable: any[] = [];

var geoMultiLinks:GeoMultiLink[] = [];

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
    x: number = 0; // INIT ?? 
    y: number = 0; // INIT ??
    xOrig: number = 0; // INIT ??
    yOrig: number = 0; // INIT ??
    geoPos: google.maps.LatLng = new google.maps.LatLng(0, 0); // INIT ??
    displaced: boolean = false; // INIT ??
    displacementVector: number[] = []; // INIT ??
    fixedPosition: boolean = true;
    inLinks: dynamicgraph.Link[] = [];
    outLinks: dynamicgraph.Link[] = [];
    inNeighbors: dynamicgraph.Node[] = [];
    outNeighbors: dynamicgraph.Node[] = [];
}

var overlay: any;
var map: any;


var linkWeightScale = d3.scale.linear().range([0, 2]);
linkWeightScale.domain([
    0,
    dgraph.links().weights().max()
]);

messenger.setDefaultEventListener(updateEvent);

var color: any = d3.scale.category20; // in d3 v4 d3.scaleOrdinal(d3.schemeCategory10);

dgraph.nodes().toArray().forEach((n: any) => {
    n['width'] = n.attr('label').length * 5 + 10,
        n['height'] = 10;
})


var nodeSizeFunction: any = d3.scale.linear()
    .domain([0, 100])
    .range([NODE_SIZE, NODE_SIZE])


// DRAW 
var svg: any;
var line: any;
var visualNodes: any;
var visualLinks: any;
var vNodeLabels: any;
var vNodeLabelBackgrounds: any;
var geoProjection: google.maps.MapCanvasProjection;
var layer: any;
var locationsPanelDiv: HTMLDivElement;


var locationDisplayTimeoutHandle: any = -1;
var prevIntersectedLink: any;
var prevIntersectedNode: any;
var intersectedLink: any;
var intersectedNode: any;
var prevDist: any;
var f: any;
var F: number = 1000;


messenger.addEventListener(messenger.MESSAGE_SET_STATE, setStateHandler);
messenger.addEventListener(messenger.MESSAGE_GET_STATE, getStateHandler);


// STYLING MAP
function init() {
    var mapOptions: any = {
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
    });

    var bcNode = new BroadcastChannel('row_hovered_over_node');
    bcNode.onmessage = function (ev) {
        updateNodes(ev.data.id);
    };

    var bcLink = new BroadcastChannel('row_hovered_over_link');
    bcLink.onmessage = function (ev) {
        updateLinks(ev.data.id);
    };

    var lastPanUpdate: number = window.performance.now();
    map.addListener('center_changed', function (e: any) {

        var current: any = window.performance.now();
        var delta: any = current - lastPanUpdate;
        if (delta < 1000) {
            var pps = (1000 / delta).toFixed(0);
        }
        lastPanUpdate = current;
        $('#weirdDiv').css('width', window.innerWidth * Math.random());
        $('#weirdDiv').parent().parent().css('width', window.innerWidth * Math.random());

        var northWest: any = { x: map.getBounds().getSouthWest().lng(), y: map.getBounds().getNorthEast().lat() }
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

        var locationMarker: any = svg.selectAll('.locationMarker')
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

        var defs: any = svg.append('svg:defs');
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

        var grad: any = defs.append('svg:linearGradient')
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

        line = d3.svg.line() // d3.line() in d3 v4
            .x(function (d: any) { return d.x; })
            .y(function (d: any) { return d.y; })
            .interpolate("basis"); // .curve(d3.curveBasis) in d3 v4;

        visualLinks = svg.selectAll(".link")
            .data(dgraph.links().toArray())
            .enter()
            .append("path")
            .attr("class", "link")
            .style('fill', 'none')
            .on('mouseover', (d: any, i: any) => {
                messenger.highlight('set', <utils.ElementCompound>{ links: [d] })
            })
            .on('mouseout', (d: any) => {
                messenger.highlight('reset')
            })
            .attr('marker-end',function (d: any) {
                if(d.directed){
                    var color = utils.getPriorityColor(d);
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
        var npo: NodePositionObject = new NodePositionObject();
        var nodes: dynamicgraph.Node[] = dgraph.nodes().toArray();
        var n: dynamicgraph.Node, positions: any;
        var googleLatLng: any;
        var serie: any;
        for (var i = 0; i < nodes.length; i++) 
        {
            n = nodes[i];
            positions = n.locationSerie().getSerie();
            serie = new dynamicgraph.ScalarTimeSeries<Object>();
            nodePositionObjectsLookupTable.push(serie);
            for (var tId in positions) {
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
        var loc: any; // BEFORE queries.Location;
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
        var minDist: number = 0.5 * F;
        var mouse: any = { x: ev.latLng.lng() * F, y: ev.latLng.lat() * F }
        var pos: any;
        intersectedNode = undefined;
        var projection: any = overlay.getProjection();
        var d: any;
        for (var i = 0; i < nodePositionObjects.length; i++) {

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
            var l: any;
            var sourceNPO: any, targetNPO: any;
            var sourcePoint: google.maps.Point = new google.maps.Point(0, 0);
            var targetPoint: google.maps.Point = new google.maps.Point(0, 0);
            for (var i = 0; i < links.length; i++) {
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
                var newElement = new utils.ElementCompound();
                newElement.nodes = [intersectedNode]
                messenger.highlight('set', newElement);
            }
        }
        prevIntersectedNode = intersectedNode;

        if (prevIntersectedLink != intersectedLink) {
            messenger.highlight('reset');
            if (intersectedLink != undefined) {
                intersectedNode == undefined;
                var newElement = new utils.ElementCompound();
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
    var locationLabel: String = '';
    if (npo.location != undefined && npo.location.label() != undefined)
    {
        locationLabel = ', ' + npo.location.label();
    }

    var time: any = dgraph.time(npo.timeIds[0]);
    var timeLabel:String = ''
    if (time)
        timeLabel = ' (' + moment.utc(time.unixTime()).format('MM/DD/YYYY') + ')';

    return npo.node.label() + locationLabel + timeLabel;
}

var hittestRect: google.maps.LatLngBounds = new google.maps.LatLngBounds();
var hittestRadius = 20;

function displayLocationsWindow(currentProjection: google.maps.MapCanvasProjection, point: google.maps.Point, latLng: google.maps.LatLng): boolean {
    // define hit-test rectangle
    var projection = currentProjection;
    // if we have drifted outside the original, then hide the location div
    if (!hittestRect.isEmpty() && !hittestRect.contains(projection.fromContainerPixelToLatLng(point))) {
        $(locationsPanelDiv).addClass('hidden').removeClass('shown');
    }
    var southwest: google.maps.Point = new google.maps.Point(
        point.x - hittestRadius,
        point.y + hittestRadius);
    var northeast: google.maps.Point = new google.maps.Point(
        point.x + hittestRadius,
        point.y - hittestRadius);

    hittestRect = new google.maps.LatLngBounds(
        projection.fromContainerPixelToLatLng(southwest),
        projection.fromContainerPixelToLatLng(northeast));

    // hit-test against every location we know about
    //      
    var foundLocations: Array<dynamicgraph.Location> = [];
    locations.forEach(function (v, i, arr): void {
        var latlng = new google.maps.LatLng(v.latitude(), v.longitude());
        if (hittestRect.contains(latlng))
            foundLocations.push(v);
    });
    // if there are any locations, then we need to find the
    // associated nodes
    var foundNodes: Array<dynamicgraph.Node>;
    if (foundLocations.length > 0) {
        foundNodes = hittestNodeGeoPositions(hittestRect);
    } else {
        return false;
    }

    var locationGroups: Array<{ loc: dynamicgraph.Location, nodes: Array<dynamicgraph.Node> }> = [];
    foundLocations.forEach(function (v, i, arr) {
        locationGroups.push({
            loc: v,
            nodes: foundNodes.filter(function (v2, i2, arr2): boolean {
                var nodeLoc = getNodeLocation(v2);
                return nodeLoc !== null && nodeLoc.label() == v.label();
            })
        });
    });
    // so now we have the locations and the nodes, so we fill out the locationPanel
    //
    var panelContents: any;

    $(locationsPanelDiv).html('');
    var locListItemSelection = d3.select(locationsPanelDiv)
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

    var translatePoint: google.maps.Point = projection.fromLatLngToDivPixel(latLng);
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
    var pos: google.maps.Point = new google.maps.Point(0, 0);
    var result: Array<dynamicgraph.Node> = [];
    var n, locations;
    var llpos;
    for (var i = 0; i < dgraph.nodes().length; i++) {
        n = dgraph.node(i);
        if (n) {
            locations = n.locations(time_start, time_end).toArray();
            for (var j = 0; j < locations.length; j++) {
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

    var pos: google.maps.Point;
    var npo: NodePositionObject;
    for (var i = 0; i < nodePositionObjects.length; i++) {
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
            var color = utils.getPriorityColor(d);
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
            var visible = d.isVisible();
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
            var weight = linkWeightScale(d.weights(time_start, time_end).mean());
            var thisSelection = d3.select(this);
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
};

var visibleLabels: any[] = []
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
            var color: any;
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
            var visible: any = n.node.isHighlighted()
                || intersectedLink && n == intersectedLink.sourceNPO
                || intersectedLink && n == intersectedLink.targetNPO;

            var npo1: any, npo2: any;
            if (visible) {
                // test collision with other visible labels
                for (var i = 0; i < visibleLabels.length; i++) {
                    npo1 = n;
                    npo2 = visibleLabels[i];
                    var l1: any = npo1.x + LABEL_OFFSET_X;
                    var r1: any = npo1.x + LABEL_OFFSET_X + npo1.node.label().length * 8;
                    var t1: any = npo1.y - 7;
                    var b1: any = npo1.y + 7;

                    var l2: any = npo2.x + LABEL_OFFSET_X;
                    var r2: any = npo2.x + LABEL_OFFSET_X + npo2.node.label().length * 8;
                    var t2: any = npo2.y - 7;
                    var b2: any = npo2.y + 7;

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
                        var leftFlip: any = npo1;
                        var rightFlip: any = npo2;
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
            var pos: google.maps.LatLng = new google.maps.LatLng(d.latitude(), d.longitude());
            var pixelpos: google.maps.Point = geoProjection.fromLatLngToDivPixel(pos);
            return 'translate(' + (pixelpos.x) + ',' + (pixelpos.y) + ')';
        })
}

// Calculates curve paths for links
function updateLinkPaths() {

    var path: any, dir: any, offset: any;
    var center: any;
    var link, link2: dynamicgraph.Link | any;
    var sourceNPO: any, targetNPO: any;
    var EDGE_GAP: any = 5
    var cx1: any, cy1: any, cx2: any, cy2: any;
    
    // reinit geoMultiLinks
    geoMultiLinks = [];
    var geoMultiLink:GeoMultiLink;
    for (var i = 0; i < dgraph.links().length; i++) 
    {
        link = dgraph.link(i);
        (<any>link).geoMultiLink = undefined;        
    }

    for (var i = 0; i < dgraph.links().length; i++) 
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
        for (var j = 0; j < i; j++)
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

    for (var i = 0; i < dgraph.links().length; i++) 
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
            let multiplier: number = 0;
            if((<any>link).geoMultiLink)
            {
                let multiLink:GeoMultiLink = (<GeoMultiLink>(<any>link).geoMultiLink); 
                multiplier = multiLink.linkIndex(link) - multiLink.numLinks() / 2;            
            }
            let stretch = multiplier * LINK_GAP;
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
    return l1.sourceNPO == l2.sourceNPO && l1.targetNPO == l2.targetNPO;
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

var timeSvg: any = d3.select('#timelineDiv')
    .append('svg')
    .attr('width', width)
    .attr('height', TIMELINE_HEIGHT)


var OVERLAP_SLIDER_WIDTH = 100;
if (dgraph.times().size() > 1) {
    var timeSlider: timeslider.TimeSlider = new timeslider.TimeSlider(dgraph, width - OVERLAP_SLIDER_WIDTH - 20);
    timeSlider.appendTo(timeSvg);
    messenger.addEventListener('timeRange', timeChangedHandler);
}

// OVERLAP SLIDER    
var menuDiv = d3.select('#menuDiv');
ui.makeSlider(menuDiv, 'Node Overlap', 100, MENU_HEIGHT, OVERLAP_FRACTION, -.05, 3, function (value: number) {
    OVERLAP_FRACTION = value;
    updateNodePositions();
})
ui.makeSlider(menuDiv, 'Edge Gap', 100, MENU_HEIGHT, LINK_GAP, 0, 10, function (value: number) {
    LINK_GAP = value;
    updateLinkPaths();
})
// LINK OPACITY SLIDER    
var menuDiv = d3.select('#menuDiv');
ui.makeSlider(menuDiv, 'Link Opacity', 100, MENU_HEIGHT, LINK_OPACITY, 0, 1, function (value: number) {
    LINK_OPACITY = value;
    updateLinks();
})

// NON-POSITIONED NODES OPACITY SLIDER    
var menuDiv = d3.select('#menuDiv');
ui.makeSlider(menuDiv, 'Opacity of Positionless Nodes', 100, MENU_HEIGHT, LINK_OPACITY, 0, 1, function (value: number) {
    NODE_UNPOSITIONED_OPACITY = value;
    updateNodes();
})

function stretchVector(vec: any, finalLength: any) {
    var len = 0
    for (var i = 0; i < vec.length; i++) {
        len += Math.pow(vec[i], 2)
    }
    len = Math.sqrt(len)
    for (var i = 0; i < vec.length; i++) {
        vec[i] = vec[i] / len * finalLength
    }

    return vec;
}

function timeChangedHandler(m: messenger.TimeRangeMessage) {

    time_start = times[0];
    time_end = times[times.length - 1];
    for (var i = 0; i < times.length; i++) {
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

    var npo: any;
    for (var i = 0; i < nodePositionObjects.length; i++) 
    {
        npo = nodePositionObjects[i];
        npo.x = npo.xOrig + npo.displacementVector[0] * OVERLAP_FRACTION;
        npo.y = npo.yOrig + npo.displacementVector[1] * OVERLAP_FRACTION;
    }

    for (var i = 0; i < nodePositionObjects.length; i++) 
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
    var l: dynamicgraph.Location;
    var localNPOs: any[];
    for (var i = 0; i < locations.length; i++) {
        l = locations[i];
        localNPOs = []
        // filter npos present in this time
        for (var j = 0; j < (l as any)['npos'].length; j++) {
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
            var alpha: number = Math.PI * 2 / localNPOs.length;
            var npo: any;
            var radius: number = localNPOs.length * NODE_SIZE / Math.PI;
            for (var j = 0; j < localNPOs.length; j++) {
                npo = localNPOs[j]
                npo.displacementVector[0] = Math.sin(alpha * j) * radius;
                npo.displacementVector[1] = Math.cos(alpha * j) * radius;
            }
        }
    }

    // create displacement vector for each NPO
}

function getNodePositionObjectsForLocation(n: dynamicgraph.Node, long: number, lat: number): NodePositionObject {
    var s: any = nodePositionObjectsLookupTable[n.id()]
    var npo: any;
    long = Math.round(long * 100) / 100
    lat = Math.round(lat * 100) / 100
    var a: any, b: any;
    if (s != undefined) {
        for (var t in s.serie) {
            a = Math.round(s.serie[t].geoPos.lng() * 100) / 100
            b = Math.round(s.serie[t].geoPos.lat() * 100) / 100
            if (a == long && b == lat) {
                return s.serie[t];
            }
        }
    }
    // init node positions
    npo = new NodePositionObject();
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
    var s: any = nodePositionObjectsLookupTable[n.id()]
    var npo: any;

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
    var l2: number = dist2(v, w);

    if (l2 == 0) return dist2(p, v);

    var t: number = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;

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

    var state: messenger.MapControls = m.state as messenger.MapControls;    
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

        var mapNetwork: messenger.NetworkControls=new messenger.MapControls("map",time_start.unixTime(),time_end.unixTime(),OVERLAP_FRACTION,LINK_OPACITY,NODE_UNPOSITIONED_OPACITY);
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