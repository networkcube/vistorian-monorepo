import * as d3 from "d3";

import * as dynamicgraph from "vistorian-core/src/data/dynamicgraph";
import * as messenger from "vistorian-core/src/data/messenger";
import * as main from "vistorian-core/src/data/main";
import * as utils from "vistorian-core/src/data/utils";
import * as ordering from "vistorian-core/src/data/ordering";

import * as THREE from "three";

import * as glutils from "vistorian-core/src/ui/glutils";
import * as tline from "vistorian-core/src/ui/timeline";
import * as timeslider from "vistorian-core/src/ui/timeslider";

// DATA
const dgraph: dynamicgraph.DynamicGraph = main.getDynamicGraph();
messenger.setDefaultEventListener(updateEventHandler);
messenger.addEventListener("timeRange", timeRangeHandler);
messenger.addEventListener(messenger.MESSAGE_SET_STATE, setStateHandler);
messenger.addEventListener(messenger.MESSAGE_GET_STATE, getStateHandler);

const nodes: dynamicgraph.Node[] = dgraph.nodes().toArray();
const links: dynamicgraph.Link[] = dgraph.links().toArray();
const times: dynamicgraph.Time[] = dgraph.times().toArray();

// VIS PARAMETERS
const WIDTH: number = window.innerWidth;
const TABLE_MARGIN_LEFT = 200;
const TABLE_PADDING_LEFT = 5;
const TABLE_RIGHT = 100;
const ROW_HEIGHT = 13;
const NODE_OPACITY = 0.6;
const ANCHOR_END_DIAMETER = 2;
const ANCHOR_START_DIAMETER = 4;
const LINK_OPACITY_DEFAULT = 0.2;
const LINK_OPACITY_HIGHLIGHTED = 1;
const NODE_LABEL_COLOR = "#000";
const NODE_LABEL_WEIGHT = 300;
let LABEL_ORDER: string;
const SCROLL_CHUNK = 2;
const MARGIN_TOP = 70;
const TABLE_TOP = 50;

// VIS ELEMENTS
let svg: any;
const nodeYPosFunction: any = d3.scaleLinear();
const timeXFunction: any = d3.scaleLinear();

/* INIT */
let startAnchors: glutils.WebGLElementQuery;
let endAnchors: glutils.WebGLElementQuery;
let arcs: glutils.WebGLElementQuery;
let rowBars: any = [];

let egoNode: any;

/* IF TIMES UNDEFINED ? */
let startUnix: number = times[0] ? times[0].unixTime() : 0;
let endUnix: number = times[times.length - 1]
  ? times[times.length - 1].unixTime()
  : 0;
let nodesScrollStart = 0;
let globalNodeOrder: any[] = nodes ? nodes.slice(0) : [];

let currentNodeOrder: any[] = [];
for (let i = 0; i < globalNodeOrder.length; i++) {
  currentNodeOrder.push(i);
}

// UI SETUP
const HEIGHT: any = window.innerHeight;

const svgElement = document.createElement("svg");
const visDiv = document.getElementById("visDiv");
if (visDiv) {
  visDiv.appendChild(svgElement);
  svgElement.outerHTML =
    '<svg id="visSvg"><foreignObject id="visCanvasFO"></foreignObject></svg>';
}

d3.select("#visCanvasFO")
  .attr("x", TABLE_MARGIN_LEFT)
  .attr("y", MARGIN_TOP)
  .attr("width", WIDTH)
  .attr("height", HEIGHT);

/////////////
/// WEBGL ///
/////////////

// var vertexShaderProgram = "attribute vec4 customColor;varying vec4 vColor;void main() {vColor = customColor;gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1 );}";
// var fragmentShaderProgram = "varying vec4 vColor;void main() {gl_FragColor = vec4(vColor[0], vColor[1], vColor[2], vColor[3]);}";

