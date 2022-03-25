import * as d3 from "d3";

import * as dynamicgraph from "vistorian-core/src/data/dynamicgraph";
import * as utils from "vistorian-core/src/data/utils";
import * as main from "vistorian-core/src/data/main";
import * as messenger from "vistorian-core/src/data/messenger";

import * as ui from "vistorian-core/src/ui/ui";
import * as timeslider from "vistorian-core/src/ui/timeslider";
import { Selection } from "vistorian-core/src/data/dynamicgraphutils";

const COLOR_DEFAULT_LINK = "#999999";
const COLOR_DEFAULT_NODE = "#333333";
const COLOR_HIGHLIGHT = "#ff8800";
const OPACITY_UNSELECTED = .2;

let LINK_OPACITY = 0.5;
let NODE_OPACITY = 1;
let LINK_WIDTH_SCALE = 1;
const OFFSET_LABEL = { x: 5, y: 4 };
let LINK_GAP = 2;

const LABELDISTANCE = 10;
const SLIDER_WIDTH = 100;
const SLIDER_HEIGHT = 35;
let NODE_SIZE = 10;

const width = window.innerWidth;
const height = window.innerHeight - 100;

const TIMELINE_HEIGHT = 50;

// get dynamic graph
const dgraph: dynamicgraph.DynamicGraph = main.getDynamicGraph();
const times: dynamicgraph.Time[] = dgraph.times().toArray();
let time_start: dynamicgraph.Time = times[0];
let time_end: dynamicgraph.Time = times[times.length - 1];
const directed = dgraph.directed;

const nodes: any = dgraph.nodes().toArray();
const nodesOrderedByDegree: dynamicgraph.Node[] = dgraph
  .nodes()
  .toArray()
  .sort((n1: any, n2: any) => n2.neighbors().length - n1.neighbors().length);

let links: any = dgraph.links().toArray();
const linkArrays = dgraph.linkArrays;
links = addDirectionToLinks(links, linkArrays);

//When a link row is hovered over in dataview.ts, a message is received here to highlight the corresponding link.
const bcLink = new BroadcastChannel("row_hovered_over_link");
bcLink.onmessage = function (ev) {
  updateLinks(ev.data.id);
};

//When a node row is hovered over in dataview.ts, a message is received here to highlight the corresponding link.
const bcNode = new BroadcastChannel("row_hovered_over_node");
bcNode.onmessage = function (ev) {
  updateNodes(ev.data.id);
};

// states
let hiddenLabels: any = [];
let LABELING_STRATEGY = 0;

const linkWeightScale = d3.scaleLinear().range([1, 1]);

if (dgraph.links().weights().max() > 1) {
  linkWeightScale.range([1, 3]); // if this is a weighted graph, the largest link is three times as thick as the normal (non-weighted) one.
}
linkWeightScale.domain([0, dgraph.links().weights().max()]);

messenger.setDefaultEventListener(updateEvent);
messenger.addEventListener(messenger.MESSAGE_SET_STATE, setStateHandler);
messenger.addEventListener(messenger.MESSAGE_GET_STATE, getStateHandler);

// MENU
const menuDiv = d3.select("#menuDiv");
/* widget/ui.js */
ui.makeSlider(
  menuDiv,
  "Link Opacity",
  SLIDER_WIDTH,
  SLIDER_HEIGHT,
  LINK_OPACITY,
  0,
  1,
  function (value: number) {
    LINK_OPACITY = value;
    updateLinks();
  }
);
ui.makeSlider(
  menuDiv,
  "Node Opacity",
  SLIDER_WIDTH,
  SLIDER_HEIGHT,
  NODE_OPACITY,
  0,
  1,
  function (value: number) {
    NODE_OPACITY = value;
    updateNodes();
  }
);
ui.makeSlider(
  menuDiv,
  "Node Size",
  SLIDER_WIDTH,
  SLIDER_HEIGHT,
  NODE_SIZE,
  0.01,
  30,
  function (value: number) {
    NODE_SIZE = value;
    updateNodeSize();
  }
);
ui.makeSlider(
  menuDiv,
  "Edge Gap",
  SLIDER_WIDTH,
  SLIDER_HEIGHT,
  LINK_GAP,
  0,
  10,
  function (value: number) {
    LINK_GAP = value;
    updateLayout();
  }
);
ui.makeSlider(
  menuDiv,
  "Link Width",
  SLIDER_WIDTH,
  SLIDER_HEIGHT,
  LINK_WIDTH_SCALE,
  0,
  10,
  function (value: number) {
    LINK_WIDTH_SCALE = value;
    updateLinks();
  }
);
makeDropdown(
  menuDiv,
  "Labeling",
  ["Automatic/Importance", "Hide All", "Show All"],
  (selection: any) => {
    LABELING_STRATEGY = parseInt(selection);
    updateLabelVisibility();
  }
);

