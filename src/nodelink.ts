/// <reference path="./lib/d3.d.ts"/>

import * as dynamicgraph from 'vistorian-core/src/dynamicgraph';
import * as utils from 'vistorian-core/src/utils';
import * as main from 'vistorian-core/src/main';
import * as messenger from 'vistorian-core/src/messenger';

import * as ui from 'vistorian-core/src/ui';
import * as timeslider from 'vistorian-core/src/timeslider';

var COLOR_DEFAULT_LINK: string = '#999999';
var COLOR_DEFAULT_NODE: string = '#333333';
var COLOR_HIGHLIGHT: string = '#ff8800';
var LINK_OPACITY: number = .5;
var NODE_OPACITY: number = 1;
var LINK_WIDTH: number = 1;
var OFFSET_LABEL = { x: 5, y: 4 }
var LINK_GAP: number = 2;
var LAYOUT_TIMEOUT: number = 3000;
var LABELBACKGROUND_OPACITY: number = 1;
var LABELDISTANCE: number = 10;
var SLIDER_WIDTH: number = 100
var SLIDER_HEIGHT: number = 35;
var NODE_SIZE: number = 10;

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
var directed = dgraph.directed;

var nodes: any = dgraph.nodes().toArray();
var nodesOrderedByDegree: dynamicgraph.Node[] = dgraph.nodes().toArray().sort((n1: any, n2: any) => n2.neighbors().length - n1.neighbors().length);

var nodePairs: dynamicgraph.NodePairQuery = dgraph.nodePairs();
var links: any = dgraph.links().toArray();
var linkArrays = dgraph.linkArrays;
links = addDirectionToLinks(links, linkArrays);
var nodeLength: number = nodes.length;

//When a link row is hovered over in dataview.ts, a message is received here to highlight the corresponding link.
var bcLink = new BroadcastChannel('row_hovered_over_link');
bcLink.onmessage = function (ev) {
    updateLinks(ev.data.id)
};

//When a node row is hovered over in dataview.ts, a message is received here to highlight the corresponding link.
var bcNode = new BroadcastChannel('row_hovered_over_node');
bcNode.onmessage = function (ev) {
    updateNodes(ev.data.id)
};

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
messenger.addEventListener(messenger.MESSAGE_SET_STATE, setStateHandler);
messenger.addEventListener(messenger.MESSAGE_GET_STATE, getStateHandler);



