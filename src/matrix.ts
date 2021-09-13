/// <reference path="./lib/d3.d.ts"/>

import * as THREE from 'three';

import * as dynamicgraph from 'vistorian-core/src/dynamicgraph';
import * as utils from 'vistorian-core/src/utils';
import * as main from 'vistorian-core/src/main';
import * as messenger from 'vistorian-core/src/messenger';
import * as ordering from 'vistorian-core/src/ordering';

import * as TimeSlider from 'vistorian-core/src/timeslider';
import * as glutils from 'vistorian-core/src/glutils';

const COLOR_HIGHLIGHT = 0x000000;
const COLOR_SELECTION = 0xff0000;



class NMargin {
  left: number;
  top: number;
  constructor(v: number) {
    this.left = v;
    this.top = v;
  }
  setMargin(v: number) {
    this.left = v;
    this.top = v;
  }
}

interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

interface Pos {
  x: number;
  y: number;
}

interface Cell {
  row: number;
  col: number;
}



class MatrixMenu {
  private elem: JQuery;
  private matrix: Matrix;
  constructor(elem: JQuery, matrix: Matrix) {
    this.elem = elem;
    this.matrix = matrix;
    this.init();
  }
  init() {
    this.elem.append(
      `Zoom:  <input id="cellSizeBox" type="range" 
      name="cellSizeBox" min="3" max="20" 
      value="` + this.matrix.cellSize + '" onchange="trace.event(\'vis_34\',\'Matrix\',\'Zoom Range\',this.value)"/>');
    $('#cellSizeBox').change(this.updateCellSize);
    this.elem.append('<br/>');
    this.elem.append('<label>Label ordering:</label>');
    let orderingMenu = $("#networkcube-matrix-menu")
      .append('<select id="labelOrdering" onchange="trace.event(\'vis_35\',\'Matrix\',\'labelingType\',this.value)"></select>')

    // VS: Clicks on Manual
    $("#networkcube-matrix-menu")
      .append('<a class="manual-button" target="_blank" href="https://github.com/networkcube/networkcube/wiki/Visualization-Manual#matrix-visualization-matrix" onclick="trace_help()">Manual</a>');

    $('#labelOrdering').change(this.reorderHandler);
    $('#labelOrdering').append('<option value="none">---</option>');
    $('#labelOrdering').append('<option value="alphanumerical">Alphanumerical</option>');
    $('#labelOrdering').append('<option value="reverse-alpha">Reverse Alphanumerical</option>');
    $('#labelOrdering').append('<option value="degree">Node degree</option>');
    $('#labelOrdering').append('<option value="similarity">Similarity</option>');

    this.elem.append('<input value="Re-run" id="reorderBtn" type="button" onclick="trace.event(\'vis_36\',\'Matrix\',\'Rerun Button\',\'Clicked\')"/>');
    $('#reorderBtn').click(this.reorderHandler);
  }
  updateCellSize() {
    let value: any = $('#cellSizeBox').val();
    matrix.updateCellSize(value);
  }
  reorderHandler() {
    let orderType: any = $('#labelOrdering').val();
    matrix.reorderWorker(orderType);
  }
  setScale(val: number) {
    $('#cellSizeBox').val(val);
  }
}

class MatrixTimeSlider {
  private elem: JQuery;
  private matrix: Matrix;
  private width: number;
  private height: number;
  private svg: any;
  private timeSlider: any; // BEFORE TimeSlider.TimeSlider;
  constructor(elem: JQuery, matrix: Matrix, width: number) {
    this.elem = elem;
    this.matrix = matrix;
    this.width = width - 20;
    this.height = 50;
    this.init();
  }
  init() {
    this.svg = d3.select(this.elem.get(0))
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)

    this.timeSlider = new TimeSlider.TimeSlider(matrix.dgraph, vizWidth);
    this.timeSlider.appendTo(this.svg);

  }
  set(sT: number, eT: number) {
    this.timeSlider.set(sT, eT);
  }
}

class CellLabel {
  private cellLabelBackground: any;
  private cellLabel: any;
  constructor() {
    this.cellLabelBackground = glutils.selectAll()
      .data([{ id: 0 }])
      .append('text')
      .style('opacity', 0)
      .attr('z', -1)
      .style('font-size', 12)
      .style('stroke', '#fff')
      .style('stroke-width', 2.5)


    this.cellLabel = glutils.selectAll()
      .data([{ id: 0 }])
      .append('text')
      .style('opacity', 0)
      .attr('z', -1)
      .style('font-size', 12)
  }
  hideCellLabel() {
    this.cellLabelBackground.style('opacity', 0);
    this.cellLabel.attr('z', -1)
      .style('opacity', 0);
  }
  updateCellLabel(mx: number, my: number, val: number | null, fw: number) {

    this.cellLabel
      .attr('x', mx + 40)
      .attr('y', -my)
      .style('opacity', 1)
      .text(val ? val : 0)
      .attr('z', 2)
      .style('font-size', fw);
    this.cellLabelBackground
      .attr('x', mx + 40)
      .attr('y', -my)
      .style('opacity', 1)
      .text(val ? val : 0)
      .attr('z', 2)
      .style('font-size', fw);
  }
}
class MatrixOverview {
  private width: number;
  private height: number;
  private matrix: Matrix;
  private svg: any; // BEFORE d3.Selection;
  private ratio: number;
  private canvasRatio: number;
  private focusColor: string = '';
  private focus: any; // BEFORE d3.Selection;
  private context: any; // BEFORE d3.Selection;
  private contextImg: any; // BEFORE d3.Selection;
  private contextPattern: any; // BEFORE d3.Selection;
  private zoom: any; // BEFORE d3.ZoomBehavior;

