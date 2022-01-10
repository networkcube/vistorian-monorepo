import * as d3 from "d3";

import {
  BasicElement,
  Time,
  IDCompound,
  DynamicGraph,
  NodePair,
  Node,
  Link,
  LinkType,
  copyPropsShallow,
} from "./dynamicgraph";

// TODO: refactor imports to import from dates directly...
export { formatAtGranularity, formatTimeAtGranularity } from "./dates";
import { Selection } from "./dynamicgraphutils";

/* moved from utils to queries */

export function getType(elements: any[]): string | undefined {
  // before was only string

  let type = ""; // before only string, without init
  if (elements.length == 0) return;
  if (elements[0] instanceof Node) type = "node";
  else if (elements[0] instanceof Link) {
    type = "link";
  } else if (elements[0] instanceof Time) {
    type = "time";
  } else if (elements[0] instanceof NodePair) {
    type = "nodePair";
  } else if (elements[0] instanceof LinkType) {
    type = "linkType";
  } else if (typeof elements[0] == "number") {
    type = "number";
  }

  return type;
}

/* moved from utils to queries */

export function makeElementCompound(
  elements: IDCompound,
  g: DynamicGraph
): ElementCompound {
  const result: ElementCompound = new ElementCompound();
  if (elements != undefined) {
    if (elements.nodeIds) {
      result.nodes = <Node[]>elements.nodeIds.map((id) => g.node(id)); // ?? WITH OR WITHOUT ?? .filter((element) => { return (element != undefined) });
    }
    if (elements.linkIds) {
      result.links = <Link[]>elements.linkIds.map((id) => g.link(id));
    }
    if (elements.timeIds) {
      result.times = <Time[]>elements.timeIds.map((id) => g.time(id));
    }
    if (elements.nodePairIds) {
      result.nodePairs = <NodePair[]>(
        elements.nodePairIds.map((id) => g.nodePair(id))
      );
    }
  }
  return result;
}

/* moved from utils to queries */
export class ElementCompound {
  nodes: Node[] = [];
  links: Link[] = [];
  times: Time[] = [];
  nodePairs: NodePair[] = [];
  locations: Location[] = [];
}

export function getPriorityColor(element: BasicElement): string | undefined {
  // before: return string

  let j = 0;
  const selections = element.getSelections();
  while (!selections[j].showColor) {
    j++;
    if (j == selections.length) {
      j = -1;
      return;
    }
  }
  return element.getSelections()[j].color;
}

export function sortByPriority(s1: Selection, s2: Selection): number {
  return s1.priority - s2.priority;
}

export function getUrlVars(): Record<string, any> {
  const vars: Record<string, any> = {};
  const params = window.location.search.replace("?", "").split("&");
  let tmp: any;
  let value: any;
  params.forEach(function (item) {
    tmp = item.split("=");
    value = decodeURIComponent(tmp[1]);
    (vars as any)[tmp[0]] = value;
  });
  return vars;
}

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function isBefore(t1: Time, t2: Time): boolean {
  return t1.time < t2.time;
}

export function isAfter(t1: Time, t2: Time): boolean {
  return t1.time > t2.time;
}

export function hex2Rgb(hex: string): number[] {
  return [hexToR(hex), hexToG(hex), hexToB(hex)];
}

function hexToR(h: string) {
  return parseInt(cutHex(h).substring(0, 2), 16);
}

function hexToG(h: string) {
  return parseInt(cutHex(h).substring(2, 4), 16);
}

function hexToB(h: string) {
  return parseInt(cutHex(h).substring(4, 6), 16);
}

function cutHex(h: string) {
  return h.charAt(0) == "#" ? h.substring(1, 7) : h;
}

export function hex2web(v: string): string {
  v = v + "";
  return v.replace("0x", "#");
}

export function hex2RgbNormalized(hex: string): number[] {
  return [hexToR(hex) / 255, hexToG(hex) / 255, hexToB(hex) / 255];
}

