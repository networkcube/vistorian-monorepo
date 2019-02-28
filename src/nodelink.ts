import * as dynamicgraph from 'vistorian-core/src/dynamicgraph';
import * as utils from 'vistorian-core/src/utils';
import * as main from 'vistorian-core/src/main';
import * as messenger from 'vistorian-core/src/messenger';

import * as ui from 'vistorian-widgets/src/ui';
import * as timeslider from 'vistorian-widgets/src/timeslider';

import * as d3 from 'd3'

var COLOR_DEFAULT_LINK: string = '#999999';
var COLOR_DEFAULT_NODE: string = '#333333';
var COLOR_HIGHLIGHT: string = '#ff8800';
var LINK_OPACITY: number = .5;
var LINK_WIDTH: number = 10;
var OFFSET_LABEL = { x: 5, y: 4 }
var LINK_GAP: number = 2;
var LAYOUT_TIMEOUT: number = 3000;
var LABELBACKGROUND_OPACITY: number = 1;
var LABELDISTANCE: number = 10;
var SLIDER_WIDTH: number = 100
var SLIDER_HEIGHT: number = 35;
var NODE_SIZE: number = 1;

var width: number = window.innerWidth
var height: number = window.innerHeight - 100;

interface Bounds {
    left: number;
    top: number;
}
var margin: Bounds = { left: 20, top: 20 };
var TIMELINE_HEIGHT: number = 50;

var currentLayout: string = 'forceDirected';
var positions: Object = new Object();
(positions as any)['forceDirected'] = [];

// get dynamic graph
var dgraph: dynamicgraph.DynamicGraph = main.getDynamicGraph();
var times: dynamicgraph.Time[] = dgraph.times().toArray();
var time_start: dynamicgraph.Time = times[0];
var time_end: dynamicgraph.Time = times[times.length - 1];

var nodes: any = dgraph.nodes().toArray();
var nodesOrderedByDegree: dynamicgraph.Node[] = dgraph.nodes().toArray().sort((n1: any, n2: any) => n2.neighbors().length - n1.neighbors().length);

var nodePairs: dynamicgraph.NodePairQuery = dgraph.nodePairs();
var links: any = dgraph.links().toArray();
var nodeLength: number = nodes.length;


// states
// var mouseDownNode = undefined;
var hiddenLabels: any = [];
var LABELING_STRATEGY: number = 1;

var linkWeightScale = d3.scale.linear().range([0, LINK_WIDTH]);
linkWeightScale.domain([
    0,
    dgraph.links().weights().max()
]);

messenger.setDefaultEventListener(updateEvent);



// MENU
var menuDiv = d3.select('#menuDiv');
/* widget/ui.js */
ui.makeSlider(menuDiv, 'Link Opacity', SLIDER_WIDTH, SLIDER_HEIGHT, LINK_OPACITY, 0, 1, function (value: number) {
    LINK_OPACITY = value;
    updateLinks();
})
ui.makeSlider(menuDiv, 'Node Size', SLIDER_WIDTH, SLIDER_HEIGHT, NODE_SIZE, .01, 3, function (value: number) {
    NODE_SIZE = value;
    updateNodeSize();
})
ui.makeSlider(menuDiv, 'Edge Gap', SLIDER_WIDTH, SLIDER_HEIGHT, LINK_GAP, 0, 10, function (value: number) {
    LINK_GAP = value;
    updateLayout();
})
ui.makeSlider(menuDiv, 'Link Width', SLIDER_WIDTH, SLIDER_HEIGHT, LINK_WIDTH, 0, 10, function (value: number) {
    LINK_WIDTH = value;
    linkWeightScale.range([0, LINK_WIDTH]);
    updateLinks();
})
makeDropdown(menuDiv, 'Labeling', ['Automatic', 'Hide All', 'Show All', 'Neighbors'], (selection: any) => {
    LABELING_STRATEGY = parseInt(selection);
    updateLabelVisibility();
})