  constructor(svg: any, // BEFORE d3.Selection,
    width: number,
    height: number,
    matrix: Matrix) {
    this.svg = svg;
    this.matrix = matrix;
    this.width = width;
    this.height = height;
    this.ratio = 1;
    this.canvasRatio = 1;
    this.init();
  }
  init() {

    this.focusColor = "#ccc";

    let g = this.svg.append('g');

    this.contextPattern = g.append("defs")
      .append("pattern")
      .attr("id", "bg")
      .attr('patternUnits', 'userSpaceOnUse')
      .attr("width", this.width)
      .attr("height", this.height);

    this.contextImg = this.contextPattern.append("image")
      .attr("width", this.width)
      .attr("height", this.height);

    this.context = g.append("rect")
      .attr("class", "context")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("stroke", "#aaa")
      .attr("fill", "white");

    g = this.svg.append('g');

    this.focus = g.append("rect")
      .attr("class", "focus")
      .attr("fill", this.focusColor)
      .attr("fill-opacity", .2);

    this.zoom = d3.behavior.zoom()
      // .scaleExtent([0.2, 4])
      .on('zoom', this.zoomed);

    this.focus.call(this.zoom);//.on('zoom', this.zoomed));

  }

  private zoomed = () => {
    let z: number, tr: any[] = [];
    z = this.zoom.scale();
    tr = this.zoom.translate();
    this.updateTransform(z, tr);
  }

  setCanvasRatio(canvasRatio: number) {
    this.canvasRatio = 1;
    let w = this.canvasRatio > 1 ? this.width * this.canvasRatio : this.width;
    let h = this.canvasRatio < 1 ? this.height * this.canvasRatio : this.height;
    this.contextPattern.attr("width", w)
      .attr("height", h);
    this.contextImg.attr("width", w)
      .attr("height", h);
  }

  updateTransform(z: any, tr: any) {
    tr[0] = -tr[0] * this.ratio;
    tr[1] = -tr[1] * this.ratio;
    this.matrix.updateTransform(z, tr);
  }
  updateFocus(matrixX0: number, matrixY0: number,
    visibleW: number, visibleH: number,
    r: number,
    z: number, tr: number[]) {
    tr[0] = this.ratio !== 0 ? -tr[0] / this.ratio : 0;
    tr[1] = this.ratio !== 0 ? -tr[1] / this.ratio : 0;
    this.ratio = this.height !== 0 ? r / this.height : 0;

    this.zoom.scale(z);
    this.zoom.translate(tr);

    let focusX = matrixX0 * this.width;
    let focusY = matrixY0 * this.height;
    let focusWidth = Math.min(visibleW * this.width, this.width);
    let focusHeight = Math.min(visibleH * this.height, this.height);
    focusWidth = (focusX + focusWidth) > this.width ? this.width - focusX : focusWidth;
    focusHeight = (focusY + focusHeight) > this.height ? this.height - focusY : focusHeight;
    this.focus.attr("width", focusWidth)
      .attr("height", focusHeight)
      .attr("x", focusX)
      .attr("y", focusY);
  }
  updateOverviewImage(dataImg: any) {
    this.contextImg.attr("xlink:href", dataImg);
    this.context.attr("fill", "url(#bg)");
  }

}

class MatrixLabels {
  private width: number = 0;
  private height: number = 0;
  private margin: NMargin;
  private matrix: Matrix;
  private cellSize: number;
  public svg: any; // BEFORE D3.Selection;
  constructor(svg: any, // BEFORE D3.Selection,
    margin: NMargin,
    matrix: Matrix) {
    this.svg = svg;
    this.matrix = matrix;
    this.margin = margin;
    this.cellSize = 0;

    //When a node row is hovered over in dataview.ts, a message is received here to highlight the corresponding link.
    var bcNode = new BroadcastChannel('row_hovered_over_node');
    var self = this;
    bcNode.onmessage = function (ev) {
      self.updateHighlightedNodes([ev.data.id]);
    };
  }

  updateData(leftNodes: dynamicgraph.Node[], topNodes: dynamicgraph.Node[],
    cellSize: number, nodeOrder: number[],
    leftLabelOffset: number, topLabelOffset: number,
    bbox: Box, highlightId?: number) {

    this.cellSize = cellSize;

    let labelsLeft = this.svg.selectAll('.labelsLeft')
      .data(leftNodes);

    let leftLabelPosition = (nodeId: any) => this.margin.top + leftLabelOffset + cellSize * (nodeOrder[nodeId] - bbox.y0) + cellSize / 2;

    labelsLeft.enter().append('text')
      .attr('id', (d: any, i: any) => { return 'nodeLabel_left_' + d.id(); })
      .attr('class', 'labelsLeft nodeLabel')
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'middle')
      .attr('x', this.margin.left - 10)
      .attr('y', (d: any, i: any) => { return leftLabelPosition(d.id()) })
      .on('mouseover', (d: any, i: any) => {
        messenger.highlight('set', <utils.ElementCompound>{ nodes: [d] });
      })
      .on('mouseout', (d: any, i: any) => {
        messenger.highlight('reset');
      })
      .on('click', (d: any, i: any) => {
        this.matrix.nodeClicked(d);
      });

    labelsLeft.exit().remove();

    labelsLeft
      .attr('id', (d: any, i: any) => { return 'nodeLabel_left_' + d.id(); })
      .text((d: any, i: any) => { return d.label(); })
      .attr('x', this.margin.left - 10)
      .attr('y', (d: any, i: any) => {
        return leftLabelPosition(d.id());
      });

    let labelsTop = this.svg.selectAll('.labelsTop')
      .data(topNodes);

    let topLabelPosition = (nodeId: any) => this.margin.left + topLabelOffset + cellSize * (nodeOrder[nodeId] - bbox.x0) + cellSize / 2;

    labelsTop.enter().append('text')
      .attr('id', (d: any, i: any) => { return 'nodeLabel_top_' + d.id(); })
      .attr('class', 'labelsTop nodeLabel')
      .text((d: any, i: any) => { return d.label(); })
      .attr('x', (d: any, i: any) => { return topLabelPosition(d.id()) })
      .attr('y', this.margin.left - 10)
      .attr('transform', (d: any, i: any) => { return 'rotate(-90, ' + (this.margin.top + cellSize * i + cellSize / 2) + ', ' + (this.margin.left - 10) + ')' })
      .on('mouseover', (d: any, i: any) => {
        this.matrix.highlightNodes([d.id()]);
      })
      .on('mouseout', (d: any, i: any) => {
        this.matrix.highlightNodes([]);
      })
      .on('click', (d: any, i: any) => {
        this.matrix.nodeClicked(d);
      });