export function areEqualShallow(a: any, b: any): boolean {
  for (const key in a) {
    if (!(key in b) || a[key] !== b[key]) {
      return false;
    }
  }
  for (const key in b) {
    if (!(key in a) || a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

export function compareTypesShallow(a: any, b: any): boolean {
  if (a == null || b == null) return a == b;
  if (typeof a != typeof b) return false;
  else if (typeof a != "object") return true;
  else if (a.constructor !== b.constructor) return false;
  else {
    return true;
  }
}

export function copyArray<TElement>(
  arr: any[],
  ctorFunc: () => TElement
): TElement[] {
  const arrayClone: TElement[] = [];
  for (const elem in arr) {
    arrayClone.push(copyPropsShallow(arr[elem], ctorFunc()));
  }
  return arrayClone;
}

export class Box {
  x1: number;
  x2: number;
  y1: number;
  y2: number;

  constructor(x1: number, y1: number, x2: number, y2: number) {
    this.x1 = Math.min(x1, x2);
    this.x2 = Math.max(x1, x2);
    this.y1 = Math.min(y1, y2);
    this.y2 = Math.max(y1, y2);
  }

  get width(): number {
    return this.x2 - this.x1;
  }

  get height(): number {
    return this.y2 - this.y1;
  }

  isPoint(): boolean {
    return this.width == 0 && this.height == 0;
  }
}

export function inBox(x: number, y: number, box: Box): boolean {
  return x > box.x1 && x < box.x2 && y > box.y1 && y < box.y2;
}

export function isSame(a: any[], b: any[]): boolean {
  if (a.length != b.length) return false;
  let found = true;
  for (let i = 0; i < a.length; i++) {
    found = false;
    for (let j = 0; j < b.length; j++) {
      if (a[i] == b[j]) found = true;
    }
    if (!found) return false;
  }
  return true;
}

export function cloneCompound(compound: IDCompound): IDCompound {
  const result: IDCompound = new IDCompound();
  if (compound.nodeIds) {
    result.nodeIds = [];
    for (let i = 0; i < compound.nodeIds.length; i++) {
      result.nodeIds.push(compound.nodeIds[i]);
    }
  }
  if (compound.linkIds) {
    result.linkIds = [];
    for (let i = 0; i < compound.linkIds.length; i++) {
      result.linkIds.push(compound.linkIds[i]);
    }
  }
  if (compound.nodePairIds) {
    result.nodePairIds = [];
    for (let i = 0; i < compound.nodePairIds.length; i++) {
      result.nodePairIds.push(compound.nodePairIds[i]);
    }
  }
  if (compound.timeIds) {
    result.timeIds = [];
    for (let i = 0; i < compound.timeIds.length; i++) {
      result.timeIds.push(compound.timeIds[i]);
    }
  }
  return result;
}

export function makeIdCompound(
  elements: ElementCompound | undefined
): IDCompound {
  const result: IDCompound = new IDCompound();
  if (elements != undefined) {
    if (elements.nodes) {
      result.nodeIds = elements.nodes.map((n: Node) => n.id());
    }
    if (elements.links) {
      result.linkIds = elements.links.map((n: Link) => n.id());
    }
    if (elements.times) {
      result.timeIds = elements.times.map((n: Time) => n.id());
    }
    if (elements.nodePairs) {
      result.nodePairIds = elements.nodePairs.map((n: NodePair) => n.id());
    }
  }
  return result;
}

export function arraysEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function encapsulate(
  array: any[],
  attrName?: string
): Record<string, any>[] {
  if (attrName == undefined) {
    attrName = "element";
  }
  const a = [];
  let o: Record<string, any>;
  for (let i = 0; i < array.length; i++) {
    o = {
      index: i,
    };
    (o as any)[attrName] = array[i];
    a.push(o);
  }
  return a;
}

export function isPointInPolyArray(poly: number[][], pt: number[]): boolean {
  const l = poly.length;

  let c = false;
  let i = -1;
  let j = l - 1;

  for (; ++i < l; j = i)
    ((poly[i][1] <= pt[1] && pt[1] < poly[j][1]) ||
      (poly[j][1] <= pt[1] && pt[1] < poly[i][1])) &&
      pt[0] <
        ((poly[j][0] - poly[i][0]) * (pt[1] - poly[i][1])) /
          (poly[j][1] - poly[i][1]) +
          poly[i][0] &&
      (c = !c);
  return c;
}

////////////////////////////
/// SCREENSHOT FUNCTIONS ///
////////////////////////////

///////////
/// PNG ///
///////////

// Downloads the content of the openGL canvas to the
// desktop.
export function downloadPNGFromCanvas(name: string): void {
  const blob = getBlobFromCanvas(document.getElementsByTagName("canvas")[0]);
  const fileNameToSaveAs = name + "_" + new Date().toUTCString() + ".png";
  const downloadLink = document.createElement("a");
  downloadLink.download = fileNameToSaveAs;
  downloadLink.href = window.URL.createObjectURL(blob);
  downloadLink.click();
}

// Returns a blob from the passed canvas.
function getBlobFromCanvas(canvas: any): Blob {
  const dataURL = canvas.toDataURL("image/png");
  return dataURItoBlob(dataURL);
}

///////////
/// SVG ///
///////////

// creates an image blob from the passed svg and calls the
// callback function with the blob as parameter
export function getBlobFromSVG(
  name: string,
  svgId: string,
  callback?: (blob: any, name: string) => void
): void {
  //  const width = $("#" + svgId).width();
  const svg = document.querySelector("#" + svgId);
  if (!svg) {
    return;
  }
  const width = svg.scrollWidth;
  const height = svg.scrollHeight;
  if (callback != undefined)
    // UNDEFINED ??
    getBlobFromSVGString(
      name,
      getSVGString(d3.select("#" + svgId).node()),
      width,
      height,
      callback
    ); // what happend if callback undefinied (example above)
}

export function getBlobFromSVGNode(
  name: string,
  svgNode: any,
  callback: (blob: any, name: string) => void,
  backgroundColor?: string
): void {
  const string = getSVGString(svgNode);
  let width = svgNode.getAttribute("width");
  let height = svgNode.getAttribute("height");
  if (width == null) {
    width = window.innerWidth + 1000;
  }
  if (height == null) {
    height = window.innerHeight + 1000;
  }
  getBlobFromSVGString(name, string, width, height, callback, backgroundColor);
}

export function getBlobFromSVGString(
  name: string,
  svgString: string,
  width: number,
  height: number,
  callback: (blob: Blob, name: string) => void,
  backgroundColor?: string
): void {
  const imgsrc: string =
    "data:image/svg+xml;base64," +
    btoa(unescape(encodeURIComponent(svgString))); // Convert SVG string to data URL

  // Prepare canvas
  const canvas: any = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context: any = canvas.getContext("2d");
  const image: any = new Image();
  image.src = imgsrc;

  image.onload = function () {
    context.clearRect(0, 0, width, height);
    if (backgroundColor) {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(image, 0, 0, width, height);

    canvas.toBlob(function (blob: any) {
      callback(blob, name);
    });
  };
}

export function getSVGString(svgNode: any): string {
  svgNode.setAttribute("xlink", "http://www.w3.org/1999/xlink");
  const cssStyleText = getCSSStyles(svgNode);
  appendCSS(cssStyleText, svgNode);

  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgNode);
  svgString = svgString.replace(/(\w+)?:?xlink=/g, "xmlns:xlink="); // Fix root xlink without namespace
  svgString = svgString.replace(/NS\d+:href/g, "xlink:href"); // Safari NS namespace fix

  return svgString;

  function getCSSStyles(parentElement: any) {
    const selectorTextArr = [];

    // Add Parent element Id and Classes to the list
    selectorTextArr.push("#" + parentElement.id);
    for (let c = 0; c < parentElement.classList.length; c++)
      if (!contains("." + parentElement.classList[c], selectorTextArr))
        selectorTextArr.push("." + parentElement.classList[c]);

    // Add Children element Ids and Classes to the list
    const nodes = parentElement.getElementsByTagName("*");
    for (let i = 0; i < nodes.length; i++) {
      const id = nodes[i].id;
      if (!contains("#" + id, selectorTextArr)) selectorTextArr.push("#" + id);

      const classes = nodes[i].classList;
      for (let c = 0; c < classes.length; c++)
        if (!contains("." + classes[c], selectorTextArr))
          selectorTextArr.push("." + classes[c]);
    }

    // Extract CSS Rules
    let extractedCSSText = "";
    for (let i = 0; i < document.styleSheets.length; i++) {
      const s = <CSSStyleSheet>document.styleSheets[i];

      try {
        if (!s.cssRules) continue;
      } catch (e) {
        if (e.name !== "SecurityError") throw e; // for Firefox
        continue;
      }

      const cssRules = s.cssRules;
      for (let r = 0; r < cssRules.length; r++) {
        const rule = <CSSStyleRule>cssRules[r];
        if (contains(rule.selectorText, selectorTextArr))
          extractedCSSText += rule.cssText;
      }
    }

    return extractedCSSText;

    function contains(str: string, arr: any) {
      return arr.includes(str);
    }
  }

  function appendCSS(cssText: string, element: any) {
    const styleElement = document.createElement("style");
    styleElement.setAttribute("type", "text/css");
    styleElement.innerHTML = cssText;
    const refNode = element.hasChildNodes() ? element.children[0] : null;
    element.insertBefore(styleElement, refNode);
  }
}

export function exportPNG(canvas: HTMLCanvasElement, name: string): void {
  const dataURL: string = canvas.toDataURL("image/jpg", 1);
  const blob: Blob = dataURItoBlob(dataURL);
  // window.open(dataURL);

  const fileNameToSaveAs: string =
    name + "_" + new Date().toUTCString() + ".png";
  const downloadLink: HTMLAnchorElement = document.createElement("a");
  downloadLink.download = fileNameToSaveAs;
  downloadLink.href = (window as any).webkitURL.createObjectURL(blob);
  downloadLink.click();
}

// returns a blob from a URL/URI
function dataURItoBlob(dataURI: string): Blob {
  // convert base64/URLEncoded data component to raw binary data held in a string
  let byteString;
  if (dataURI.split(",")[0].indexOf("base64") >= 0)
    byteString = atob(dataURI.split(",")[1]);
  else byteString = unescape(dataURI.split(",")[1]);

  // separate out the mime component
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  console.log("mimeString", mimeString);

  // write the bytes of the string to a typed array
  const ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], { type: mimeString });
}

export function showMessage(message: string, timeout: number): void {
  const removeMessageBox = () => {
    const messageBox = document.querySelector(".messageBox");
    if (messageBox) {
      messageBox.outerHTML = "";
    }
  };

  removeMessageBox();

  const el = document.createElement("div");
  el.innerHTML = `
  <div id="div" class="messageBox" style="
                    width: 100%;
                    height: 100%;
                    background-color: #ffffff;
                    opacity: .9;
                    position: absolute;
                    top: 0;
                    left: 0;">
  <div id="div" style="
        font-size: 20pt;
        font-weight: bold;
        font-family: 'Helvetica Neue', Helvetica, sans-serif;
        width: 500px;
        padding-top: 300px;
        text-align: center;
        margin:auto;">
          <p>${message}</p>
   </div>             
</div>
  `;

  const fadeOutEffect = () => {
    const fadeTarget = document.getElementById(".messageBox");
    if (!fadeTarget) {
      return;
    }
    const fadeEffect = setInterval(function () {
      if (!fadeTarget.style.opacity) {
        fadeTarget.style.opacity = "1";
      }
      if (+fadeTarget.style.opacity > 0) {
        fadeTarget.style.opacity = (+fadeTarget.style.opacity - 0.1).toString();
      } else {
        clearInterval(fadeEffect);
      }
    }, 200);
  };

  document.querySelector("body")?.appendChild(el);
  el.onclick = removeMessageBox;

  if (timeout) {
    // Automatically disappear
    window.setTimeout(fadeOutEffect, timeout);
  }
}