function makeDropdown(
  d3parent: any,
  name: string,
  values: string[],
  callback: (selection: any) => void
) {
  const s: any = d3parent
    .append("select")
    .attr("id", "selection-input_" + name)
    .attr(
      "onchange",
      "trace.event('vis_9','Node Link','selection-input_" +
        name +
        "',this.value)"
    );

  s.append("option").html("Chose " + name + ":");

  values.forEach((v: any, i: number) => {
    s.append("option").attr("value", i).html(v);
  });

  s.on("change", () => {
    const e = document.getElementById(
      "selection-input_" + name
    ) as HTMLSelectElement;
    callback(e.options[e.selectedIndex].value);
  });
}

function addDirectionToLinks(links: any, linkArrays: any) {
  for (let i = 0; i < links.length; i++) {
    const directionValue = linkArrays.directed[i];

    links[i].directed = !!(
      ["yes", "true"].includes(directionValue) || directed
    );
  }
  return links;
}

// TIMELINE
const timeSvg: any = d3
  .select("#timelineDiv")
  .append("svg")
  .attr("width", width)
  .attr("height", TIMELINE_HEIGHT);

let timeSlider: timeslider.TimeSlider;
if (dgraph.times().size() > 1) {
  timeSlider = new timeslider.TimeSlider(dgraph, width - 50);
  timeSlider.appendTo(timeSvg);
  messenger.addEventListener("timeRange", timeChangedHandler);
}

const svgElement = document.createElement("svg");
const visDiv = document.getElementById("visDiv");
if (visDiv) {
  visDiv.appendChild(svgElement);
  svgElement.outerHTML =
    '<svg id="visSvg" width="' +
    (width - 20) +
    '" height="' +
    (height - 20) +
    '"></svg>';
}

console.log(dgraph);
let mouseStart: number[];
let mouseEnd: number[];

let panOffsetLocal: number[] = [0, 0];
let panOffsetGlobal: number[] = [0, 0];

let isMouseDown = false;
let globalZoom = 1;

let shiftDown = false;

const parentSvg: any = d3.select("#visSvg");

const svg = parentSvg.append("g").attr("width", width).attr("height", height);

const selectionRect = svg
  .append("rect")
  .attr("id", "selectionRect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", 0)
  .attr("height", 0)
  .style("opacity", 0.2);