function makeDropdown(d3parent: any, name: string, values: String[], callback: Function) {
    var s: any = d3parent.append('select')
        .attr('id', "selection-input_" + name)

    s.append('option')
        .html('Chose ' + name + ':')

    values.forEach((v: any, i: number) => {
        s.append('option').attr('value', i).html(v)
    })

    s.on('change', () => {
        var e = document.getElementById("selection-input_" + name) as HTMLSelectElement;
        callback(e.options[e.selectedIndex].value);
    })
}

// TIMELINE
var timeSvg: any = d3.select('#timelineDiv')
    .append('svg')
    .attr('width', width)
    .attr('height', TIMELINE_HEIGHT)

if (dgraph.times().size() > 1) {
    var timeSlider: timeslider.TimeSlider = new timeslider.TimeSlider(dgraph, width - 50);
    timeSlider.appendTo(timeSvg);
    messenger.addEventListener('timeRange', timeChangedHandler)
}



$('#visDiv').append('<svg id="visSvg" width="' + (width - 20) + '" height="' + (height - 20) + '"></svg>');

var mouseStart: number[];
var panOffsetLocal: number[] = [0, 0];
var panOffsetGlobal: number[] = [0, 0];

var isMouseDown: boolean = false;
var globalZoom: number = 1;

var svg: any = d3.select('#visSvg')
    .on('mousedown', () => {
        isMouseDown = true;
        mouseStart = [(<MouseEvent>d3.event).x, (<MouseEvent>d3.event).y];
    })
    .on('mousemove', () => {
        if (isMouseDown) {
            panOffsetLocal[0] = ((<MouseEvent>d3.event).x - mouseStart[0]) * globalZoom;
            panOffsetLocal[1] = ((<MouseEvent>d3.event).y - mouseStart[1]) * globalZoom;
            svg.attr("transform", "translate(" + (panOffsetGlobal[0] + panOffsetLocal[0]) + ',' + (panOffsetGlobal[1] + panOffsetLocal[1]) + ")");
        }
    })
    .on('mouseup', () => {
        isMouseDown = false;
        panOffsetGlobal[0] += panOffsetLocal[0]
        panOffsetGlobal[1] += panOffsetLocal[1]
    })
    .on('wheel', () => {
        // zoom 
        (<Event>d3.event).preventDefault();
        (<Event>d3.event).stopPropagation();
        //var globalZoom = 1 + d3.event.wheelDelta / 1000; // wheelDelta only in v4 or more
        var globalZoom = 1 ;
        var mouse = [(<MouseEvent>d3.event).x - panOffsetGlobal[0], (<MouseEvent>d3.event).y - panOffsetGlobal[1]];
        var d: any, n: any;
        for (var i = 0; i < nodes.length; i++) {
            n = nodes[i]
            n.x = mouse[0] + (n.x - mouse[0]) * globalZoom;
            n.y = mouse[1] + (n.y - mouse[1]) * globalZoom;
        }
        updateLayout();
    })

svg = svg.append('g')
    .attr('width', width)
    .attr('height', height)


var linkLayer: any = svg.append('g')
var nodeLayer: any = svg.append('g')
var labelLayer: any = svg.append('g')



var visualNodes: any;
var nodeLabels: any;
var nodeLabelOutlines: any;
var visualLinks: any;
var layout: any;

// line function for curved links
var lineFunction: any = d3.svg.line() // only line() d3 v4
    .x(function (d: any) { return d.x; })
    .y(function (d: any) { return d.y; })
    .interpolate("basis")// d3 v4 is .curve(d3.curveLinear);

for (var i = 0; i < nodes.length; i++) {
    (nodes as any)[i]['width'] = getNodeRadius(nodes[i]) * 2;
    (nodes as any)[i]['height'] = getNodeRadius(nodes[i]) * 2;
}

/* d3 v3 */
layout = d3.layout.force()
    // layout = cola.d3adaptor()
    .linkDistance(30)
    .size([width, height])
    .nodes(nodes)
    .links(links)
    .on('end', () => {
        unshowMessage();
        updateNodes();
        updateLinks();
        updateLayout();
        // package layout coordinates
        var coords = []
        for (var i = 0; i < nodes.length; i++) {
            coords.push({ x: (nodes[i] as any).x, y: (nodes[i] as any).y })
        }
        messenger.sendMessage('layout', { coords: coords })
    })
    .start()


