/// <reference path="./lib/d3.d.ts"/>

//import * as d3 from 'd3'
import {
    BasicElement,
    Time,
    IDCompound,
    DynamicGraph,
    NodePair,
    Node,
    Link,
    LinkType,
    copyPropsShallow
} from './dynamicgraph'
import * as moment from 'moment'

//namespace networkcube {


/* moved from utils to queries */

export function getType(elements: any[]): string | undefined { // before was only string

    var type: string = ''; // before only string, without init
    if (elements.length == 0)
        return;
    if (elements[0] instanceof Node)
        type = 'node';
    else
        if (elements[0] instanceof Link) {
            type = 'link';
        } else
            if (elements[0] instanceof Time) {
                type = 'time';
            } else
                if (elements[0] instanceof NodePair) {
                    type = 'nodePair';
                } else
                    if (elements[0] instanceof LinkType) {
                        type = 'linkType';
                    } else
                        if (typeof elements[0] == 'number') {
                            type = 'number';
                        }

    return type;
}

/* moved from utils to queries */

export function makeElementCompound(elements: IDCompound, g: DynamicGraph): ElementCompound {
    var result: ElementCompound = new ElementCompound;
    if (elements != undefined) {
        if (elements.nodeIds) {
            result.nodes = <Node[]>elements.nodeIds.map((id, i) => g.node(id)); // ?? WITH OR WITHOUT ?? .filter((element) => { return (element != undefined) });
        }
        if (elements.linkIds) {
            result.links = <Link[]>elements.linkIds.map((id, i) => g.link(id));
        }
        if (elements.timeIds) {
            result.times = <Time[]>elements.timeIds.map((id, i) => g.time(id));
        }
        if (elements.nodePairIds) {
            result.nodePairs = <NodePair[]>elements.nodePairIds.map((id, i) => g.nodePair(id));
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


export function getPriorityColor(element: BasicElement): string | undefined { // before: return string

    var j = 0
    var selections = element.getSelections();
    while (!selections[j].showColor) {
        j++;
        if (j == selections.length) {
            j = -1;
            return;
        }
    }
    return element.getSelections()[j].color;
}


export function sortByPriority(s1: any, s2: any) {
    return s1.priority - s2.priority;
}


export function getUrlVars(): Object {
    var vars: Object = {};
    var params = window.location.search.replace("?", "").split('&');
    console.log(params);
    var tmp: any;
    var value: any;
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
    return [hexToR(hex), hexToG(hex), hexToB(hex)]
}
function hexToR(h: any) { return parseInt((cutHex(h)).substring(0, 2), 16); }
function hexToG(h: any) { return parseInt((cutHex(h)).substring(2, 4), 16); }
function hexToB(h: any) { return parseInt((cutHex(h)).substring(4, 6), 16); }
function cutHex(h: any) { return (h.charAt(0) == "#") ? h.substring(1, 7) : h; }

export function hex2web(v: string) {
    v = v + '';
    return v.replace('0x', '#');
}

export function hex2RgbNormalized(hex: string): number[] {
    return [hexToR(hex) / 255, hexToG(hex) / 255, hexToB(hex) / 255]
}


export function areEqualShallow(a: any, b: any): boolean {
    for (var key in a) {
        if (!(key in b) || a[key] !== b[key]) {
            return false;
        }
    }
    for (var key in b) {
        if (!(key in a) || a[key] !== b[key]) {
            return false;
        }
    }
    return true;
}

export function compareTypesShallow(a: any, b: any): boolean {
    if (a == null || b == null)
        return a == b;
    if (typeof a != typeof b)
        return false;
    else if (typeof a != 'object')
        return true;
    else if (a.constructor !== b.constructor)
        return false;
    else {
        return true;
    }
}

export function copyArray<TElement>(arr: any[], ctorFunc: () => TElement): TElement[] {
    var arrayClone: TElement[] = [];
    for (var elem in arr) {
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
        return (this.width == 0) && (this.height == 0);
    }
}

export function inBox(x: any, y: any, box: Box): boolean {
    return (x > box.x1
        && x < box.x2
        && y > box.y1
        && y < box.y2)
}


export function isSame(a: any[], b: any[]): boolean {
    if (a.length != b.length)
        return false;
    var found = true;
    for (var i = 0; i < a.length; i++) {
        found = false;
        for (var j = 0; j < b.length; j++) {
            if (a[i] == b[j])
                found = true;
        }
        if (!found)
            return false;
    }
    return true;
}

export function cloneCompound(compound: IDCompound): IDCompound {
    var result: IDCompound = new IDCompound();
    if (compound.nodeIds) {
        result.nodeIds = [];
        for (var i = 0; i < compound.nodeIds.length; i++) {
            result.nodeIds.push(compound.nodeIds[i])
        }
    }
    if (compound.linkIds) {
        result.linkIds = [];
        for (var i = 0; i < compound.linkIds.length; i++) {
            result.linkIds.push(compound.linkIds[i])
        }
    }
    if (compound.nodePairIds) {
        result.nodePairIds = [];
        for (var i = 0; i < compound.nodePairIds.length; i++) {
            result.nodePairIds.push(compound.nodePairIds[i])
        }
    }
    if (compound.timeIds) {
        result.timeIds = [];
        for (var i = 0; i < compound.timeIds.length; i++) {
            result.timeIds.push(compound.timeIds[i])
        }
    }
    return result;
}

export function makeIdCompound(elements: ElementCompound | undefined): IDCompound {
    var result: IDCompound = new IDCompound;
    if (elements != undefined) {
        if (elements.nodes) {
            result.nodeIds = elements.nodes.map((n: any, i: any) => n.id());
        }
        if (elements.links) {
            result.linkIds = elements.links.map((n: any, i: any) => n.id());
        }
        if (elements.times) {
            result.timeIds = elements.times.map((n: any, i: any) => n.id());
        }
        if (elements.nodePairs) {
            result.nodePairIds = elements.nodePairs.map((n: any, i: any) => n.id());
        }
    }
    return result;
}

export function formatAtGranularity(time: any, granualarity: number) {
    switch (granualarity) {
        case 0: return time.millisecond();
        case 1: return time.second();
        case 2: return time.minute();
        case 3: return time.hour();
        case 4: return time.day();
        case 5: return time.week();
        case 6: return time.month() + 1;
        case 7: return time.year();
    }
}

export function arraysEqual(a: any, b: any) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

export function encapsulate(array: any[], attrName?: string): Object[] {
    if (attrName == undefined) {
        attrName = 'element';
    }
    var a = []
    var o: Object;
    for (var i = 0; i < array.length; i++) {
        o = {
            index: i,
        };
        (o as any)[attrName] = array[i];
        a.push(o);
    }
    return a;
}

export function isPointInPolyArray(poly: number[][], pt: number[]) {
    for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i) ((poly[i][1] <= pt[1] && pt[1] < poly[j][1]) || (poly[j][1] <= pt[1] && pt[1] < poly[i][1])) && (pt[0] < (poly[j][0] - poly[i][0]) * (pt[1] - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0]) && (c = !c); return c;
}


export function formatTimeAtGranularity(time: Time, granualarity: number) {
    var momentTime = moment.utc(time.unixTime())
    switch (granualarity) {
        case 0: return momentTime.millisecond();
        case 1: return momentTime.second();
        case 2: return momentTime.minute();
        case 3: return momentTime.hour();
        case 4: return momentTime.day();
        case 5: return momentTime.week();
        case 6: return momentTime.month() + 1;
        default: return momentTime.year();
    }
}


////////////////////////////
/// SCREENSHOT FUNCTIONS ///
////////////////////////////


///////////
/// PNG ///
///////////

// Downloads the content of the openGL canvas to the 
// desktop.
export function downloadPNGFromCanvas(name: string) {
    var blob = getBlobFromCanvas(document.getElementsByTagName('canvas')[0]);
    var fileNameToSaveAs = name + '_' + new Date().toUTCString() + '.png';
    var downloadLink = document.createElement("a")
    downloadLink.download = fileNameToSaveAs;
    downloadLink.href = window.URL.createObjectURL(blob);
    downloadLink.click();
}

// Returns a blob from the passed canvas.
function getBlobFromCanvas(canvas: any): Blob {
    var dataURL = canvas.toDataURL("image/png")
    return dataURItoBlob(dataURL);
}




///////////
/// SVG ///
///////////

// downloads a screenshot on the desktop from the passed svg
export function downloadPNGfromSVG(name: string, svgId: string) {
    var blob = getBlobFromSVG(name, svgId);
}

// creates an image blob from the passed svg and calls the 
// callback function with the blob as parameter
export function getBlobFromSVG(name: string, svgId: string, callback?: Function) {
    var width = $('#' + svgId).width();
    var height = $('#' + svgId).height();
    console.log('SVG SIZE: ' + width, height)
    if (callback != undefined) // UNDEFINED ?? 
        getBlobFromSVGString(name, getSVGString(d3.select('#' + svgId).node()), width, height, callback) // what happend if callback undefinied (example above)
}
export function getBlobFromSVGNode(name: string, svgNode: any, callback: Function, backgroundColor?: string) {
    var string = getSVGString(svgNode);
    var width = svgNode.getAttribute('width')
    var height = svgNode.getAttribute('height')
    if (width == null) {
        width = window.innerWidth + 1000;
    }
    if (height == null) {
        height = window.innerHeight + 1000;
    }
    getBlobFromSVGString(name, string, width, height, callback, backgroundColor)
}
export function getBlobFromSVGString(name: string, svgString: string, width: number, height: number, callback: Function, backgroundColor?: string) {
    console.log('width', width)
    console.log('height', height)
    // get SVG string
    // CREATE PNG
    var format: any = format ? format : 'png';

    // turn SVG in to PNG
    var imgsrc: string = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString))); // Convert SVG string to data URL

    // Prepare canvas
    var canvas: any = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    var context: any = canvas.getContext("2d");
    var image: any = new Image();
    image.src = imgsrc;

    console.log('image', image)
    image.onload = function () {
        context.clearRect(0, 0, width, height);
        if (backgroundColor) {
            context.fillStyle = backgroundColor;
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.drawImage(image, 0, 0, width, height);

        canvas.toBlob(function (blob: any) {
            console.log('BLOB', blob)
            // var filesize = Math.round( blob.length/1024 ) + ' KB';
            callback(blob, name)
        });
    };

    // return getBlobFromCanvas(canvas);

    // var dataURL = canvas.toDataURL("image/png");
    // // ?? 
    // return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}

// function generateStyleDefs(svgDomElement)
// {
//     var styleDefs = "";
//     var sheets = document.styleSheets;
//     for (var i = 0; i < sheets.length; i++) {
//       var rules = sheets[i].cssRules;
//       for (var j = 0; j < rules.length; j++) {
//         var rule = rules[j];
//         if (rule.style) {
//           var selectorText = rule.selectorText;
//           var elems = svgDomElement.querySelectorAll(selectorText);
//           console.log('elems', svgDomElement, elems.length)
//           if (elems.length) {
//             styleDefs += selectorText + " { " + rule.style.cssText + " }\n";
//           }
//         }
//       }
//     }

//     var s = document.createElement('style');
//     s.setAttribute('type', 'text/css');
//     s.innerHTML = "<![CDATA[\n" + styleDefs + "\n]]>";
//     //somehow cdata section doesn't always work; you could use this instead:
//     //s.innerHTML = styleDefs;

//     var defs = document.createElement('defs');
//     defs.appendChild(s);
//     svgDomElement.insertBefore(defs, svgDomElement.firstChild);
//   }

// export function getPNGURL(svgId):String
// {
//     var svgString = getSVGString(d3.select('#'+svgId).node());
//     var obj = getPNGFromSVG(svgString, $('#'+svgId).width(), $('#'+svgId).height(), 'png');

//     return obj.image;

// }

// function getPNGFromSVG( svgString, width, height, format):Object 
// {
//     var format = format ? format : 'png';

//     var imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL

//     var canvas = document.createElement("canvas");    
//     canvas.width = width;
//     canvas.height = height;

//     var context = canvas.getContext("2d");

//     var image = new Image();

//     image.src = imgsrc;
//     return {image:image, canvas:canvas};
// }

// returns the svg string from an svg node.
export function getSVGString(svgNode: any) {
    console.log('SVG NODE', svgNode);
    svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
    var cssStyleText = getCSSStyles(svgNode);
    appendCSS(cssStyleText, svgNode);

    var serializer = new XMLSerializer();
    var svgString = serializer.serializeToString(svgNode);
    svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
    svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

    return svgString;

    function getCSSStyles(parentElement: any) {
        var selectorTextArr = [];

        // Add Parent element Id and Classes to the list
        selectorTextArr.push('#' + parentElement.id);
        for (var c = 0; c < parentElement.classList.length; c++)
            if (!contains('.' + parentElement.classList[c], selectorTextArr))
                selectorTextArr.push('.' + parentElement.classList[c]);

        // Add Children element Ids and Classes to the list
        var nodes = parentElement.getElementsByTagName("*");
        for (var i = 0; i < nodes.length; i++) {
            var id = nodes[i].id;
            if (!contains('#' + id, selectorTextArr))
                selectorTextArr.push('#' + id);

            var classes = nodes[i].classList;
            for (var c = 0; c < classes.length; c++)
                if (!contains('.' + classes[c], selectorTextArr))
                    selectorTextArr.push('.' + classes[c]);
        }

        // Extract CSS Rules
        var extractedCSSText = "";
        for (var i = 0; i < document.styleSheets.length; i++) {
            var s = <CSSStyleSheet>document.styleSheets[i];

            try {
                if (!s.cssRules) continue;
            } catch (e) {
                if (e.name !== 'SecurityError') throw e; // for Firefox
                continue;
            }

            var cssRules = s.cssRules;
            for (var r = 0; r < cssRules.length; r++) {
                var rule = <CSSStyleRule>cssRules[r];
                if (contains(rule.selectorText, selectorTextArr))
                    extractedCSSText += rule.cssText;
            }
        }


        return extractedCSSText;

        function contains(str: string, arr: any) {
            return arr.indexOf(str) === -1 ? false : true;
        }

    }

    function appendCSS(cssText: string, element: any) {
        var styleElement = document.createElement("style");
        styleElement.setAttribute("type", "text/css");
        styleElement.innerHTML = cssText;
        var refNode = element.hasChildNodes() ? element.children[0] : null;
        element.insertBefore(styleElement, refNode);
    }
}


export function exportPNG(canvas: any, name: string) {
    var dataURL: any = canvas.toDataURL('image/jpg', 1);
    var blob: any = dataURItoBlob(dataURL);
    // window.open(dataURL);

    var fileNameToSaveAs: any = name + '_' + new Date().toUTCString() + '.png';
    var downloadLink: any = document.createElement("a")
    downloadLink.download = fileNameToSaveAs;
    downloadLink.href = (window as any).webkitURL.createObjectURL(blob);
    downloadLink.click();
}


// returns a blob from a URL/URI
function dataURItoBlob(dataURI: string): Blob {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    console.log('mimeString', mimeString)

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], { type: mimeString });
}


var msgBox;
export function showMessage(message: string, timeout: any) {
    if ($('.messageBox'))
        $('.messageBox').remove();

    msgBox = $('<div id="div" class="messageBox" style="\
            width: 100%;\
            height: 100%;\
            background-color: #ffffff;\
            opacity: .9;\
            position: absolute;\
            top: 0px;\
            left: 0px;"></div>');
    msgBox.append('<div id="div" style="\
            font-size: 20pt;\
            font-weight: bold;\
            font-family: "Helvetica Neue", Helvetica, sans-serif;\
            width: 500px;\
            padding-top: 300px;\
            text-align: center;\
            margin:auto;">\
            <p>' + message + '</p></div>');
    $('body').append(msgBox);
    msgBox.click(function () {
        $('.messageBox').remove();
    })

    if (timeout) {
        // Automatically disappear
        window.setTimeout(function () {
            $('.messageBox').fadeOut(1000);
        }, timeout);
    }
}


//}