parentSvg
  .on("mousedown", (ev: MouseEvent) => {
    isMouseDown = true;
    mouseStart = [ev.clientX, ev.clientY];
  })
  .on("mousemove", (ev: MouseEvent) => {
    if (isMouseDown && !shiftDown) {
      panOffsetLocal[0] = (ev.clientX - mouseStart[0]) * globalZoom;
      panOffsetLocal[1] = (ev.clientY - mouseStart[1]) * globalZoom;
      svg.attr(
        "transform",
        "translate(" +
          (panOffsetGlobal[0] + panOffsetLocal[0]) +
          "," +
          (panOffsetGlobal[1] + panOffsetLocal[1]) +
          ")"
      );
    } else if (isMouseDown) {
      mouseEnd = [ev.clientX, ev.clientY];

      // mouse positions are  clientX/clientY in local (DOM content) cooordinates - NOT relative to the parent SVG
      const { x: leftOffset, y: topOffset } = parentSvg
        .node()
        .getBoundingClientRect();

      const r_h = Math.abs(mouseStart[1] - mouseEnd[1]);
      const r_x =
        Math.min(mouseStart[0], mouseEnd[0]) - leftOffset - panOffsetGlobal[0];
      const r_w = Math.abs(mouseStart[0] - mouseEnd[0]);
      const r_y =
        Math.min(mouseStart[1], mouseEnd[1]) - topOffset - panOffsetGlobal[1];

      selectionRect
        .attr("x", r_x)
        .attr("width", r_w)
        .attr("y", r_y)
        .attr("height", r_h);
    }
  })
  .on("mouseup", (ev: MouseEvent) => {
    isMouseDown = false;
    if (shiftDown) {
      mouseEnd = [ev.clientX, ev.clientY];

      // mouse positions are  clientX/clientY in local (DOM content) cooordinates - NOT relative to the parent SVG
      const { x: leftOffset, y: topOffset } = parentSvg
        .node()
        .getBoundingClientRect();

      const r_h = Math.abs(mouseStart[1] - mouseEnd[1]);
      const r_x =
        Math.min(mouseStart[0], mouseEnd[0]) - leftOffset - panOffsetGlobal[0];
      const r_w = Math.abs(mouseStart[0] - mouseEnd[0]);
      const r_y =
        Math.min(mouseStart[1], mouseEnd[1]) - topOffset - panOffsetGlobal[1];

      selectionRect
        .attr("x", r_x)
        .attr("width", r_w)
        .attr("y", r_y)
        .attr("height", r_h);

      const selectedNodes = visualNodes.filter(function (
        d: any,
        i: number,
        nodes: any[]
      ) {
        const node = nodes[i];
        const [node_x, node_y] = node
          .getAttribute("transform")
          .replace("translate(", "")
          .replace(")", "")
          .split(",");
        return (
          +node_x >= r_x &&
          +node_x <= r_x + r_w &&
          +node_y >= r_y &&
          +node_y <= r_y + r_h
        );
      });

      // N.B. node objects are selectedNodes
      // ids are selectedNodes.data().map(d => d._id)
      // labels are selectedNodes.data().map(d => d.label())

      const newElementCompound: utils.ElementCompound =
        new utils.ElementCompound();
      newElementCompound.nodes = selectedNodes.data();
      messenger.highlight("set", newElementCompound, "RECTANGULAR_BRUSH");
    } else {
      panOffsetGlobal[0] += panOffsetLocal[0];
      panOffsetGlobal[1] += panOffsetLocal[1];
    }
  })
  .on("wheel.zoom", (ev: WheelEvent) => {
    // zoom
    ev.preventDefault();
    ev.stopPropagation();

    // The WheelEvent has a deltaMode attribute, which specifies unit for the delta values
    // https://www.w3.org/TR/uievents/#idl-wheelevent
    // It seems that Chrome provides values in pixels, whereas Firefox provides values in lines.
    const deltaMode = ev.deltaMode; //TODO: does this need a sourceEvent?
    const deltaY = ev.deltaY;
    let deltaPixels;
    if (deltaMode === 1) {
      deltaPixels = deltaY * 16;
    } else if (deltaMode === 0) {
      deltaPixels = deltaY;
    } else {
      console.log(
        `Encountered wheel event with unexpected deltaMode (${deltaMode}))`
      );
      deltaPixels = 0;
    }

    const globalZoom = 1 - deltaPixels / 1000;

    const mouse = [
      ev.clientX - panOffsetGlobal[0],
      ev.clientY - panOffsetGlobal[1],
    ];
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x = mouse[0] + (n.x - mouse[0]) * globalZoom;
      n.y = mouse[1] + (n.y - mouse[1]) * globalZoom;
    }

    // update selection rectangle position
    const newPos = {
      x1: mouse[0] + (+selectionRect.attr("x") - mouse[0]) * globalZoom,
      x2:
        mouse[0] +
        (+selectionRect.attr("x") + +selectionRect.attr("width") - mouse[0]) *
          globalZoom,

      y1: mouse[1] + (+selectionRect.attr("y") - mouse[1]) * globalZoom,
      y2:
        mouse[1] +
        (+selectionRect.attr("y") + +selectionRect.attr("height") - mouse[1]) *
          globalZoom,
    };
    selectionRect
      .attr("x", newPos.x1)
      .attr("width", newPos.x2 - newPos.x1)
      .attr("y", newPos.y1)
      .attr("height", newPos.y2 - newPos.y1);

    updateLayout();
    messenger.zoomInteraction("nodelink", "zoom");
  });

document.addEventListener("keydown", (event) => {
  if (event.key === "Shift") {
    shiftDown = true;
    // TODO: finish any in-progress pans
  }
});
document.addEventListener("keyup", (event) => {
  if (event.key === "Shift") {
    shiftDown = false;
  }
});

const linkLayer: any = svg.append("g");
const nodeLayer: any = svg.append("g");
const labelLayer: any = svg.append("g");

let visualNodes: any;
let nodeHighlights: any;
let nodeLabels: any;
let nodeLabelOutlines: any;
let visualLinks: any;
// let linkHighlights: any;

// line function for straight links
const lineFunction: any = d3
  .line()
  .x(function (d: any) {
    return d.x;
  })
  .y(function (d: any) {
    return d.y;
  })
  .curve(d3.curveBundle);