/* d3 v4 */
/*
layout = d3.forceSimulation()
    .force("link", d3.forceLink().distance(30).strength(0.1))
    .nodes(nodes)
    .force("link", d3.forceLink().links(links))
    .on('end', () => {
        unshowMessage();

        updateNodes();
        updateLinks();
        updateLayout();
        // package layout coordinates
        var coords: any = []
        for (var i = 0; i < nodes.length; i++) {
            coords.push({ x: (nodes[i] as any).x, y: (nodes[i] as any).y })
        }
        messenger.sendMessage('layout', { coords: coords })
    })
*/

// show layout-message    
showMessage('Calculating<br/>layout');

init();
function init() {
    // CREATE NODES:
    // node circles

    visualNodes = nodeLayer.selectAll('nodes')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('r', (n: dynamicgraph.Node) => getNodeRadius(n))
        .attr('class', 'nodes')
        .style('fill', COLOR_DEFAULT_NODE)
        .on('mouseover', mouseOverNode)
        .on('mouseout', mouseOutNode)
        .on('click', (d: any) => {
            var selections = d.getSelections();
            var currentSelection = dgraph.getCurrentSelection();
            for (var j = 0; j < selections.length; j++) {
                if (selections[j] == currentSelection) {
                    messenger.selection('remove', <utils.ElementCompound>{ nodes: [d] });
                    return;
                }
            }
            messenger.selection('add', <utils.ElementCompound>{ nodes: [d] });
        })


    // node labels 

    nodeLabelOutlines = labelLayer.selectAll('.nodeLabelOutlines')
        .data(nodes)
        .enter()
        .append('text')
        .attr('z', 2)
        .text((d: any) => d.label())
        .style('font-size', 12)
        .attr('visibility', 'hidden')
        .attr('class', 'nodeLabelOutlines')

    nodeLabels = labelLayer.selectAll('nodeLabels')
        .data(nodes)
        .enter()
        .append('text')
        .attr('z', 2)
        .text((d: any) => d.label())
        .style('font-size', 12)
        .attr('visibility', 'hidden')



    // CREATE LINKS
    calculateCurvedLinks();
    console.log("VISUALLINKS");
    visualLinks = linkLayer.selectAll('visualLinks')
        .data(links)
        .enter()
        .append('path')
        .attr('d', (d: any) => lineFunction(d.path))
        .style('opacity', LINK_OPACITY)
        .on('mouseover', (d: any, i: any) => {
            messenger.highlight('set', <utils.ElementCompound>{ links: [d] })
        })
        .on('mouseout', (d: any) => {
            messenger.highlight('reset')
        })
        .on('click', (d: any) => {
            var selections = d.getSelections();
            var currentSelection = dgraph.getCurrentSelection();
            for (var j = 0; j < selections.length; j++) {
                if (selections[j] == currentSelection) {
                    messenger.selection('remove', <utils.ElementCompound>{ links: [d] });
                    return;
                }
            }
            messenger.selection('add', <utils.ElementCompound>{ links: [d] });
        })


    updateLinks();
    updateNodes();

    updateLayout();
}

function updateLayout() {

    // update node positions
    visualNodes
        .attr('cx', (d: any, i: any) => d.x)
        .attr('cy', (d: any, i: any) => d.y)

    nodeLabels
        .attr('x', (d: any, i: any) => d.x + OFFSET_LABEL.x)
        .attr('y', (d: any, i: any) => d.y + OFFSET_LABEL.y)
    nodeLabelOutlines
        .attr('x', (d: any, i: any) => d.x + OFFSET_LABEL.x)
        .attr('y', (d: any, i: any) => d.y + OFFSET_LABEL.y)


    // update link positions
    calculateCurvedLinks();
    console.log("VISUALLINK2")
    visualLinks
        .attr('d', (d: any) => lineFunction(d.path))


    // update nodelabel visibility after layout update.
    updateLabelVisibility();

    // webgl.render();

}
function getLabelWidth(n: any) {
    return n.label().length * 8.5 + 10
}
function getLabelHeight(n: any) {
    return 18;
}
function getNodeRadius(n: dynamicgraph.Node) {
    return Math.sqrt(n.links().length) * NODE_SIZE + 1;
}