const webgl: any = glutils.initWebGL("visCanvasFO", WIDTH, HEIGHT);
webgl.enablePanning(false);
webgl.camera.position.x = WIDTH / 2;
webgl.camera.position.y = -HEIGHT / 2;
webgl.camera.position.z = 1000;

// TIMELINE
const timeline: tline.Timeline = new tline.Timeline(
  webgl,
  dgraph,
  TABLE_PADDING_LEFT - 1,
  0,
  WIDTH - TABLE_MARGIN_LEFT - TABLE_RIGHT,
  TABLE_TOP
);

// VERTICAL SCROLL EVENT
window.addEventListener("wheel", mouseWheelHandler);

const select = document.createElement("select");
const menu = document.getElementById("menu");
if (menu) {
  menu.appendChild(select);
  select.outerHTML =
    '\
            <select id="labelOrdering" onchange=trace.event(\'vis_37\',\'DynamicEgo\',\'labelingType\',this.value)">\
                <option value="data">As appear in table</option>\
                <option value="alphanumerical">Alphanumerical</option>\
                <option value="degree">Number of connections</option>\
            </select>\
            ';
}

const timeSlider: timeslider.TimeSlider = new timeslider.TimeSlider(
  dgraph,
  WIDTH - 100 - TABLE_MARGIN_LEFT
);

// init webgl raycaster
visualize();

const filter = document.getElementById("labelOrdering");
if (filter) filter.addEventListener("change", updateGlobalOrderHandler);

export function updateGlobalOrderHandler(): void {
  updateGlobalOrder();
}

export function visualize(): void {
  // SET UP GLOBAL PARAMETERS
  nodeYPosFunction
    .domain([0, nodes.length - 1])
    .range([TABLE_TOP + ROW_HEIGHT, TABLE_TOP + ROW_HEIGHT * nodes.length]);

  // IF TIMES UNDEFINED?
  startUnix = times[0] ? times[0].unixTime() : 0;
  endUnix = times[times.length - 1] ? times[times.length - 1].unixTime() : 0;

  timeXFunction
    .domain([startUnix, endUnix])
    .range([5, WIDTH - TABLE_MARGIN_LEFT - TABLE_RIGHT]);

  // create svg
  // for timeslider and labels only
  svg = d3.select("#visSvg").attr("width", WIDTH).attr("height", "100vh");
  timeSlider.appendTo(svg, TABLE_MARGIN_LEFT);

  createNodes();
  createTimes();
  createLinks();

  webgl.render();
}

export function createNodes(): void {
  // DRAW NODES
  svg
    .selectAll(".nodeLabel")
    .data(nodes)
    .enter()
    .append("text")
    .attr("x", TABLE_MARGIN_LEFT - 5)
    .attr(
      "y",
      (d: any) =>
        MARGIN_TOP + nodeYPosFunction(currentNodeOrder[d.id()]) + ROW_HEIGHT - 5
    )
    .text((d: any) => {
      return d.label() + " (" + d.neighbors().size() + ")";
    })
    .attr("class", "nodeLabel")
    .style("font-weight", NODE_LABEL_WEIGHT)
    .style("fill", NODE_LABEL_COLOR)
    .on("mouseover", (ev: MouseEvent, d: any) => {
      messenger.highlight("set", <utils.ElementCompound>{ nodes: [d] });
    })
    .on("mouseout", () => {
      messenger.highlight("reset");
    })
    .on("click", (ev: MouseEvent, d: any) => {
      showEgoNetwork(d);
    });

  // draw row bars
  rowBars = glutils
    .selectAll()
    .data(nodes.slice(0))
    .filter((d: any, i: any) => i % 2 == 0)
    .append("rect")
    .attr("x", TABLE_PADDING_LEFT)
    .attr("y", (d: any, i: any) => -nodeYPosFunction(i * 2))
    .attr("width", WIDTH - TABLE_MARGIN_LEFT - TABLE_RIGHT)
    .attr("height", ROW_HEIGHT)
    .style("fill", (d: any, i: any) => (i % 3 == 2 ? 0xdddddd : 0xeeeeee))
    .style("stroke", (d: any, i: any) => (i % 3 == 2 ? 0xdddddd : 0xeeeeee));
}