function marker(color: any) {
  svg
    .append("svg:defs")
    .append("svg:marker")
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

for (let i = 0; i < nodes.length; i++) {
  (nodes as any)[i]["width"] = getNodeRadius(nodes[i]) * 2;
  (nodes as any)[i]["height"] = getNodeRadius(nodes[i]) * 2;
}

d3.forceSimulation(nodes)
  .force("link", d3.forceLink(links).distance(30).strength(0.1))
  .force("charge", d3.forceManyBody())
  .force("center", d3.forceCenter(width / 2, height / 2))
  .on("end", () => {
    unshowMessage();

    updateNodes();
    updateLinks();
    updateLayout();
    // package layout coordinates
    const coords: any = [];
    for (let i = 0; i < nodes.length; i++) {
      coords.push({ x: (nodes[i] as any).x, y: (nodes[i] as any).y });
    }
    messenger.sendMessage("layout", { coords: coords });
  });

// show layout-message
showMessage("Calculating<br/>layout");

init();

function init() 
{
  
  nodeHighlights = linkLayer
    .selectAll("nodeHighlights") 
    .data(nodes)
    .enter()
    .append("circle")
    .attr('r', 10)
    // .style('opacity', .6)
    .attr("class", "nodeHighlights")
    .attr("class", "nodeHighlights")
    .style('stroke', '#ddd')
    .style("fill", '#eee')

  visualNodes = nodeLayer
    .selectAll("nodes")
    .data(nodes)
    .enter()
    .append("path")
    .attr("d", (n: dynamicgraph.Node) => d3.symbol().type(getNodeShape(n))())
    .attr("class", "nodes")
    .style("fill", (n: dynamicgraph.Node) => getNodeColor(n))
    // .attr(
    //   "onclick",
    //   "trace.event('vis_29',document.location.pathname,'Node','Click')"
    // )
    .on("click", mouseClickNode)
    .attr(
      "onmouseover",
      "trace.event('vis_30',document.location.pathname,'Node','Mouse Over')"
    )
    .on("mouseover", mouseOverNode)
    .on("mouseout", mouseOutNode)
    // .on("click", (ev: MouseEvent, d: any) => {
    //   const selections = d.getSelections();
    //   const currentSelection = dgraph.getCurrentSelection();
    //   for (let j = 0; j < selections.length; j++) {
    //     if (selections[j] == currentSelection) {
    //       messenger.selection("remove", <utils.ElementCompound>{ nodes: [d] });
    //       return;
    //     }
    //   }
    //   messenger.selection("add", <utils.ElementCompound>{ nodes: [d] });
    // });

  // node labels

  nodeLabelOutlines = labelLayer
    .selectAll(".nodeLabelOutlines")
    .data(nodes)
    .enter()
    .append("text")
    .attr("z", 2)
    .text((d: any) => d.label())
    .style("font-size", 12)
    .attr("visibility", "hidden")
    .attr("class", "nodeLabelOutlines");

  nodeLabels = labelLayer
    .selectAll("nodeLabels")
    .data(nodes)
    .enter()
    .append("text")
    .attr("z", 2)
    .text((d: any) => d.label())
    .style("font-size", 12)
    .attr("visibility", "hidden");

  // CREATE LINKS
  calculateCurvedLinks();

  // linkHighlights = linkLayer
  //   .selectAll(".linkHighlights")
  //   .data(links)
  //   .enter()
  //   .append("path")
  //   .attr("d", (d: dynamicgraph.Link) => {
  //     lineFunction((d as any).path);
  //   })
  //   .style('stroke-width', 10)
  //   .style('opacity', .5)
  //   .attr("class", "linkHighlights")
  //   .style("stroke", COLOR_HIGHLIGHT)

  visualLinks = linkLayer
    .selectAll("visualLinks")
    .data(links)
    .enter()
    .append("path")
    .attr("d", (d: dynamicgraph.Link) => {
      lineFunction((d as any).path);
    })
    .attr(
      "onclick",
      "trace.event('vis_31',document.location.pathname,'Link','Click')"
    )
    .attr(
      "onmouseover",
      "trace.event('vis_32',document.location.pathname,'Link','Mouse Over')"
    )
    .style("opacity", LINK_OPACITY)
    .on("mouseover", (ev: MouseEvent, d: any) => {
      messenger.highlight("set", <utils.ElementCompound>{ links: [d] }, "NODE_MOUSEOVER");
    })
    .on("mouseout", () => {
      messenger.highlight("reset", undefined, "NODE_MOUSEOUT");
    })
    .on("click", (ev: MouseEvent, d: any) => {
      const selections = d.getSelections();
      const currentSelection = dgraph.getCurrentSelection();
      for (let j = 0; j < selections.length; j++) {
        if (selections[j] == currentSelection) {
          messenger.selection("remove", <utils.ElementCompound>{ links: [d] });
          return;
        }
      }
      messenger.selection("add", <utils.ElementCompound>{ links: [d] });
    });

  updateLinks();
  updateNodes();
  updateNodeSize();

  updateLayout();
}

function updateLayout() {
  // update node positions
  visualNodes.attr("transform", function (d: any) {
    return "translate(" + d.x + "," + d.y + ")";
  });
  nodeHighlights.attr("transform", function (d: any) {
    return "translate(" + d.x + "," + d.y + ")";
  });

  nodeLabels
    .attr("x", (d: any) => d.x + OFFSET_LABEL.x)
    .attr("y", (d: any) => d.y + OFFSET_LABEL.y);
  nodeLabelOutlines
    .attr("x", (d: any) => d.x + OFFSET_LABEL.x)
    .attr("y", (d: any) => d.y + OFFSET_LABEL.y);

  // update link positions
  calculateCurvedLinks();
  visualLinks.attr("d", (d: any) => lineFunction(d.path));
  // linkHighlights.attr("d", (d: any) => lineFunction(d.path));

  // update nodelabel visibility after layout update.
  updateLabelVisibility();
}

function getLabelWidth(n: any) {
  return n.label().length * 8.5 + 10;
}

function getLabelHeight(n: any) {
  return 18;
}

function getNodeRadius(n: dynamicgraph.Node) {
  return Math.sqrt(n.links().length) * NODE_SIZE + 1;
}

function getNodeColor(n: dynamicgraph.Node) {
  let c;
  if (n.color().split("#")[0] !== ",") {
    c = n.color().split("#")[1];
  }
  if (!c) {
    c = "#000";
  }

  return c[0] === "#" ? c : "#" + c;
}

function getNodeShape(n: dynamicgraph.Node) {
  const shape = n.shape();

  const shapes: Record<string, d3.SymbolType> = {
    circle: d3.symbolCircle,
    cross: d3.symbolCross,
    diamond: d3.symbolDiamond,
    square: d3.symbolSquare,
    star: d3.symbolStar,
    triangle: d3.symbolTriangle,
    wye: d3.symbolWye,
  };

  return shapes[shape] ? shapes[shape] : d3.symbolCircle;
}

function updateLabelVisibility() {
  hiddenLabels = [];
  if (LABELING_STRATEGY == 0) {
    // automatic
    let n1: any, n2: any;
    for (let i = 0; i < nodesOrderedByDegree.length; i++) {
      n1 = nodesOrderedByDegree[i];
      if (hiddenLabels.indexOf(n1) > -1) continue;
      for (let j = i + 1; j < nodesOrderedByDegree.length; j++) {
        n2 = nodesOrderedByDegree[j];
        if (hiddenLabels.indexOf(n2) > -1) continue;
        if (areNodeLabelsOverlapping(n1, n2)) {
          hiddenLabels.push(n2);
        } else if (isHidingNode(n1, n2)) {
          hiddenLabels.push(n1);
          break;
        }
      }
    }
  } else if (LABELING_STRATEGY == 1) {
    // hide all
    hiddenLabels = nodes.slice(0);
  } else if (LABELING_STRATEGY == 2) {
    // show all
    hiddenLabels = [];
  }
  // } else if (LABELING_STRATEGY == 3) {
  //   // neighbors of highligted nodes
  //   hiddenLabels = nodes.slice(0);
  // }

  // render;
  nodeLabels.attr("visibility", (n: any) =>
    hiddenLabels.indexOf(n) > -1 ? "hidden" : "visible"
  );
  nodeLabelOutlines.attr("visibility", (n: any) =>
    hiddenLabels.indexOf(n) > -1 ? "hidden" : "visible"
  );
}

function areNodeLabelsOverlapping(n1: any, n2: any) {
  const n1e = n1.x + getLabelWidth(n1) / 2 + LABELDISTANCE;
  const n2e = n2.x + getLabelWidth(n2) / 2 + LABELDISTANCE;
  const n1w = n1.x - getLabelWidth(n1) / 2 - LABELDISTANCE;
  const n2w = n2.x - getLabelWidth(n2) / 2 - LABELDISTANCE;
  const n1n = n1.y + getLabelHeight(n1) / 2 + LABELDISTANCE;
  const n2n = n2.y + getLabelHeight(n2) / 2 + LABELDISTANCE;
  const n1s = n1.y - getLabelHeight(n1) / 2 - LABELDISTANCE;
  const n2s = n2.y - getLabelHeight(n2) / 2 - LABELDISTANCE;

  return (
    (n1e > n2w && n1w < n2e && n1s < n2n && n1n > n2s) ||
    (n1e > n2w && n1w < n2e && n1n > n2s && n1s < n2n) ||
    (n1w < n2e && n1s > n2n && n1s < n2n && n1n > n2s) ||
    (n1w < n2e && n1n < n2s && n1n > n2s && n1s < n2n)
  );
}

function isHidingNode(n1: any, n2: any) {
  const n1e = n1.x + getLabelWidth(n1) / 2 + LABELDISTANCE;
  const n1w = n1.x - getLabelWidth(n1) / 2 - LABELDISTANCE;
  const n1n = n1.y + getLabelHeight(n1) / 2 + LABELDISTANCE;
  const n1s = n1.y - getLabelHeight(n1) / 2 - LABELDISTANCE;
  return n1w < n2.x && n1e > n2.x && n1n < n2.y && n1s > n2.y;
}

/////////////////////
//// INTERACTION ////
/////////////////////

function mouseOverNode(ev: MouseEvent, n: any) {
  const newElementCompound: utils.ElementCompound = new utils.ElementCompound();

  const nodes =  [n, ...n.neighbors().toArray()];
  newElementCompound.nodes = Array.from(new Set(nodes));

  messenger.highlight("set", newElementCompound, "NODE_MOUSEOVER");
  // BEFORE
  // messenger.highlight('set', { nodes: [n] })
}

function mouseClickNode(ev: MouseEvent, n: any) {
  console.log('>>> mouseClick', n.isFrozen())
  const newElementCompound: utils.ElementCompound = new utils.ElementCompound();
  
  const nodes =  [n, ...n.neighbors().toArray()];
  newElementCompound.nodes = Array.from(new Set(nodes));

  if(n.isFrozen()){
    messenger.highlight("removeFreeze", newElementCompound, "NODE_CLICK");
  }else{
    messenger.highlight("freeze", newElementCompound, "NODE_CLICK");
  }


  // test -> create selection
  // var s:Selection = messenger.createSelection('node', 'Cluster 1')
  // messenger.setSelectionColor(s,'#f00');
  // messenger.selection('add', newElementCompound, s.id);

}

function mouseOutNode() {
  messenger.highlight("reset", undefined, "NODE_MOUSEOUT");
}

/////////////////
//// UPDATES ////
/////////////////

function setStateHandler(m: messenger.SetStateMessage) {
  if (m.viewType == "nodelink") {
    const state: messenger.NodeLinkControls =
      m.state as messenger.NodeLinkControls;
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
    LINK_WIDTH_SCALE = state.linkWidth;
    updateLinks();

    LABELING_STRATEGY = state.labellingType;
    updateLabelVisibility();

    // set time (start/end)
    messenger.timeRange(
      state.timeSliderStart,
      state.timeSliderEnd,
      times[0],
      true
    );
    updateLinks();
    updateNodes();

    // set pan
    panOffsetLocal = state.panOffsetLocal;
    panOffsetGlobal = state.panOffsetGlobal;

    //set zoom
    globalZoom = state.globalZoom;

    updateLayout();
  }
}

function getStateHandler(m: messenger.GetStateMessage) {
  if (m.viewType == "nodelink") {
    const nlNetwor: messenger.NetworkControls = new messenger.NodeLinkControls(
      "nodelink",
      time_start.unixTime(),
      time_end.unixTime(),
      globalZoom,
      panOffsetLocal,
      panOffsetGlobal,
      LINK_OPACITY,
      NODE_OPACITY,
      NODE_SIZE,
      LINK_GAP,
      LINK_WIDTH_SCALE,
      LABELING_STRATEGY
    );
    messenger.stateCreated(
      nlNetwor,
      m.bookmarkIndex,
      m.viewType,
      m.isNewBookmark,
      m.typeOfMultiView
    );
  }
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
  updateLinks();
  updateNodes();
}

function updateEvent() {
  updateLinks();
  updateNodes();
}

function updateNodeSize() {
  visualNodes
    .attr("d", (n: any) =>
      d3.symbol().size(getNodeRadius(n)).type(getNodeShape(n))()
    );
  nodeHighlights
    .attr('r', (n: any) =>
      getNodeRadius(n) / 10 + 5 
    );
}

function updateNodes(highlightId?: number) 
{
  // check if any node is highlighted
  let somethingIsHighlighted = false;
  if(dgraph.nodes().highlighted().length > 0
  || dgraph.links().highlighted().length > 0 ){
    somethingIsHighlighted = true;
  }

  visualNodes
    .style("fill", (d: any) => {
      let color: string | undefined;
      color = utils.getPriorityColor(d);
      if (!color) color = getNodeColor(d);
      // console.log('>>>>nodecolor', color)
      return color;
    })
    .style("opacity", (d: any) => {
      const visible: boolean = d.isVisible();
      if (!visible) return 0;
      if (somethingIsHighlighted && !(d.isHighlighted() || d.links().highlighted().length > 0)) {
          return NODE_OPACITY * OPACITY_UNSELECTED
      }else{
          return NODE_OPACITY;
      }
    });

  nodeHighlights
    .style('visibility', (d:any) =>{
      if (d.isHighlighted() || d.links().highlighted().length > 0) {
        return 'visible';
      } 
      return 'hidden';
    })

  nodeLabels
    .attr("visibility", (d: any) => {
      // e.isHighlighted() ||
      // e.links().highlighted().length > 0 ||
      // hiddenLabels.indexOf(e) == -1 ||
      // (LABELING_STRATEGY == 3 && e.neighbors().highlighted().length > 0)
      //   ? "visible"
      //   : "hidden"
      if(somethingIsHighlighted)
      {
        if(d.isHighlighted() 
          // || d.neighbors().highlighted().length > 0
          || hiddenLabels.indexOf(d) == -1
          || d.links().highlighted().length > 0)
        {
          return 'visible'
        }else
        {
            return 'hidden'
        }
      }else{
        if(hiddenLabels.indexOf(d) == -1){
        // || (LABELING_STRATEGY == 3 && d.neighbors().highlighted().length > 0)){
          return 'visible'
        }
        return 'hidden';
      }
    })
    .style("color", (d: any) => {
      let color: string | undefined; // BEFORE string
      if (d.isHighlighted()) {
        color = COLOR_HIGHLIGHT;
      } else {
        color = utils.getPriorityColor(d);
      }
      if (!color) color = COLOR_DEFAULT_NODE;
      return color;
    });

  nodeLabelOutlines.attr("visibility", (d: any) =>{
    // e.isHighlighted() ||
    // e.links().highlighted().length > 0 ||
    // hiddenLabels.indexOf(e) == -1 ||
    // (LABELING_STRATEGY == 3 && e.neighbors().highlighted().length > 0)
    //   ? "visible"
    //   : "hidden"
    if(somethingIsHighlighted && 
      !(d.isHighlighted() 
      // || d.neighbors().highlighted().length > 0
      || hiddenLabels.indexOf(d) == -1
      || d.links().highlighted().length > 0)
    )
    {
        return 'hidden'
    }else{
      if(hiddenLabels.indexOf(d) == -1){
      // || (LABELING_STRATEGY == 3 && d.neighbors().highlighted().length > 0)){
        return 'visible'
      }
      return 'hidden';
    }
  });
}

//Optional parameter highlightId used to highlight specific link on receiving hoverover message.
function updateLinks(highlightId?: number) 
{
  let somethingIsHighlighted = false;
  if(dgraph.nodes().highlighted().length > 0
  || dgraph.links().highlighted().length > 0){
    somethingIsHighlighted = true;
  }

  visualLinks
    .attr("marker-end", function (d: any) {
      if (d.directed) {
        let color = utils.getPriorityColor(d);
        if (!color) color = COLOR_DEFAULT_LINK;
        if (highlightId && highlightId == d._id) {
          return "black";
        }
        return marker(color);
      }
    })
    .style("stroke", function (d: any) {
      let color = utils.getPriorityColor(d);
      if (!color) color = COLOR_DEFAULT_LINK;
      // if (highlightId && highlightId == d._id) {
      //   return "black";
      // }
      return color;
    })
    .style("opacity", (d: any) => {
      const visible: boolean = d.isVisible();
      if (!visible || !d.source.isVisible() || !d.target.isVisible()) 
        return 0;
      if (!d.presentIn(time_start, time_end)) 
        return 0;
      if(somethingIsHighlighted && 
        !(d.isHighlighted() ||
            d.source.isHighlighted() ||
            d.target.isHighlighted() 
        ))
      {
        return LINK_OPACITY  * OPACITY_UNSELECTED;
      }else{
        return LINK_OPACITY
      }
      // {
      //   if (){
      //     if(d.isHighlighted() ||
      //       d.source.isHighlighted() ||
      //       d.target.isHighlighted() 
      //     )
      //     {
      //       return LINK_OPACITY;
      //     }else{
      //       return LINK_OPACITY * OPACITY_UNSELECTED;
      //     }
      //   }else{
      //     return LINK_OPACITY;
      //   }
      // } else {
      //   return 0;
      // }
    })
    .style("stroke-width", function (d: any) {
      const w: any =
        linkWeightScale(d.weights(time_start, time_end).mean()) *
        LINK_WIDTH_SCALE;
      // console.log('mean weight for this link ', w);
      // return d.isHighlighted() ? w * 2 : w;
      return w;
    });

    // linkHighlights
    //   .style("visibility", function (d: any) {
    //     console.log(d._id, highlightId)
    //     if (highlightId && highlightId == d._id)
    //       return 'visible';
    //     else
    //       return 'hidden';
    //   })
}

function calculateCurvedLinks() {
  let dir: any,
    offset: any,
    offset2: any,
    nodePair: dynamicgraph.NodePair | undefined;
  let links: dynamicgraph.Link[];
  for (let i = 0; i < dgraph.nodePairs().length; i++) {
    nodePair = dgraph.nodePair(i);
    if (nodePair) {
      // test if there is only one link,
      // then, draw straight line
      if (nodePair.links().length < 2) {
        if (nodePair.source != nodePair.target) {
          (nodePair.links().toArray() as any)[0]["path"] = [
            { x: (nodePair.source as any).x, y: (nodePair.source as any).y },
            { x: (nodePair.target as any).x, y: (nodePair.target as any).y },
          ];
        } else {
          // this is a single ego link
          (nodePair.links().toArray() as any)[0]["path"] = [
            { x: (nodePair.source as any).x, y: (nodePair.source as any).y },
            {
              x: (nodePair.source as any).x + 10,
              y: (nodePair.source as any).y,
            },
            {
              x: (nodePair.source as any).x + 10,
              y: (nodePair.source as any).y - 10,
            },
            {
              x: (nodePair.source as any).x,
              y: (nodePair.source as any).y - 10,
            },
            { x: (nodePair.source as any).x, y: (nodePair.source as any).y },
          ];
        }
      } // multiple links
      else {
        links = nodePair.links().toArray();
        // Draw self-links as back-link
        if (nodePair.source == nodePair.target) {
          const minGap = getNodeRadius(nodePair.source) / 2 + 4;
          for (let j = 0; j < links.length; j++) {
            (links as any)[j]["path"] = [
              { x: (nodePair.source as any).x, y: (nodePair.source as any).y },
              {
                x: (nodePair.source as any).x,
                y: (nodePair.source as any).y - minGap - j * LINK_GAP,
              },
              {
                x: (nodePair.source as any).x + minGap + j * LINK_GAP,
                y: (nodePair.source as any).y - minGap - j * LINK_GAP,
              },
              {
                x: (nodePair.source as any).x + minGap + j * LINK_GAP,
                y: (nodePair.source as any).y,
              },
              { x: (nodePair.source as any).x, y: (nodePair.source as any).y },
            ];
          }
          // non-self links
        } else {
          dir = {
            x: (nodePair.target as any).x - (nodePair.source as any).x,
            y: (nodePair.target as any).y - (nodePair.source as any).y,
          };
          // normalize
          offset = stretchVector([-dir.y, dir.x], LINK_GAP);
          offset2 = stretchVector([dir.x, dir.y], LINK_GAP);

          // calculate paths
          for (let j = 0; j < links.length; j++) {
            if (links[j] as any) {
              (links[j] as any)["path"] = [
                {
                  x: (nodePair.source as any).x,
                  y: (nodePair.source as any).y,
                },
                //Curved links
                {
                  x:
                    (nodePair.source as any).x +
                    offset2[0] +
                    (j - links.length / 2 + 0.5) * offset[0],
                  y:
                    (nodePair.source as any).y +
                    offset2[1] +
                    (j - links.length / 2 + 0.5) * offset[1],
                },
                {
                  x:
                    (nodePair.target as any).x -
                    offset2[0] +
                    (j - links.length / 2 + 0.5) * offset[0],
                  y:
                    (nodePair.target as any).y -
                    offset2[1] +
                    (j - links.length / 2 + 0.5) * offset[1],
                },
                {
                  x: (nodePair.target as any).x,
                  y: (nodePair.target as any).y,
                },
              ];
            }
          }
        }
      }
    }
  }
}

function stretchVector(vec: any, finalLength: any) {
  let len = 0;
  for (let i = 0; i < vec.length; i++) {
    len += Math.pow(vec[i], 2);
  }
  len = Math.sqrt(len);
  for (let i = 0; i < vec.length; i++) {
    vec[i] = (vec[i] / len) * finalLength;
  }

  return vec;
}

function showMessage(message: string) {
  const messageBox = document.querySelector(".messageBox");
  if (messageBox) {
    messageBox.outerHTML = "";
  }

  const div = document.createElement("div");
  const visDiv = document.getElementById("visDiv");
  if (visDiv) {
    visDiv.appendChild(div);
    div.outerHTML = '<div id="messageBox"><p>' + message + "</p></div>";
  }
}

function unshowMessage() {
  const messageBox = document.querySelector("#messageBox");
  if (messageBox) {
    messageBox.outerHTML = "";
  }
}