    labelsTop.exit().remove();
    labelsTop
      .attr('id', (d: any, i: any) => { return 'nodeLabel_top_' + d.id(); })
      .text((d: any, i: any) => { return d.label(); })
      .attr('alignment-baseline', 'middle')
      .attr('x', (d: any, i: any) => {
        return topLabelPosition(d.id());
      })
      .attr('y', this.margin.top - 10)
      .attr('transform', (d: any, i: any) => { return 'rotate(-90, ' + (this.margin.top + topLabelOffset + cellSize * (nodeOrder[d.id()] - bbox.x0) + cellSize / 2) + ', ' + (this.margin.left - 10) + ')' });

    this.updateHighlightedNodes();
  }

  updateHighlightedNodes(highlightedLinks: number[] = []) {
    let color: any;
    this.svg.selectAll('.nodeLabel')
      .style('fill', function (d: any) {
        color = undefined;
        if (d.isSelected()) {
          color = utils.getPriorityColor(d);
        }
        if (!color)
          color = '#000000';
        return color;
      })
      .style('font-weight', function (d: any) {
        if (d.isHighlighted()) {
          return 900;
        }
        return 100;
      })
      .style('font-size', Math.min(this.cellSize, 20));

    for (let i = 0; i < highlightedLinks.length; i++) {
      d3.selectAll('#nodeLabel_left_' + highlightedLinks[i])
        .style('font-weight', 900);
      d3.selectAll('#nodeLabel_top_' + highlightedLinks[i])
        .style('font-weight', 900);
    }
  }

}

class MatrixVisualization {
  private elem: any;
  public width: number;
  public height: number;
  private matrix: Matrix;
  private cellSize: number = 0;
  private scale: number;
  private tr: number[];
  private offset: number[];
  private nrows: number;
  private ncols: number;
  private linksPos: { [row: number]: { [col: number]: number[] } } = {}; // INIT???
  private mouseDown: Boolean = false;
  private mouseDownPos: any; // BEFORE Pos;
  private mouseDownCell: Cell;
  private toHoverLinks: number[] = [];
  private hoveredLinks: number[] | undefined;
  private previousHoveredLinks: number[] | undefined;
  private canvas: any; // HTMLCanvasElement = new HTMLCanvasElement();
  private view: any; // BEFORE D3.Selection;
  private zoom: any; // BEFORE D3.Behavior.Zoom;
  private scene: any; // BEFORE THREE.Scene = new THREE.Scene();
  private camera: any; // BEFORE THREE.OrthographicCamera;
  private renderer: any; // BEFORE THREE.WebGLRenderer = new THREE.WebGLRenderer();
  private geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  private mesh: THREE.Mesh = new THREE.Mesh();
  private guideLines: THREE.Object3D[];
  private vertexPositions: number[][] = [];
  private vertexColors: number[][] = [];
  private shaderMaterial: THREE.ShaderMaterial = new THREE.ShaderMaterial();
  private cellHighlightFrames: { [id: number]: THREE.Mesh[] };
  private cellSelectionFrames: THREE.Mesh[];
  private linkWeightScale: any; // BEFORE d3.ScaleLinear;
  private bufferTexture: any; // BEFORE THREE.WebGLRenderTarget;


  private data: { [id: number]: { [id: number]: dynamicgraph.NodePair } } = {};
  constructor(elem: any, // BEFORE d3.Selection
    width: number, height: number,
    matrix: Matrix) {
    this.width = width;
    this.height = height;
    this.elem = elem;
    this.matrix = matrix;
    this.nrows = 0;
    this.ncols = 0;
    this.scale = 1;
    this.tr = [0, 0];
    this.offset = [0, 0];
    this.guideLines = [];
    this.hoveredLinks = [];
    this.previousHoveredLinks = [];
    this.mouseDownCell = { row: 0, col: 0 };
    this.cellHighlightFrames = dynamicgraph.array(undefined, matrix.numberOfLinks());
    this.cellSelectionFrames = dynamicgraph.array(undefined, matrix.numberOfLinks());
    this.linkWeightScale = d3.scale.linear().range([0.1, 1])
      .domain([0, matrix.maxWeight()]);

    //When a node row is hovered over in dataview.ts, a message is received here to highlight the corresponding link.
    var bcNode = new BroadcastChannel('row_hovered_over_link');
    var self = this;
    bcNode.onmessage = function (ev) {
      self.updateHighlightedLinks([ev.data.id]);
    };
    this.init();
  }
  init() {
    this.initWebGL();
    this.elem.node().appendChild(this.canvas);
    this.view = d3.select(this.canvas);
    this.zoom = d3.behavior.zoom();
    this.view.call(this.zoom);//.on('zoom', this.zoomed));
    this.initGeometry();
    this.cellSize = this.matrix.cellSize;

  }
  webgl: any; //glutils.WebGL = new glutils.WebGL();
  initWebGL() {
    this.webgl = glutils.initWebGL('visCanvasFO', this.width, this.height);
    this.webgl.enablePanning(false);
    this.webgl.camera.position.x = this.width / 2;
    this.webgl.camera.position.y = -this.height / 2;
    this.webgl.camera.position.z = 1000;

    this.canvas = this.webgl.canvas;

    this.scene = this.webgl.scene;
    this.camera = this.webgl.camera;
    this.renderer = this.webgl.renderer;

    this.initTextureFramebuffer();


    this.webgl.canvas.addEventListener('mousemove', this.mouseMoveHandler);
    this.webgl.canvas.addEventListener('mousedown', this.mouseDownHandler);
    this.webgl.canvas.addEventListener('mouseup', this.mouseUpHandler);
    this.webgl.canvas.addEventListener('click', this.clickHandler);

  }