function updateLabelVisibility() {
    hiddenLabels = [];
    if (LABELING_STRATEGY == 0) { // automatic
        var n1: any, n2: any;
        for (var i = 0; i < nodesOrderedByDegree.length; i++) {
            n1 = nodesOrderedByDegree[i];
            if (hiddenLabels.indexOf(n1) > -1)
                continue;
            for (var j = i + 1; j < nodesOrderedByDegree.length; j++) {
                n2 = nodesOrderedByDegree[j];
                if (hiddenLabels.indexOf(n2) > -1)
                    continue;
                if (areNodeLabelsOverlapping(n1, n2)) {
                    hiddenLabels.push(n2)
                } else if (isHidingNode(n1, n2)) {
                    hiddenLabels.push(n1)
                    break;
                }
            }
        }
    } else if (LABELING_STRATEGY == 1) { // hide all
        hiddenLabels = nodes.slice(0);
    } else if (LABELING_STRATEGY == 2) { // show all
        hiddenLabels = [];
    } else if (LABELING_STRATEGY == 3) { // neighbors of highligted nodes
        hiddenLabels = nodes.slice(0);
    }

    // render;
    nodeLabels.attr('visibility', (n: any) => hiddenLabels.indexOf(n) > -1 ? 'hidden' : 'visible')
    nodeLabelOutlines.attr('visibility', (n: any) => hiddenLabels.indexOf(n) > -1 ? 'hidden' : 'visible')
}


function areNodeLabelsOverlapping(n1: any, n2: any) {
    var n1e = n1.x + getLabelWidth(n1) / 2 + LABELDISTANCE;
    var n2e = n2.x + getLabelWidth(n2) / 2 + LABELDISTANCE;
    var n1w = n1.x - getLabelWidth(n1) / 2 - LABELDISTANCE;
    var n2w = n2.x - getLabelWidth(n2) / 2 - LABELDISTANCE;
    var n1n = n1.y + getLabelHeight(n1) / 2 + LABELDISTANCE;
    var n2n = n2.y + getLabelHeight(n2) / 2 + LABELDISTANCE;
    var n1s = n1.y - getLabelHeight(n1) / 2 - LABELDISTANCE;
    var n2s = n2.y - getLabelHeight(n2) / 2 - LABELDISTANCE;

    return (n1e > n2w && n1w < n2e && n1s < n2n && n1n > n2s)
        || (n1e > n2w && n1w < n2e && n1n > n2s && n1s < n2n)
        || (n1w < n2e && n1s > n2n && n1s < n2n && n1n > n2s)
        || (n1w < n2e && n1n < n2s && n1n > n2s && n1s < n2n)
}

function isHidingNode(n1: any, n2: any) {
    var n1e = n1.x + getLabelWidth(n1) / 2 + LABELDISTANCE;
    var n1w = n1.x - getLabelWidth(n1) / 2 - LABELDISTANCE;
    var n1n = n1.y + getLabelHeight(n1) / 2 + LABELDISTANCE;
    var n1s = n1.y - getLabelHeight(n1) / 2 - LABELDISTANCE;
    return n1w < n2.x && n1e > n2.x && n1n < n2.y && n1s > n2.y;
}


/////////////////////
//// INTERACTION ////
/////////////////////

function mouseOverNode(n: any) {
    var newElementCompound: utils.ElementCompound = new utils.ElementCompound();
    newElementCompound.nodes = [n]
    messenger.highlight('set', newElementCompound)
    // BEFORE
    // messenger.highlight('set', { nodes: [n] })
}
function mouseOutNode(n: any) {
    messenger.highlight('reset')
}