export function createTimes(): void {
  glutils
    .selectAll()
    .data(times)
    .append("rect")
    .attr("x", (d: any) => {
      timeXFunction(d.unixTime()) - 6;
    })
    .attr("y", (d: any) => -TABLE_TOP + getTimeFormatted(d).length * 8)
    .attr("z", 2)
    .style("fill", "#ff0000")
    .style("opacity", 0)
    .attr("width", 12)
    .attr("height", (d: any) => getTimeFormatted(d).length * 8)
    .on("mouseover", (d: any) => {
      messenger.highlight("set", <utils.ElementCompound>{ times: [d] });
    })
    .on("mouseout", () => {
      messenger.highlight("reset");
    });
}

export function getTimeFormatted(d: any): string {
  return (
    utils.formatAtGranularity(d.time(), 7) +
    "-" +
    utils.formatAtGranularity(d.time(), 6)
  );
}

export function createLinks(): void {
  let y1: any, y2: any;
  let yOffset: any;

  // CREATE ANCHORS
  startAnchors = webgl.selectAll().data(links);

  startAnchors
    .append("circle")
    .attr("x", (l: any) => timeXFunction(l.times().toArray()[0].unixTime()))
    .attr("y", (l: any) => {
      y1 = nodeYPosFunction(currentNodeOrder[l.source.id()]);
      yOffset = ROW_HEIGHT / 2;
      return -(y1 + yOffset);
    })
    .attr("z", 2)
    .attr("r", ANCHOR_START_DIAMETER)
    .style("fill", (l: any) => l.getSelections()[0].color);

  // CREATE ANCHORS
  endAnchors = glutils.selectAll().data(links);
  endAnchors
    .append("circle")
    .attr("x", (l: any) => timeXFunction(l.times().toArray()[0].unixTime()))
    .attr("y", (l: any) => {
      y2 = nodeYPosFunction(currentNodeOrder[l.target.id()]);
      yOffset = ROW_HEIGHT / 2;
      return -(y2 + yOffset);
    })
    .attr("z", 2)
    .attr("r", ANCHOR_END_DIAMETER)
    .style("fill", (l: any) => l.getSelections()[0].color);

  // CREATE ARCS
  arcs = glutils
    .selectAll()
    .data(links)
    .append("path")
    .attr("d", (l: any) => makeArcPath(l))
    .attr("x", (l: any) => timeXFunction(l.times().toArray()[0].unixTime()))
    .attr("y", () => -ROW_HEIGHT / 2)
    .attr("z", 10)
    .style("stroke", (l: any) => l.getSelections()[0].color)
    .style("stroke-width", 1)
    .style("opacity", 0.3)
    .on("mouseover", (d: any) => {
      // N.B glutils uses callback functions with same signatures as *old* d3 format
      messenger.highlight("set", <utils.ElementCompound>{ links: [d] });
      timeline.highlight(d.times().get(0).unixTime());
    })
    .on("mouseout", () => {
      // N.B glutils uses callback functions with same signatures as *old* d3 format
      messenger.highlight("reset");
    });
}

// UPDATES

export function timeRangeHandler(m: messenger.TimeRangeMessage): void {
  startUnix = m.startUnix;
  endUnix = m.endUnix;

  timeSlider.set(startUnix, endUnix);

  timeXFunction.domain([startUnix, endUnix]);

  // update link positions
  arcs
    .attr("x", (l: any) => timeXFunction(l.times().toArray()[0].unixTime()))
    .style("opacity", (l: any) =>
      timeXFunction(l.times().toArray()[0].unixTime()) < 5 ? 0 : 1
    );

  startAnchors
    .attr("x", (l: any) => timeXFunction(l.times().toArray()[0].unixTime()))
    .style("opacity", (l: any) =>
      timeXFunction(l.times().toArray()[0].unixTime()) < 5 ? 0 : 1
    );

  endAnchors
    .attr("x", (l: any) => timeXFunction(l.times().toArray()[0].unixTime()))
    .style("opacity", (l: any) =>
      timeXFunction(l.times().toArray()[0].unixTime()) < 5 ? 0 : 1
    );

  updateLinks();

  timeline.update(startUnix, endUnix);

  webgl.render();
}