  initTextureFramebuffer() {
    this.bufferTexture = new THREE.WebGLRenderTarget(256, 256, { minFilter: THREE.NearestMipMapNearestFilter, magFilter: THREE.LinearFilter });
  }

  initGeometry() {
    let vertexShaderProgram = `
      attribute vec4 customColor;
      varying vec4 vColor;
      void main() {
        vColor = customColor;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1 );
      }`;
    let fragmentShaderProgram = `
      varying vec4 vColor;
      void main() {
        gl_FragColor = vec4(vColor[0], vColor[1], vColor[2], vColor[3]);
      }`;

    let attributes = {
      customColor: { type: 'c', value: [] }
    }

    // SHADERS
    this.shaderMaterial = new THREE.ShaderMaterial({
      //attributes: attributes, // Not Exist
      vertexShader: vertexShaderProgram,
      fragmentShader: fragmentShaderProgram,
    });
    this.shaderMaterial.blending = THREE.NormalBlending;
    this.shaderMaterial.depthTest = true;
    this.shaderMaterial.transparent = true;
    this.shaderMaterial.side = THREE.DoubleSide;

    this.geometry = new THREE.BufferGeometry();
  }
  render() {
    let d = new Date();
    let begin = d.getTime();
    this.renderer.render(this.scene, this.camera);
    d = new Date();
  }

  updateData(data: { [id: number]: { [id: number]: dynamicgraph.NodePair } },
    nrows: number, ncols: number,
    cellSize: number,
    offset: number[],
    scale: number,
    tr: number[],
    getImageData: boolean
  ) {
    this.data = data;
    this.nrows = nrows;
    this.ncols = ncols;
    this.offset = offset;
    this.cellSize = cellSize;


    this.zoom.scale(scale);
    this.zoom.translate(tr);

    if (this.geometry) {
      this.scene.remove(this.mesh);
    }
    if (this.hoveredLinks)
      for (let id of this.hoveredLinks) {
        if (this.cellHighlightFrames[id])
          for (let frame of this.cellHighlightFrames[id])
            this.scene.remove(frame);
      }
    for (let i = 0; i < this.guideLines.length; i++) {
      this.scene.remove(this.guideLines[i]);
    }



    this.vertexPositions = [];
    this.vertexColors = [];
    this.cellHighlightFrames = [];
    this.linksPos = {};

    let row: any;
    for (row in this.data) {
      let col: any;
      for (col in data[row]) {
        this.addCell(row, col, data[row][col]);
      }
    }

    // CREATE + ADD MESH
    this.geometry.addAttribute('position', new THREE.BufferAttribute(glutils.makeBuffer3f(this.vertexPositions), 3));
    this.geometry.addAttribute('customColor', new THREE.BufferAttribute(glutils.makeBuffer4f(this.vertexColors), 4));

    this.mesh = new THREE.Mesh(this.geometry, this.shaderMaterial);

    (this.geometry.attributes['customColor'] as THREE.BufferAttribute).needsUpdate = true;

    this.scene.add(this.mesh);
    this.render();
    if (getImageData) {


      let smallDim = Math.min(this.height, this.width);

      this.resizeCanvas(smallDim, smallDim);

      this.matrix.hideCellLabel();
      this.render();

      let imgData = this.canvas.toDataURL();
      this.matrix.updateOverviewImage(imgData);

      this.resizeCanvas(this.width, this.height);

    }
    this.updateGuideLines();
    this.render();
  }