// MENU
var menuDiv = d3.select('#menuDiv');
/* widget/ui.js */
ui.makeSlider(menuDiv, 'Link Opacity', SLIDER_WIDTH, SLIDER_HEIGHT, LINK_OPACITY, 0, 1, function (value: number) {
    LINK_OPACITY = value;
    updateLinks();
})
ui.makeSlider(menuDiv, 'Node Opacity', SLIDER_WIDTH, SLIDER_HEIGHT, NODE_OPACITY, 0, 1, function (value: number) {
    NODE_OPACITY = value;
    updateNodes();
})
ui.makeSlider(menuDiv, 'Node Size', SLIDER_WIDTH, SLIDER_HEIGHT, NODE_SIZE, .01, 30, function (value: number) {
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
        .attr('onchange','trace.event(\'vis_9\',\'Node Link\',\'selection-input_' + name + '\',this.value)')

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

function addDirectionToLinks(links: any, linkArrays: any) {
    for(var i=0 ; i <links.length ; i++){
        var directionValue = linkArrays.directed[i];

        if (["yes","true"].indexOf(directionValue) > -1 || directed){
            links[i].directed = true;
        }
        //else if(["no","false"].indexOf(directionValue) > -1) {links[i].directed = false;}
        else{
            links[i].directed = false;
        }
    }
    return links;
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

console.log(dgraph);
var mouseStart: number[];
var panOffsetLocal: number[] = [0, 0];
var panOffsetGlobal: number[] = [0, 0];

var isMouseDown: boolean = false;
var globalZoom: number = 1;

var svg: any = d3.select('#visSvg')
    .on('mousedown', () => {
        isMouseDown = true;
        // <MouseEvent>
        mouseStart = [(d3.event).x, (d3.event).y];
    })
    .on('mousemove', () => {
        if (isMouseDown) {
            panOffsetLocal[0] = ((d3.event).x - mouseStart[0]) * globalZoom;
            panOffsetLocal[1] = ((d3.event).y - mouseStart[1]) * globalZoom;
            svg.attr("transform", "translate(" + (panOffsetGlobal[0] + panOffsetLocal[0]) + ',' + (panOffsetGlobal[1] + panOffsetLocal[1]) + ")");
        }
    })
    .on('mouseup', () => {
        isMouseDown = false;
        panOffsetGlobal[0] += panOffsetLocal[0]
        panOffsetGlobal[1] += panOffsetLocal[1]
    })
    .on('wheel.zoom', (e) => {
        // zoom
        (<any>d3.event).preventDefault();
        (<any>d3.event).stopPropagation();
        var globalZoom = 1 + (<any>d3.event).wheelDelta / 1000;
        var mouse = [(d3.event).x - panOffsetGlobal[0], (d3.event).y - panOffsetGlobal[1]];
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
    .interpolate("none")
    // .interpolate("basis")// d3 v4 is .curve(d3.curveLinear);

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

for (var i = 0; i < nodes.length; i++) {
    (nodes as any)[i]['width'] = getNodeRadius(nodes[i]) * 2;
    (nodes as any)[i]['height'] = getNodeRadius(nodes[i]) * 2;
}

/* d3 v3 */
layout = d3.layout.force()
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

    visualNodes = nodeLayer.selectAll('nodes')
        .data(nodes)
        .enter()
        .append('path')
        // @ts-ignore
        .attr('d', (n: dynamicgraph.Node) => d3.svg.symbol().type(getNodeShape(n))())
        .attr('class', 'nodes')
        .style('fill', (n: dynamicgraph.Node) => getNodeColor(n)) 
        .attr('onclick','trace.event(\'vis_29\',document.location.pathname,\'Node\',\'Click\')')
        .attr('onmouseover','trace.event(\'vis_30\',document.location.pathname,\'Node\',\'Mouse Over\')')
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
    visualLinks = linkLayer.selectAll('visualLinks')
        .data(links)
        .enter()
        .append('path')
        // .attr("marker-end", "url(#triangle)")
        .attr('d', (d: any) => lineFunction(d.path))
        .attr('onclick','trace.event(\'vis_31\',document.location.pathname,\'Link\',\'Click\')')
        .attr('onmouseover','trace.event(\'vis_32\',document.location.pathname,\'Link\',\'Mouse Over\')')
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
    updateNodeSize();

    updateLayout();
}

function updateLayout() {

    // update node positions
    visualNodes
        .attr('transform', function(d: any){
                return 'translate('+ d.x +','+ d.y +')'
        })


    nodeLabels
        .attr('x', (d: any, i: any) => d.x + OFFSET_LABEL.x)
        .attr('y', (d: any, i: any) => d.y + OFFSET_LABEL.y)
    nodeLabelOutlines
        .attr('x', (d: any, i: any) => d.x + OFFSET_LABEL.x)
        .attr('y', (d: any, i: any) => d.y + OFFSET_LABEL.y)


    // update link positions
    calculateCurvedLinks();
    visualLinks
        .attr('d', (d: any) => lineFunction(d.path))


    // update nodelabel visibility after layout update.
    updateLabelVisibility();

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


function getNodeColor(n: dynamicgraph.Node) {
    if( n.color().split('#')[0] !== ",") {
        return n.color().split('#')[1];
    }
    return 'black'
}

function getNodeShape(n: dynamicgraph.Node) {
    var tmp = n.shape().split(',');
    if(tmp && tmp[0]) {
        return tmp[tmp.length - 1];
    }
    return 'circle'
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


function setStateHandler(m: messenger.SetStateMessage){
    
    var state: messenger.NodeLinkControls = m.state as messenger.NodeLinkControls;    
    // unpack / query that state object
    // e.g., var params = state.params.
    // set the parameters below:...

    
    // set link opacity
    LINK_OPACITY = state.linkOpacity;
    updateLinks();

    // set node opacity
    NODE_OPACITY = state.nodeOpacity;
    updateNodes();

    // set node size
    NODE_SIZE = state.nodeSize;
    updateNodeSize();

    LINK_GAP = state.edgeGap;
    updateLayout();

    // set linkwidh
    LINK_WIDTH = state.linkWidth;
    linkWeightScale.range([0, LINK_WIDTH]);
    updateLinks();

    
    LABELING_STRATEGY = state.labellingType;
    updateLabelVisibility();

    // set time (start/end)
     messenger.timeRange(state.timeSliderStart, state.timeSliderEnd, times[0], true);
  //timeSlider.set(state.timeSliderStart, state.timeSliderEnd);
    updateLinks();
    updateNodes();

    // set pan
    panOffsetLocal=state.panOffsetLocal;
    panOffsetGlobal =state.panOffsetGlobal;

    //set zoom
    globalZoom = state.globalZoom;

    updateLayout();
    // svg.attr("transform", "translate(" + (panOffsetGlobal[0] + panOffsetLocal[0]) + ',' + (panOffsetGlobal[1] + panOffsetLocal[1]) + ")");


}


function getStateHandler( m: messenger.GetStateMessage){
    
    if (m.viewType=="nodelink" ){
        var nlNetwor: messenger.NetworkControls;
        nlNetwor=new messenger.NodeLinkControls("nodelink",time_start.unixTime(),time_end.unixTime(),globalZoom,panOffsetLocal,panOffsetGlobal,LINK_OPACITY,NODE_OPACITY,NODE_SIZE,LINK_GAP,LINK_WIDTH,LABELING_STRATEGY);
      //  var states=JSON.parse(localStorage.getItem("currentCapturedStates") || "[]" ) ;
    //    states.push(nlNetwor);
       /*  if (m.bookmarkIndex>-1){
            var bookmarksArray=JSON.parse(localStorage.getItem("vistorianBookmarks") || "[]");
            bookmarksArray[m.bookmarkIndex].controlsValues[0]=nlNetwor;
            localStorage.setItem("vistorianBookmarks", JSON.stringify(bookmarksArray))
        }
        else{
           states.push(nlNetwor); 
           localStorage.setItem("currentCapturedStates", JSON.stringify(states));
    
       // localStorage.setItem("currentCapturedStates", JSON.stringify(nlNetwor));
    }
        messenger.stateCreated(nlNetwor,m.bookmarkIndex);
    
    } */
 //   var isNew=(m.bookmarkIndex<0?true:false);
 //   localStorage.setItem("currentCapturedStates", JSON.stringify(nlNetwor));
    messenger.stateCreated(nlNetwor,m.bookmarkIndex,m.viewType,m.isNewBookmark);
   // messenger.stateCreated(nlNetwor,m.bookmarkIndex,m.viewType,isNew);

    }

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
    updateLinks();
    updateNodes();
}


function updateEvent(m: messenger.Message) {
    updateLinks();
    updateNodes();
}

function updateNodeSize() {
    visualNodes
        // .attr('r', (n: any) => getNodeRadius(n))
        //@ts-ignore
        .attr('d', (n: any) => d3.svg.symbol().size(getNodeRadius(n)).type(getNodeShape(n))())
}

function updateNodes(highlightId?: number) {
    visualNodes
        .style('fill', (d: any) => {
            var color: string | undefined;
            if(highlightId && highlightId == d._id){
                color = COLOR_HIGHLIGHT;
            }
            else if(d.isHighlighted()){
                color = COLOR_HIGHLIGHT;
            } else {
                color = utils.getPriorityColor(d);
            }
            if (!color)
                color = getNodeColor(d);
            return color;
        })
        .style('opacity', (d: any) => {
            var visible: boolean = d.isVisible();
            if (!visible)
                return 0;
            else
                return NODE_OPACITY;
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

//Optional parameter highlightId used to highlight specific link on receiving hoverover message.
function updateLinks(highlightId?: number){
    visualLinks
        .attr('marker-end',function (d: any) {
            if(d.directed){
                var color = utils.getPriorityColor(d);
                if(!color)
                    color = COLOR_DEFAULT_LINK;
                if(highlightId && highlightId == d._id) {
                    return 'black';
                }
                return marker(color);
            }
        })
        .style('stroke', function (d: any) {
            var color = utils.getPriorityColor(d);
            if (!color)
                color = COLOR_DEFAULT_LINK;
            if(highlightId && highlightId == d._id) {
                return 'black';
            }
            return color;
        })
        .style('opacity', (d: any) => {
            var visible: boolean = d.isVisible();
            if (!visible
                || !d.source.isVisible()
                || !d.target.isVisible())
                return 0;
            if(d.presentIn(time_start, time_end)){
                if(highlightId && highlightId == d._id) {
                    return 1;
                }
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

function calculateCurvedLinks()
{
    var path: any, dir: any, offset: any, offset2: any, multiLink: dynamicgraph.NodePair | undefined;
    var links: dynamicgraph.Link[];
    for (var i = 0; i < dgraph.nodePairs().length; i++) {
        multiLink = dgraph.nodePair(i);
        if (multiLink) {
            if (multiLink.links().length < 2) {
                (multiLink.links().toArray() as any)[0]['path'] = [
                    { x: (multiLink.source as any).x, y: (multiLink.source as any).y },
                    // { x: (multiLink.source as any).x, y: (multiLink.source as any).y },
                    // { x: (multiLink.target as any).x, y: (multiLink.target as any).y },
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
                        if (links[j] as any) {
                            (links[j] as any)['path'] = [
                                {x: (multiLink.source as any).x, y: (multiLink.source as any).y},
                                //Curved links
                                {
                                    x: (multiLink.source as any).x + offset2[0] + (j - links.length / 2 + .5) * offset[0],
                                    y: ((multiLink.source as any).y + offset2[1] + (j - links.length / 2 + .5) * offset[1])
                                },
                                {
                                    x: (multiLink.target as any).x - offset2[0] + (j - links.length / 2 + .5) * offset[0],
                                    y: ((multiLink.target as any).y - offset2[1] + (j - links.length / 2 + .5) * offset[1])
                                },
                                {x: (multiLink.target as any).x, y: (multiLink.target as any).y}]
                        }
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
function showMessage(message: string) {
    if ($('#messageBox'))
        $('#messageBox').remove();

    $('#visDiv').append('<div id="messageBox"><p>' + message + '</p></div>');

}

function unshowMessage() {
    if ($('#messageBox'))
        $('#messageBox').remove();
}