export function updateEventHandler(m: messenger.Message): void {
  if (m.type == messenger.MESSAGE_SELECTION_FILTER) {
    updateCurrentOrder();
    return;
  } else {
    updateLinks();
    updateNodes();
    webgl.render();
  }
}

export function updateCurrentOrder(): void {
  currentNodeOrder = [];
  for (let i = 0; i < nodes.length; i++) {
    currentNodeOrder.push(-1);
  }
  let rank = 0;
  for (let i = 0; i < globalNodeOrder.length; i++) {
    if (globalNodeOrder[i].isVisible()) {
      currentNodeOrder[globalNodeOrder[i].id()] = rank;
      rank++;
    }
  }

  nodeYPosFunction
    .domain([0, rank])
    .range([
      TABLE_TOP + ROW_HEIGHT,
      TABLE_TOP + ROW_HEIGHT * (rank - nodesScrollStart),
    ]);

  updateNodePositions(1000);
  updateLinkPositions();
  updateLinks();
  webgl.render();
}

export function updateLinks(): void {
  arcs
    .style("stroke-width", (d: any) =>
      d.isHighlighted() ||
      d.source.isHighlighted() ||
      d.target.isHighlighted() ||
      d.times().highlighted().size() > 0
        ? 2
        : 1
    )
    .style("opacity", (d: dynamicgraph.Link) =>
      !d.isVisible() ||
      currentNodeOrder[d.source.id()] < nodesScrollStart ||
      currentNodeOrder[d.target.id()] < nodesScrollStart ||
      d.times().get(0).unixTime() < startUnix ||
      d.times().get(0).unixTime() > endUnix
        ? 0
        : d.isHighlighted() ||
          d.source.isHighlighted() ||
          d.target.isHighlighted() ||
          d.times().highlighted().size() > 0
        ? LINK_OPACITY_HIGHLIGHTED
        : LINK_OPACITY_DEFAULT
    )
    .style("stroke", (d: dynamicgraph.Link) =>
      d.getSelections()[0].showColor ? d.getSelections()[0].color : "#999"
    );

  endAnchors
    .style("opacity", (d: dynamicgraph.Link) =>
      !d.isVisible() ||
      currentNodeOrder[d.target.id()] < nodesScrollStart ||
      d.times().get(0).unixTime() < startUnix ||
      d.times().get(0).unixTime() > endUnix
        ? 0
        : d.isHighlighted() ||
          d.source.isHighlighted() ||
          d.target.isHighlighted() ||
          d.times().highlighted().size() > 0
        ? LINK_OPACITY_HIGHLIGHTED
        : LINK_OPACITY_DEFAULT
    )
    .style("fill", (d: dynamicgraph.Link) =>
      d.getSelections()[0].showColor ? d.getSelections()[0].color : "#999"
    );

  startAnchors
    .style("opacity", (d: dynamicgraph.Link) =>
      !d.isVisible() ||
      currentNodeOrder[d.source.id()] < nodesScrollStart ||
      d.times().get(0).unixTime() < startUnix ||
      d.times().get(0).unixTime() > endUnix
        ? 0
        : d.isHighlighted() ||
          d.source.isHighlighted() ||
          d.target.isHighlighted() ||
          d.times().highlighted().size() > 0
        ? LINK_OPACITY_HIGHLIGHTED
        : LINK_OPACITY_DEFAULT
    )
    .style("fill", (d: dynamicgraph.Link) =>
      d.getSelections()[0].showColor ? d.getSelections()[0].color : "#999"
    );
}