  resizeCanvas(width: number, height: number) {

    this.camera.position.x = width / 2;
    this.camera.position.y = -height / 2;
    this.camera.left = width / -2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = height / -2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  addCell(row: number, col: number, pair: dynamicgraph.NodePair) {
    let links: dynamicgraph.Link[];
    let e: dynamicgraph.Link;
    let x, y, z: number;
    let linkNum: number;
    let seg: number;
    let meanWeight: number;
    let alpha: number;
    let color: THREE.Color;

    links = pair.links().toArray();
    linkNum = links.length;
    seg = linkNum !== 0 ? this.cellSize / linkNum : 0;
    z = 1;

    for (let j = 0; j < links.length; j++) {
      e = links[j];

      let webColor: any = utils.getPriorityColor(e);
      if (!webColor)
        webColor = '#000000';
      meanWeight = e.weights() ? e.weights(this.matrix.startTime, this.matrix.endTime).mean() : 1;
      color = new THREE.Color(webColor);
      alpha = this.linkWeightScale(Math.abs(meanWeight));
      if (!e.isVisible())
        alpha = 0;

      x = col * this.cellSize + seg * j + seg / 2 + this.offset[0];
      y = row * this.cellSize + this.cellSize / 2 + this.offset[1];
      this.paintCell(e.id(), x, y, seg, [color.r, color.g, color.b, alpha], meanWeight > 0);

      if (!this.linksPos[row]) this.linksPos[row] = {};
      if (!this.linksPos[row][col]) this.linksPos[row][col] = [];
      this.linksPos[row][col].push(e.id());
    }

  }

  paintCell(id: number, x: number, y: number, w: number,
    color: number[], positive: Boolean) {
    let h: number = this.cellSize;
    let highlightFrames: THREE.Mesh = new THREE.Mesh();
    let selectionFrames: THREE.Mesh = new THREE.Mesh();
    let frame: any; // BEFORE THREE.Line;

    if (positive) {
      glutils.addBufferedRect(this.vertexPositions, x, -y, 0, w - 1, h - 1,
        this.vertexColors, color);
    } else {
      glutils.addBufferedDiamond(this.vertexPositions, x, -y, 0, w - 1, h - 1,
        this.vertexColors, color);
    }
    // highlight frame
    frame = glutils.createRectFrame(w - 1, h - 1, COLOR_HIGHLIGHT, 1)
    frame.position.x = x;
    frame.position.y = -y;
    frame.position.z = 10;
    highlightFrames.add(frame);
    if (!this.cellHighlightFrames[id]) this.cellHighlightFrames[id] = [];
    this.cellHighlightFrames[id].push(highlightFrames);

    // selection frame
    frame = glutils.createRectFrame(w - 1, h - 1, COLOR_SELECTION, 2)
    frame.position.x = x;
    frame.position.y = -y;
    frame.position.z = 9;
    selectionFrames.add(frame);
    this.cellSelectionFrames[id] = selectionFrames;

  }
  updateGuideLines() {
    this.guideLines = [];

    if (!this.data) return;

    let w = this.ncols * this.cellSize;
    let h = this.nrows * this.cellSize;

    let geometry1 = new THREE.Geometry();
    geometry1.vertices.push(
      new THREE.Vector3(this.offset[0], 0, 0),
      new THREE.Vector3(w + this.offset[0], 0, 0)
    )
    let geometry2 = new THREE.Geometry();
    geometry2.vertices.push(
      new THREE.Vector3(0, -this.offset[1], 0),
      new THREE.Vector3(0, -h - this.offset[1], 0)
    )
    let m, pos;
    let mat = new THREE.LineBasicMaterial({ color: 0xeeeeee, linewidth: 1 });
    let x, y;
    let j = 0;
    for (let i = 0; i <= h; i += this.cellSize) {
      pos = j * this.cellSize + this.offset[1];
      m = new THREE.Line(geometry1, mat)
      m.position.set(0, -pos, 0);
      this.scene.add(m);
      this.guideLines.push(m);
      j++;
    }
    j = 0;
    for (let i = 0; i <= w; i += this.cellSize) {
      pos = j * this.cellSize + this.offset[0];
      m = new THREE.Line(geometry2, mat);
      m.position.set(pos, 0, 0);
      this.scene.add(m);
      this.guideLines.push(m);
      j++;
    }

  }

  highlightLink(cell: Cell) {
    let row = cell.row;
    let col = cell.col;
    let id: number;
    if (this.linksPos[row]) {
      if (this.linksPos[row][col]) {
        for (let id of this.linksPos[row][col]) {
          this.toHoverLinks.push(id);
        }
        //this.render();
      }
    }
  }

  posToCell(pos: Pos) {
    let row = this.cellSize !== 0 ? Math.round((pos.y - this.offset[1] - this.cellSize / 2) / this.cellSize) : 0;
    let col = this.cellSize !== 0 ? Math.round((pos.x - this.offset[0] - this.cellSize / 2) / this.cellSize) : 0;
    return { row: row, col: col };
  }

  private mouseMoveHandler = (e: MouseEvent) => {
    let mpos: Pos = glutils.getMousePos(this.canvas, e.clientX, e.clientY);

    this.toHoverLinks = [];

    let cell = this.posToCell(mpos);

    if (!this.mouseDown) {
      this.highlightLink(cell);
    } else {
      let box: Box = { x0: 0, y0: 0, x1: 0, y1: 0 };
      box.x0 = Math.min(cell.col, this.mouseDownCell.col);
      box.x1 = Math.max(cell.col, this.mouseDownCell.col);
      box.y0 = Math.min(cell.row, this.mouseDownCell.row);
      box.y1 = Math.max(cell.row, this.mouseDownCell.row);

      for (let c = box.x0; c <= box.x1; c++) {
        for (let r = box.y0; r <= box.y1; r++) {
          let ch = { row: r, col: c };
          this.highlightLink(ch);
        }
      }
    }
    if (this.toHoverLinks.length > 0) {
      this.matrix.highlightLinks(this.toHoverLinks);
      this.matrix.updateCellLabel(this.toHoverLinks[0], mpos.x, mpos.y);
    } else {
      this.matrix.highlightLinks([]);
      this.matrix.updateCellLabel(-1, -1000, -1000);
    }
  }

  updateHighlightedLinks(hoveredLinks: number[] | undefined = undefined) {
    this.previousHoveredLinks = this.hoveredLinks;
    this.hoveredLinks = hoveredLinks;
    if (this.previousHoveredLinks)
      for (let id of this.previousHoveredLinks) {
        if (this.cellHighlightFrames[id])
          for (let frame of this.cellHighlightFrames[id])
            this.scene.remove(frame);
      }
    if (this.hoveredLinks)
      for (let id of this.hoveredLinks) {
        if (this.cellHighlightFrames[id])
          for (let frame of this.cellHighlightFrames[id])
            this.scene.add(frame);
      }
    this.render();
  }
  private mouseDownHandler = (e: MouseEvent) => {
    if (e.shiftKey) {
      this.view.on('mousedown.zoom', null);
      this.mouseDown = true;
      this.mouseDownPos = glutils.getMousePos(this.canvas, e.clientX, e.clientY);
      this.mouseDownCell = this.posToCell(this.mouseDownPos);
    }
  }
  private mouseUpHandler = (e: Event) => {
    this.mouseDown = false;
    this.view.call(this.zoom);//.on('zoom', this.zoomed));
    if (this.hoveredLinks)
      for (let id of this.hoveredLinks) {
        if (this.cellHighlightFrames[id])
          for (let frame of this.cellHighlightFrames[id])
            this.scene.remove(frame);
      }
    this.hoveredLinks = [];
  }
  
  clickHandler(e: Event) {
    console.log("click");
  }

  private zoomed = () => {
    let z: number, tr: number[] = [];
    z = this.zoom.scale();
    tr = this.zoom.translate();
    this.updateTransform(z, tr);
  }

  updateTransform(z: any, tr: any) {
    tr[0] = Math.min(0, tr[0]);
    tr[1] = Math.min(0, tr[1]);
    this.zoom.scale(z);
    this.zoom.translate(tr);
    this.matrix.updateTransform(z, tr);
  }
}

class Matrix {