/////////////////
//// UPDATES ////
/////////////////

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
    // if(time_end==undefined){
    //     time_end = times[times.length-1]
    // }

    timeSlider.set(m.startUnix, m.endUnix);
    updateLinks();
    updateNodes();
}


function updateEvent(m: messenger.Message) {
    updateLinks();
    updateNodes();
}

function updateNodeSize() {
    visualNodes
        .attr('r', (n: any) => getNodeRadius(n))


}

function updateNodes() {
    visualNodes
        .style('fill', (d: any) => {
            var color: string | undefined;
            if (d.isHighlighted()) {
                color = COLOR_HIGHLIGHT;
            } else {
                color = utils.getPriorityColor(d);
            }
            if (!color)
                color = COLOR_DEFAULT_NODE;
            return color;
        })
        .style('opacity', (d: any) => {
            var visible: boolean = d.isVisible();
            if (!visible)
                return 0;
            else
                return 1;
        })



    nodeLabels
        .attr('visibility', (e: any) => e.isHighlighted()
            || e.links().highlighted().length > 0
            || hiddenLabels.indexOf(e) == -1
            || (LABELING_STRATEGY == 3 && e.neighbors().highlighted().length > 0)
            ? 'visible' : 'hidden')

        .style('color', (d: any) => {
            var color: string | undefined; // BEFORE string
            if (d.isHighlighted()) {
                color = COLOR_HIGHLIGHT;
            } else {
                color = utils.getPriorityColor(d);
            }
            if (!color)
                color = COLOR_DEFAULT_NODE;
            return color;
        })

    nodeLabelOutlines
        .attr('visibility', (e: any) => e.isHighlighted()
            || e.links().highlighted().length > 0
            || hiddenLabels.indexOf(e) == -1
            || (LABELING_STRATEGY == 3 && e.neighbors().highlighted().length > 0)
            ? 'visible' : 'hidden')

}

function updateLinks() {
    visualLinks
        .style('stroke', function (d: any) {
            var color = utils.getPriorityColor(d);
            if (!color)
                color = COLOR_DEFAULT_LINK;
            return color;
        })
        .style('opacity', (d: any) => {
            var visible: boolean = d.isVisible();
            if (!visible
                || !d.source.isVisible()
                || !d.target.isVisible())
                return 0;
            if (d.presentIn(time_start, time_end)) {
                return d.isHighlighted() || d.source.isHighlighted() || d.target.isHighlighted() ?
                    Math.min(1, LINK_OPACITY + .2) : LINK_OPACITY;
            } else {
                return 0;
            }
        })
        .style('stroke-width', function (d: any) {
            var w: any = linkWeightScale(d.weights(time_start, time_end).mean());
            return d.isHighlighted() ? w * 2 : w;
        })


}