export function updateNodes(): void {
  d3.selectAll(".nodeLabel")
    .style("font-weight", (d: any) =>
      d.isHighlighted() ||
      d.links().highlighted().size() > 0 ||
      d.neighbors().highlighted().size() > 0
        ? 900
        : NODE_LABEL_WEIGHT
    )
    .style("text-decoration", (d: any) =>
      d.isHighlighted() ? "underline" : "none"
    )
    .style("fill", (d: any) => {
      // BEFORE dynamicgraph.Node
      let color = undefined;
      if (d.isSelected()) {
        color = utils.getPriorityColor(d);
      }
      if (!color) color = NODE_LABEL_COLOR;
      return color;
    })
    .style("opacity", (n: any) =>
      currentNodeOrder[n.id()] >= nodesScrollStart
        ? n == egoNode
          ? 1
          : NODE_OPACITY
        : 0
    )
    .text((n: any) =>
      egoNode == n
        ? "EGO-->" + n.label() + " (" + n.neighbors().size() + ")"
        : n.label() + " (" + n.neighbors().size() + ")"
    );
}

export function updateNodePositions(duration: number): void {
  d3.selectAll(".nodeLabel")
    .transition()
    .duration(duration)
    .attr(
      "y",
      (d: any) =>
        MARGIN_TOP + nodeYPosFunction(currentNodeOrder[d.id()]) + ROW_HEIGHT - 5
    )
    .style("opacity", (n: any) =>
      currentNodeOrder[n.id()] >= nodesScrollStart
        ? n == egoNode
          ? 1
          : NODE_OPACITY
        : 0
    );
}

export function updateLinkPositions(): void {
  let y1: any, y2: any, yOffset: any;
  startAnchors.attr("y", (l: any) => {
    y1 = nodeYPosFunction(currentNodeOrder[l.source.id()]);
    yOffset = ROW_HEIGHT / 2;
    return -(y1 + yOffset) + ANCHOR_START_DIAMETER / 2;
  });
  endAnchors.attr("y", (l: any) => {
    y2 = nodeYPosFunction(currentNodeOrder[l.target.id()]);
    yOffset = ROW_HEIGHT / 2;
    return -(y2 + yOffset) + ANCHOR_END_DIAMETER / 2;
  });
  arcs.attr("d", (l: any) => makeArcPath(l));
}

export function mouseWheelHandler(event: any): void {
  event.preventDefault();

  if (
    event.wheelDelta == 0 ||
    (nodesScrollStart >= nodes.length - 5 && event.wheelDelta < 0) ||
    (nodesScrollStart == 0 && event.wheelDelta > 0)
  ) {
    return;
  }

  const dir: number = event.wheelDelta > 0 ? -1 : 1;
  nodesScrollStart += SCROLL_CHUNK * dir;
  nodesScrollStart = Math.max(0, Math.min(nodes.length - 1, nodesScrollStart));

  nodeYPosFunction
    .domain([nodesScrollStart, nodes.length - 1])
    .range([
      TABLE_TOP + ROW_HEIGHT,
      TABLE_TOP + ROW_HEIGHT * (nodes.length - nodesScrollStart),
    ]);

  rowBars
    .attr("y", (d: any, i: any) => -nodeYPosFunction(i * 2))
    .style("opacity", (d: any, i: any) =>
      i * 2 < nodesScrollStart || i * 2 > globalNodeOrder.length ? 0 : 1
    );

  updateLinkPositions();
  updateNodePositions(0);
  updateLinks();
  updateNodes();
  webgl.render();
  messenger.zoomInteraction("dynamicego", "zoom");
}

/// HELPER