  private visualization: MatrixVisualization | undefined = undefined;
  private labels: MatrixLabels | undefined = undefined;
  private cellLabel: CellLabel | undefined = undefined;
  private menu: MatrixMenu | undefined = undefined;
  private timeSlider: MatrixTimeSlider | undefined = undefined;
  private overview: MatrixOverview | undefined = undefined;
  private _dgraph: dynamicgraph.DynamicGraph;
  private times: dynamicgraph.Time[];
  public startTime: dynamicgraph.Time;
  public endTime: dynamicgraph.Time;
  private nodeOrder: number[];
  private bbox: Box;
  private createOverviewImage: boolean;
  private offset: number[];
  private _tr: number[];
  private _scale: number;
  private _cellSize: any;
  private initialCellSize: any;
  private hoveredLinks: dynamicgraph.Link[];
  private labelLength: number = 0;
  public margin: NMargin;

  constructor() {
    this._dgraph = main.getDynamicGraph();
    this.startTime = this.dgraph.startTime;
    this.endTime = this.dgraph.endTime;
    this.times = this._dgraph.times().toArray()
    this.nodeOrder = this._dgraph.nodes().ids();
    this.bbox = { x0: 0, x1: 0, y0: 0, y1: 0 };
    this._tr = [0, 0];
    this.offset = [0, 0];
    this._scale = 1;
    this.createOverviewImage = false;
    this.initialCellSize = 12;
    this._cellSize = this.initialCellSize;
    this.hoveredLinks = [];
    this.longestLabelLength();
    this.margin = new NMargin(0);
    this.calculatePlotMargin();
    messenger.setDefaultEventListener(this.updateEvent);
    messenger.addEventListener('timeRange', this.timeRangeHandler)
  }

  get dgraph() {
    return this._dgraph;
  }

  get cellSize() {
    return this._cellSize;
  }

  getOverviewScale() {
    let totalNodes = this.dgraph.nodes().visible().length;
    let cs: number;
    if (this.visualization)
      cs = totalNodes !== 0 ? Math.min(this.visualization.height, this.visualization.width) / totalNodes : 0;
    else
      cs = 0
    let scale = this.initialCellSize !== 0 ? cs / this.initialCellSize : 0;
    return scale;
  }
  setVis(matrixVis: MatrixVisualization) {
    this.visualization = matrixVis;
    this.resetTransform();
  }
  setLabels(matrixLabels: MatrixLabels) {
    this.labels = matrixLabels;
  }
  setCellLabel(cellLabel: CellLabel) {
    this.cellLabel = cellLabel;
  }
  setOverview(overview: MatrixOverview) {
    this.overview = overview;
  }
  setMenu(menu: MatrixMenu) {
    this.menu = menu;
  }
  setTimeSlider(timeSlider: MatrixTimeSlider) {
    this.timeSlider = timeSlider;
  }
  updateOverviewImage(dataImg: any) {
    if (this.overview)
      this.overview.updateOverviewImage(dataImg);
  }

  hideCellLabel() {
    if (this.cellLabel)
      this.cellLabel.hideCellLabel();
  }

  updateCellSize(value: number) {
    let scale = this.initialCellSize !== 0 ? value / this.initialCellSize : 0;
    var tr0: number = this._scale !== 0 ? this._tr[0] * scale / this._scale : 0;
    var tr1: number = this._scale !== 0 ? this._tr[1] * scale / this._scale : 0;
    let tr = [tr0, tr1];
    if (this.visualization)
      this.visualization.updateTransform(scale, tr);
  }
  resetTransform() {
    let scale = this.getOverviewScale();
    this.createOverviewImage = true;
    this.updateTransform(scale, [0, 0]);
    this.createOverviewImage = false;
  }

  updateTransform(scale: any, tr: any) {
    this._scale = scale;
    this._tr = tr;
    this._tr[0] = Math.min(this._tr[0], 0);
    this._tr[1] = Math.min(this._tr[1], 0);
    this._cellSize = this._scale * this.initialCellSize;
    if (this.menu)
      this.menu.setScale(this._cellSize);
    this.updateVisibleData();
  }

  dgraphName() {
    return this._dgraph.name;
  }

  numberOfLinks() {
    return this._dgraph.links().length;
  }

  maxWeight() {
    return this._dgraph.links().weights().max();
  }

  reorderWorker(orderType: string) {
    if (orderType == 'alphanumerical') {
      let nodes2 = this._dgraph.nodes().visible().sort('label').toArray();
      this.nodeOrder = [];
      for (let i = 0; i < nodes2.length; i++) {
        this.nodeOrder[nodes2[i].id()] = i;
      }
    } else if (orderType == 'reverse-alpha') {
      let nodes2 = this._dgraph.nodes().visible().sort('label', false).toArray();
      this.nodeOrder = [];
      for (let i = 0; i < nodes2.length; i++) {
        this.nodeOrder[nodes2[i].id()] = i;
      }
    } else if (orderType == 'degree') {
      let nodes2 = this._dgraph.nodes().visible()
        .createAttribute('degree', (n: any) => {
          return n.neighbors().length;
        })
        .sort('degree').toArray();
      for (let i = 0; i < nodes2.length; i++) {
        this.nodeOrder[nodes2[i].id()] = i;
      }
    } else if (orderType == 'similarity') {
      let config: ordering.OrderingConfiguration = new ordering.OrderingConfiguration(this.startTime, this.endTime);
      config.nodes = this._dgraph.nodes().visible().toArray();
      config.links = this._dgraph.links().presentIn(this.startTime, this.endTime).visible().toArray();
      this.nodeOrder = ordering.orderNodes(this._dgraph, config);
    } else {
      let visibleNodes = this._dgraph.nodes().visible().toArray();
      this.nodeOrder = [];
      for (let i = 0; i < visibleNodes.length; i++) {
        this.nodeOrder[visibleNodes[i].id()] = i;
      }
    }

    this.resetTransform();

  }


  longestLabelLength() {
    this.labelLength = 30;
  }
  calculatePlotMargin() {
    this.margin.setMargin((this.labelLength * 0.5) * this.cellSize);
  }