function calculateCurvedLinks() {
    var path: any, dir: any, offset: any, offset2: any, multiLink: dynamicgraph.NodePair | undefined;
    var links: dynamicgraph.Link[];
    for (var i = 0; i < dgraph.nodePairs().length; i++) {
        multiLink = dgraph.nodePair(i);
        if (multiLink) {
            if (multiLink.links().length < 2) {
                (multiLink.links().toArray() as any)[0]['path'] = [
                    { x: (multiLink.source as any).x, y: (multiLink.source as any).y },
                    { x: (multiLink.source as any).x, y: (multiLink.source as any).y },
                    { x: (multiLink.target as any).x, y: (multiLink.target as any).y },
                    { x: (multiLink.target as any).x, y: (multiLink.target as any).y }]
            } else {
                links = multiLink.links().toArray();
                // Draw self-links as back-link
                if (multiLink.source == multiLink.target) {
                    var minGap = getNodeRadius(multiLink.source) / 2 + 4;
                    for (var j = 0; j < links.length; j++) {
                        (links as any)[j]['path'] = [
                            { x: (multiLink.source as any).x, y: (multiLink.source as any).y },
                            { x: (multiLink.source as any).x, y: (multiLink.source as any).y - minGap - (i * LINK_GAP) },
                            { x: (multiLink.source as any).x + minGap + (i * LINK_GAP), y: (multiLink.source as any).y - minGap - (i * LINK_GAP) },
                            { x: (multiLink.source as any).x + minGap + (i * LINK_GAP), y: (multiLink.source as any).y },
                            { x: (multiLink.source as any).x, y: -(multiLink.source as any).y },
                        ]
                    }
                    // non-self links
                } else {

                    dir = {
                        x: (multiLink.target as any).x - (multiLink.source as any).x,
                        y: (multiLink.target as any).y - (multiLink.source as any).y
                    }
                    // normalize
                    offset = stretchVector([-dir.y, dir.x], LINK_GAP)
                    offset2 = stretchVector([dir.x, dir.y], LINK_GAP)

                    // calculate paths
                    for (var j = 0; j < links.length; j++) {
                        (links[j] as any)['path'] = [
                            { x: (multiLink.source as any).x, y: (multiLink.source as any).y },
                            {
                                x: (multiLink.source as any).x + offset2[0] + (j - links.length / 2 + .5) * offset[0],
                                y: ((multiLink.source as any).y + offset2[1] + (j - links.length / 2 + .5) * offset[1])
                            },
                            {
                                x: (multiLink.target as any).x - offset2[0] + (j - links.length / 2 + .5) * offset[0],
                                y: ((multiLink.target as any).y - offset2[1] + (j - links.length / 2 + .5) * offset[1])
                            },
                            { x: (multiLink.target as any).x, y: (multiLink.target as any).y }]
                    }

                }

            }
        }
    }
}
function stretchVector(vec: any, finalLength: any) {
    var len: number = 0
    for (var i: number = 0; i < vec.length; i++) {
        len += Math.pow(vec[i], 2)
    }
    len = Math.sqrt(len)
    for (var i: number = 0; i < vec.length; i++) {
        vec[i] = vec[i] / len * finalLength
    }

    return vec
}

// var visualLassoPoints:svg.WebGLElementQuery;
// function lassoMoveHandler(lassoPoints:number[][]){

//     if(visualLassoPoints != undefined)
//         visualLassoPoints.removeAll();

//     visualLassoPoints = svg.selectAll('visualLassoPoints')
//         .data(lassoPoints)
//         .append('circle')
//             .attr('r', 1)
//             .style('fill', '#ff9999')
//             .attr('x', (d)=>d[0])
//             .attr('y', (d)=>d[1])

// }


// function lassoEndHandler(lassoPoints:number[][]){

//     if(visualLassoPoints != undefined)
//         visualLassoPoints.removeAll();


//     var selectedNodes = []
//     for(var i=0 ; i <nodes.length ; i++){
//         if(networkcube.isPointInPolyArray(lassoPoints, [nodes[i].x, nodes[i].y]))
//             selectedNodes.push(nodes[i])
//     }   
//     console.log('Selected nodes:', selectedNodes.length)
//     // get links in selection
//     var selectedLinks = []
//     var incidentLinks = [];
//     for(var i=0 ; i <selectedNodes.length ; i++){
//         for(var j=i+1 ; j <selectedNodes.length ; j++){
//             // incidentLinks = dgraph.linksBetween(selectedNodes[i], selectedNodes[j]).presentIn(time_start,time_end).toArray() 
//             incidentLinks = dgraph.linksBetween(selectedNodes[i], selectedNodes[j]).toArray() 
//             selectedLinks = selectedLinks.concat(incidentLinks);
//         }   
//     }   
//     console.log('Selected links:', selectedLinks.length)
//     if(selectedNodes.length > 0){
//         networkcube.selection('set', {nodes:selectedNodes, links:selectedLinks})
//     }
// }

function showMessage(message: string) {
    if ($('#messageBox'))
        $('#messageBox').remove();

    $('#visDiv').append('<div id="messageBox"><p>' + message + '</p></div>');

}

function unshowMessage() {
    if ($('#messageBox'))
        $('#messageBox').remove();
}