export function updateGlobalOrder(validNodes?: dynamicgraph.Node[]): void {
  if (validNodes == undefined) globalNodeOrder = dgraph.nodes().toArray();
  else globalNodeOrder = validNodes;

  const menu: any = document.getElementById("labelOrdering");
  LABEL_ORDER = menu.options[menu.selectedIndex].value;
  if (LABEL_ORDER == "alphanumerical") {
    globalNodeOrder.sort(compareFunc);
  } else if (LABEL_ORDER == "data") {
    // already in data ordering
  } else if (LABEL_ORDER == "degree") {
    globalNodeOrder.sort(function (a, b) {
      return b.neighbors().length - a.neighbors().length;
    });
  } else if (LABEL_ORDER == "similarity") {
    const config: ordering.OrderingConfiguration =
      new ordering.OrderingConfiguration(times[0], times[times.length - 1]);
    config.nodes = globalNodeOrder;
    config.links = dgraph
      .links()
      .presentIn(config.start, config.end)
      .visible()
      .toArray();
    const nodeOrder: number[] = ordering.orderNodes(dgraph, config);
    globalNodeOrder = [];
    for (let i = 0; i < nodeOrder.length; i++) {
      globalNodeOrder.push(dgraph.node(nodeOrder[i]));
    }
  }
  updateCurrentOrder();
}

export function compareFunc(a: any, b: any): number {
  return a.label() < b.label() ? -1 : 1;
}

export function makeArcPath(
  link: dynamicgraph.Link
): Record<"x" | "y", number>[] {
  const y1p: any = nodeYPosFunction(currentNodeOrder[link.source.id()]);
  const y2p: any = nodeYPosFunction(currentNodeOrder[link.target.id()]);
  const y1: number = Math.min(y1p, y2p);
  const y2: number = Math.max(y2p, y1p);
  const points: any[] = [];
  points.push({ x: 0, y: -y1 });
  points.push({ x: Math.abs(y1 - y2) / 5, y: -(y1 + (y2 - y1) / 6) });
  points.push({ x: Math.abs(y1 - y2) / 5, y: -(y2 - (y2 - y1) / 6) });
  points.push({ x: 0, y: -y2 });

  const vectors: any = [];
  for (let i = 0; i < points.length; i++) {
    vectors.push(new THREE.Vector2(points[i].x, points[i].y));
  }
  return glutils.curve(points);
}

export function showEgoNetwork(n: dynamicgraph.Node): void {
  if (egoNode == n) {
    egoNode = undefined;
    updateGlobalOrder();
  } else {
    egoNode = n;
    const a: any[] = egoNode.neighbors().removeDuplicates().toArray();
    if (a.indexOf(egoNode) == -1) a.push(egoNode);
    updateGlobalOrder(a);
  }
  d3.selectAll(".nodeLabel").style("opacity", (n: any) =>
    currentNodeOrder[n.id()] >= nodesScrollStart
      ? n == egoNode
        ? 1
        : NODE_OPACITY
      : 0
  );

  rowBars
    .attr("y", (d: any, i: any) => -nodeYPosFunction(i * 2))
    .style("opacity", (d: any, i: any) =>
      i * 2 < nodesScrollStart || i * 2 > globalNodeOrder.length ? 0 : 1
    );
}

function setStateHandler(m: messenger.SetStateMessage): void {
  if (m.viewType == "dynamicego") {
    const state: messenger.TimeArchsControls =
      m.state as messenger.TimeArchsControls;
    // unpack / query that state object

    LABEL_ORDER = state.labellingType;
    updateGlobalOrder();

    startUnix = state.timeSliderStart;
    endUnix = state.timeSliderEnd;

    // set time (start/end)
    messenger.timeRange(
      state.timeSliderStart,
      state.timeSliderEnd,
      times[0],
      true
    );
  }
}

function getStateHandler(m: messenger.GetStateMessage): void {
  if (m.viewType == "dynamicego") {
    const dyEgoNetwork: messenger.NetworkControls =
      new messenger.TimeArchsControls(
        "dynamicego",
        startUnix,
        endUnix,
        LABEL_ORDER
      );
    messenger.stateCreated(
      dyEgoNetwork,
      m.bookmarkIndex,
      m.viewType,
      m.isNewBookmark,
      m.typeOfMultiView
    );
  }
}