  updateVisibleBox() {
    this.bbox.x0 = this._cellSize !== 0 ? -Math.floor(this._tr[0] / this._cellSize) : 0;
    this.bbox.y0 = this._cellSize !== 0 ? -Math.floor(this._tr[1] / this._cellSize) : 0;
    if (this.visualization) {
      this.bbox.x1 = this._cellSize !== 0 ? this.bbox.x0 + Math.floor(this.visualization.width / this._cellSize) : this.bbox.x0;
      this.bbox.y1 = this._cellSize !== 0 ? this.bbox.y0 + Math.floor(this.visualization.height / this._cellSize) : this.bbox.y0;
    }
    else {
      this.bbox.x1 = this.bbox.x0;
      this.bbox.y1 = this.bbox.y0;
    }

    this.offset[0] = this._cellSize !== 0 ? (this._tr[0] / this._cellSize + this.bbox.x0) * this._cellSize : 0;
    this.offset[1] = this._cellSize !== 0 ? (this._tr[1] / this._cellSize + this.bbox.y0) * this._cellSize : 0;
  }

  updateVisibleData() {
    this.updateVisibleBox();
    let leftNodes = this.dgraph.nodes().visible().toArray();
    leftNodes = leftNodes.filter((d: any) =>
      this.nodeOrder[d.id()] >= this.bbox.y0 &&
      this.nodeOrder[d.id()] <= this.bbox.y1);
    let topNodes = this.dgraph.nodes().visible().toArray();
      topNodes = topNodes.filter((d: any) =>
        this.nodeOrder[d.id()] >= this.bbox.x0 &&
        this.nodeOrder[d.id()] <= this.bbox.x1);
    

    let visibleData: { [id: number]: { [id: number]: dynamicgraph.NodePair } } = {};
    let row, col: number;
    let node: dynamicgraph.Node;

    for (let i = 0; i < leftNodes.length; i++) {
      node = leftNodes[i];
      if (node.isVisible()) {
        row = this.nodeOrder[node.id()] - this.bbox.y0;
        for (let link of node.links().toArray()) {
          var neighbor;
          // if((link as any).directed == true){
          //   console.log('directed', (link as any).directed)
          //   neighbor = link.target;
          //   if(link.target.id() == node.id()){
          //     continue;
          //   }
          // }else{
            neighbor = link.source.id() == node.id() ? link.target : link.source;
          // }
          // let neighbor = link.source.id() == node.id() ? link.target : link.source;
          if (neighbor.isVisible() &&
            this.nodeOrder[neighbor.id()] >= this.bbox.x0 &&
            this.nodeOrder[neighbor.id()] <= this.bbox.x1) {
            if (!visibleData[row]) visibleData[row] = {};
            col = this.nodeOrder[neighbor.id()] - this.bbox.x0;
            visibleData[row][col] = link.nodePair();
          }
        }
      }
    }

    if (this.visualization) {
      this.visualization.updateData(visibleData,
        leftNodes.length, topNodes.length,
        this.cellSize,
        this.offset, this._scale, this._tr,
        this.createOverviewImage);
    }

    if (this.overview) {
      let totalNodes: number = this.dgraph.nodes().visible().length;
      let widthRatio: number = totalNodes !== 0 ? (this.bbox.x1 - this.bbox.x0) / totalNodes : 0;
      let heightRatio: number = totalNodes !== 0 ? (this.bbox.y1 - this.bbox.y0) / totalNodes : 0;
      let ratio: number = totalNodes * this.cellSize;

      var matrixX0: number = totalNodes !== 0 ? this.bbox.x0 / totalNodes : 0;
      var matrixY0: number = totalNodes !== 0 ? this.bbox.y0 / totalNodes : 0;
      this.overview.updateFocus(matrixX0, matrixY0,
        widthRatio, heightRatio,
        ratio, this._scale, this._tr);
    }

    if (this.labels) {
      this.labels.updateData(leftNodes, topNodes, this.cellSize, this.nodeOrder,
        this.offset[1], this.offset[0], this.bbox);
    }
  }
  highlightLinks(highlightedIds: number[]) {
    if (highlightedIds.length > 0) {
      let highlightedLinks: (dynamicgraph.Link | undefined)[] = highlightedIds.map(
        (d) => this._dgraph.link(d));
      messenger.highlight('set', <utils.ElementCompound>{ links: highlightedLinks });
    } else
      messenger.highlight('reset');
  }
  nodeClicked(d: dynamicgraph.Node) {
    let selections = d.getSelections();
    let currentSelection = this._dgraph.getCurrentSelection();
    for (let j = 0; j < selections.length; j++) {
      if (selections[j] == currentSelection) {
        messenger.selection('remove', <utils.ElementCompound>{ nodes: [d] });
        return;
      }
    }
    messenger.selection('add', <utils.ElementCompound>{ nodes: [d] });
    if (this.labels)
      this.labels.updateHighlightedNodes();
  }
  highlightNodes(highlightedIds: number[]) {
    if (highlightedIds.length > 0) {
      let highlightedNodes: (dynamicgraph.Node | undefined)[] = highlightedIds.map(
        (d) => this._dgraph.node(d));
      messenger.highlight('set', <utils.ElementCompound>{ nodes: highlightedNodes });
    } else
      messenger.highlight('reset');
  }
  updateCellLabel(linkId: number, mx: number, my: number) {
    if (linkId < 0) {
      if (this.cellLabel)
        this.cellLabel.updateCellLabel(-1000, -1000, null, 0);
      return;
    }
    let link = this._dgraph.link(linkId);
    if (link) {
      let val = link.weights(this.startTime, this.endTime).get(0);
      val = Math.round(val * 1000) / 1000;
      let z = this._scale;
      let fw = this.initialCellSize;
      if (this.cellLabel)
        this.cellLabel.updateCellLabel(mx, my, val, fw);
    }

  }
  updateEvent = () => {

    let highlightedNodesIds = [];
    let highlightedLinksIds = [];

    let highlightedLinks = this._dgraph.links().highlighted().toArray();
    if (highlightedLinks.length > 0) {
      for (let i = 0; i < highlightedLinks.length; i++) {
        if (!highlightedLinks[i].isVisible())
          continue;
        highlightedNodesIds.push(highlightedLinks[i].source.id());
        highlightedNodesIds.push(highlightedLinks[i].target.id());
        highlightedLinksIds.push(highlightedLinks[i].id());
      }

    } else {
      let highlightedNodes = this._dgraph.nodes().highlighted().toArray();
      for (let i = 0; i < highlightedNodes.length; i++) {
        let node = highlightedNodes[i];
        if (node.isVisible()) {
          for (let link of node.links().toArray()) {
            let neighbor = link.source.id() == node.id() ? link.target : link.source;
            if (neighbor.isVisible())
              highlightedLinksIds.push(link.id());
          }
        }
      }
    }

    // show/hide visible/filtered links

    this.updateVisibleData();

    if (this.labels)
      this.labels.updateHighlightedNodes(highlightedNodesIds);

    if (this.visualization)
      this.visualization.updateHighlightedLinks(highlightedLinksIds);
  }

  timeRangeHandler = (m: messenger.TimeRangeMessage) => {

    this.startTime = this.times[0];
    this.endTime = this.times[this.times.length - 1];
    for (var i = 0; i < this.times.length; i++) {
      if (this.times[i].unixTime() > m.startUnix) {
        this.startTime = this.times[i - 1];
        break;
      }
    }
    for (i; i < this.times.length; i++) {
      if (this.times[i].unixTime() > m.endUnix) {
        this.endTime = this.times[i - 1];
        break;
      }
    }
    if (this.timeSlider)
      this.timeSlider.set(m.startUnix, m.endUnix);

    this.updateVisibleData();
  }

}


let matrix = new Matrix();

let vizWidth: number = window.innerWidth - 10;
let vizHeight: number = window.innerHeight - 115;
let appendToBody = (domId: any) => { return $('<div id=' + domId + '></div>').appendTo('body') };
let menuJQ = appendToBody("networkcube-matrix-menu");
let tsJQ = appendToBody("networkcube-matrix-timelineDiv'")
let labJQ = appendToBody("networkcube-matrix-visDiv");

let svg = d3.select(labJQ.get(0))
  .append('svg')
  .attr('id', 'networkcube-matrix-visSvg')
  .attr('width', vizWidth)
  .attr('height', vizHeight);

let foreignObject: any = svg.append('foreignObject') // BEFORE d3.Selection
  .attr('id', 'networkcube-matrix-visCanvasFO')
  .attr('x', matrix.margin.left)
  .attr('y', matrix.margin.top)
  .attr('width', vizWidth - matrix.margin.left)
  .attr('height', vizHeight - matrix.margin.top);

let bbox = foreignObject.node().getBBox();

let matrixMenu = new MatrixMenu(menuJQ, matrix);
if(matrix.dgraph.times().size() > 1){
  let matrixTimeSlider;
  matrixTimeSlider = new MatrixTimeSlider(tsJQ, matrix, vizWidth);
  matrix.setTimeSlider(matrixTimeSlider);
  messenger.addEventListener('timeRange', matrix.timeRangeHandler);
}
let matrixLabels = new MatrixLabels(svg, matrix.margin, matrix);
let matrixVis = new MatrixVisualization(foreignObject, bbox.width, bbox.height, matrix);
let matrixOverview = new MatrixOverview(svg, matrix.margin.left - 2, matrix.margin.top - 2, matrix);
let cellLabel = new CellLabel();


matrix.setLabels(matrixLabels);
matrix.setMenu(matrixMenu);
matrix.setCellLabel(cellLabel);
matrix.setOverview(matrixOverview);
matrix.setVis(matrixVis);
messenger.addEventListener(messenger.MESSAGE_SET_STATE, setStateHandler);
messenger.addEventListener(messenger.MESSAGE_GET_STATE, getStateHandler);


/////////////////
//// UPDATES ////
/////////////////


function setStateHandler(m: messenger.SetStateMessage){
  if (m.viewType=="matrix" ){
 
    var state: messenger.MatrixControls = m.state as messenger.MatrixControls;    
    // unpack / query that state object
    // e.g., var params = state.params.
    // set the parameters below:...  
    
   
    

    // set labelling type
    matrix.reorderWorker(state.labellingType);

     // set cell size (zoom)
    matrix.updateCellSize(state.zoom);

    // set time (start/end)
    messenger.timeRange(state.timeSliderStart, state.timeSliderEnd, matrix.startTime, true);
  //timeSlider.set(state.timeSliderStart, state.timeSliderEnd);

    // camera
  /*  webgl=state.webglState;
      webgl.camera.position.x=state.camer_position_x ;
      webgl.camera.position.y=state.camer_position_y  ;
      webgl.camera.position.z=state.camer_position_z  ;
  */
  }

}


function getStateHandler( m: messenger.GetStateMessage){
  if (m.viewType=="matrix" ){

    /*         var webglState=webgl;
        var camer_position_x=webgl.camera.position.x;
        var camer_position_y=webgl.camera.position.y;
        var camer_position_z=webgl.camera.position.z; */
        let zoomValue: any = $('#cellSizeBox').val();
        let orderType: any = $('#labelOrdering').val();

        //matrix.cellSize
      var matrixNetwork: messenger.NetworkControls=new messenger.MatrixControls("matrix",matrix.startTime.unixTime(),matrix.endTime.unixTime(),zoomValue,orderType);
      
/*       var bookmarksArray=JSON.parse(localStorage.getItem("vistorianBookmarks") || "[]");

      if (m.bookmarkIndex!=bookmarksArray.length-1){
          bookmarksArray[m.bookmarkIndex].controlsValues[1]=matrixNetwork;
      }
      else{
          bookmarksArray[m.bookmarkIndex].controlsValues.push(matrixNetwork);
        
      }
      localStorage.setItem("vistorianBookmarks", JSON.stringify(bookmarksArray)) */
  
       messenger.stateCreated(matrixNetwork,m.bookmarkIndex,m.viewType,m.isNewBookmark,m.typeOfMultiView);

  }
}
