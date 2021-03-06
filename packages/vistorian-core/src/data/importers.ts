import * as d3 from "d3";

import { DataSet, LinkSchema, NodeSchema } from "./dynamicgraphutils";
import { DynamicGraph } from "./dynamicgraph";
import * as main from "./main";
import { addDate, formatStandardTime } from "./dates";

export function loadFromURL(
  format: string,
  url: string,
  callback: (dataset: DataSet) => void,
  name?: string
) {
  name = name ? name : url.split("=")[0];
  const datasetName: string = name ? name : "UNNAMED";

  const textFormats: Map<string, (url: string, data: any) => DataSet> = new Map(
    [
      ["pajek", parsePajek],
      ["mat", parseMat],
      ["gedcom", parseGEDCOM],
      ["linkList", parseLinkList],
      ["matrix", parseMatrix],
    ]
  );

  if (textFormats.has(format)) {
    d3.text(url).then((data: any) => {
      const parser = jsonFormats.get(format);
      parser && callback(parser(datasetName, data));
    });
  }

  const jsonFormats: Map<string, (url: string, data: any) => DataSet> = new Map(
    [
      ["dyson", parseDyson],
      ["json", parseJSON],
      ["jsonList", parseJSONList],
      ["NCube", parseNCube],
    ]
  );

  if (jsonFormats.has(format)) {
    d3.json(url).then((data: any) => {
      if (!data) {
        return;
      }

      const parser = jsonFormats.get(format);
      parser && callback(parser(datasetName, data));
    });
  }

  if (format === "XML") {
    d3.xml(url).then((data: any) => {
      if (!data) {
        return;
      }

      const parser = parseXML;
      parser && callback(parser(datasetName, data));
    });
  }
}

export function parseDyson(name: string, data: any): DataSet {
  // create node table
  const nodeTable = [];
  const nodeSchema = { id: 0, label: 1 };
  const nodes = data.nodes;
  for (let i = 0; i < nodes.length; i++) {
    nodeTable.push([i, nodes[i].name]);
  }
  const linkTable = [];
  const linkSchema = { id: 0, source: 1, target: 2, weight: 3, time: 4 };
  const times = data.times;
  let m;
  for (let i = 0; i < times.length; i++) {
    m = times[i].matrix;
    for (let s = 0; s < m.length; s++) {
      for (let t = 0; t < m.length; t++) {
        linkTable.push([s * m.length + t, s, t, m[s][t], i]);
      }
    }
  }
  return new DataSet({
    nodeTable: nodeTable,
    linkTable: linkTable,
    linkSchema: linkSchema,
    nodeSchema: nodeSchema,
    name: name,
  });
}

/** Loads a .csv file from the indicated url*/
export function loadLinkTable(
  url: string,
  callBack: (dataset: DataSet) => void,
  linkSchema: LinkSchema,
  delimiter: string,
  timeFormat?: string
): void {
  if (timeFormat == undefined) timeFormat = "%Q";

  // Check if linkSchema is well defined:
  if (linkSchema.source == undefined) {
    console.error(
      "[n3] Link Schema does not have -source- attribute. Import aborted."
    );
    return;
  }
  if (linkSchema.target == undefined) {
    console.error(
      "[n3] Link Schema does not have -target- attribute. Import aborted."
    );
    return;
  }

  fetch(url)
    .then((response) => response.text())
    .then((text) => {
      const array = [];
      const rows = text.split("\r\n");
      for (let i = 1; i < rows.length; i++) {
        array.push(rows[i].split(delimiter));
      }
      const linkData = array;
      // get references to tables
      const nodeTable: any[] = [];

      // var nodeIds: number[] = [];
      const names: string[] = [];

      const nodeSchema: NodeSchema = new NodeSchema(0);
      nodeSchema.label = 1;
      let id_source: number;
      let id_target: number;
      let name: string;

      const linkTable: any[] = [];
      const newLinkSchema: LinkSchema = new LinkSchema(0, 1, 2);
      // fill new link schema
      let colCount = 3;
      for (const prop in linkSchema) {
        if (prop != "source" && prop != "target")
          (newLinkSchema as any)[prop] = colCount++;
      }

      // Create node table
      // skip first row, as 1st row contains header information
      linkData.shift();

      let linkRow;
      const parseTime = d3.timeParse(timeFormat || "%Q");
      const formatTime = d3.timeFormat(main.timeFormat());

      for (let i = 0; i < linkData.length; i++) {
        if (linkData[i].length == 0 || linkData[i][0].length == 0) {
          continue;
        }
        linkRow = new Array(colCount);
        if (linkSchema.id == undefined) linkRow[0] = linkTable.length;
        else linkRow[0] = linkData[i][linkSchema.id];

        // remove whitespace in table entries

        for (let j = 0; j < linkData[i].length; j++) {
          linkData[i][j] = linkData[i][j].trim();
        }

        // sources
        name = linkData[i][linkSchema.source];
        if (names.indexOf(name) == -1) {
          names.push(name);
        }
        id_source = names.indexOf(name);

        // targets
        name = linkData[i][linkSchema.target];
        if (names.indexOf(name) == -1) {
          names.push(name);
        }
        id_target = names.indexOf(name);

        // replace node names by node indices
        linkRow[newLinkSchema.source] = id_source;
        linkRow[newLinkSchema.target] = id_target;

        // format weight
        if (linkSchema.weight != undefined) {
          linkRow[newLinkSchema.weight] = Number(
            linkData[i][linkSchema.weight]
          );
        }
        // format time
        if (linkSchema.time != undefined) {
          const timeString = linkData[i][linkSchema.time];
          const parsedTime = parseTime(timeString);
          linkRow[newLinkSchema.time] = parsedTime
            ? formatTime(parsedTime)
            : undefined;
        }
        // copy remaining attributes (linkType, weight, etc..)
        for (const prop in linkSchema) {
          if (
            prop != "source" &&
            prop != "target" &&
            prop != "time" &&
            prop != "weight"
          ) {
            linkRow[(newLinkSchema as any)[prop]] =
              linkData[i][(linkSchema as any)[prop]];
          }
        }
        linkTable.push(linkRow);
      }

      // create node table from node name list
      for (let i = 0; i < names.length; i++) {
        nodeTable.push([i, names[i]]);
      }

      const dataSet = new DataSet({
        nodeTable: nodeTable,
        linkTable: linkTable,
        linkSchema: newLinkSchema,
        nodeSchema: nodeSchema,
        name: url,
      });
      if (linkSchema.time != undefined) {
        dataSet.timeFormat = main.timeFormat();
      }

      callBack(dataSet);
    });
}

export function parseXML(name: string, dataString: string): DataSet {
  const parser = new DOMParser();
  const data = parser.parseFromString(dataString, "text/xml");

  const nodes = data.documentElement.getElementsByTagName("node");
  const nodeTable = [];
  const nodeIds = [];
  const nodeSchema = { id: 0, label: 1, nodeType: 2 };
  for (let i = 0; i < nodes.length; i++) {
    nodeTable.push([
      nodeTable.length,
      nodes[i].getAttribute("name") || nodes[i].getAttribute("id"),
      nodes[i].getAttribute("type"),
    ]);
    nodeIds.push(nodes[i].id);
  }
  const linkTable = [];
  const linkSchema = new LinkSchema(0, 1, 2);
  const links = data.documentElement.getElementsByTagName("edge");
  let s, t;
  let sPrev, tPrev;
  for (let i = 0; i < links.length; i++) {
    s = nodeIds.indexOf(links[i].getAttribute("source") || "");
    t = nodeIds.indexOf(links[i].getAttribute("target") || "");
    if (sPrev == s && tPrev == t) {
      continue;
    }
    sPrev = s;
    tPrev = t;
    linkTable.push([linkTable.length, s, t]);
  }
  return new DataSet({
    name: name,
    nodeTable: nodeTable,
    linkTable: linkTable,
    nodeSchema: nodeSchema,
    linkSchema: linkSchema,
  });
}

export function parseJSON(name: string, data: any): DataSet {
  // The json must have a 'nodes/vertices' and a 'links/edge/connections/relations' array.

  // fill edge table
  let links = data.links;
  if (!links) links = data.edges;
  if (!links) links = data.connections;
  if (!links) links = data.relations;

  const linkTable = [];
  let line: any[] = [];
  let link;
  const linkSchema = { id: 0, source: 1, target: 2, weight: 3 };
  let weight;
  const linkUserProps = [];
  let prop;

  // check for user-properties to complete schema
  for (let i = 0; i < links.length; i++) {
    link = links[i];
    for (prop in link) {
      if (
        Object.prototype.hasOwnProperty.call(link, prop) &&
        prop != "id" &&
        prop != "linkType" &&
        prop != "time" &&
        prop != "name" &&
        prop != "source" &&
        prop != "target" &&
        prop != "weight" &&
        prop != "directed"
      ) {
        if ((linkSchema as any)[prop] == undefined) {
          linkUserProps.push(prop);
          (linkSchema as any)[prop] = 3 + linkUserProps.length;
        }
      }
    }
  }
  // collect data from links
  for (let i = 0; i < links.length; i++) {
    link = links[i];
    weight = 1;
    if (link.weight != undefined) weight = link.weight;

    line = [i, link.source, link.target, weight];
    for (let p = 0; p < linkUserProps.length; p++) {
      prop = linkUserProps[p];
      if (link[prop] == undefined) {
        line.push(undefined);
      } else {
        line.push(link[prop]);
      }
    }
    linkTable.push(line);
  }

  // fill node table
  let nodes = data.nodes;
  if (!nodes) nodes = data.vertices;

  let node;
  const nodeTable = [];
  const locationTable: any[] = []; // location table in case there are locations
  const locationSchema = { id: 0, longitude: 1, latitude: 2 }; // location table in case there are locations
  const nodeSchema = { id: 0, label: 1 };
  const nodeUserProperties = [];
  for (let i = 0; i < nodes.length; i++) {
    node = nodes[i];
    for (prop in node) {
      if (
        Object.prototype.hasOwnProperty.call(node, prop) &&
        prop != "id" &&
        prop != "label" &&
        prop != "time" &&
        prop != "name" &&
        prop != "nodeType" &&
        prop != "location" &&
        prop != "constructor"
      ) {
        if ((nodeSchema as any)[prop] == undefined) {
          nodeUserProperties.push(prop);
          (nodeSchema as any)[prop] = 1 + nodeUserProperties.length;
        }
      }
    }
  }
  for (let i = 0; i < nodes.length; i++) {
    node = nodes[i];
    line = [i];
    if (node.name) {
      line.push(node.name);
    } else if (node.label) {
      line.push(node.label);
    } else {
      line.push("" + i);
    }
    // if(node.group){
    //     line.push(node.group)
    // }else{
    //     line.push('0')
    // }

    // check for user-properties
    for (let p = 0; p < nodeUserProperties.length; p++) {
      prop = nodeUserProperties[p];
      if (node[prop] == undefined) {
        line.push(undefined);
      } else {
        line.push(node[prop]);
      }
    }
    nodeTable.push(line);
  }

  return new DataSet({
    name: name,
    nodeTable: nodeTable,
    locationTable: locationTable,
    linkTable: linkTable,
    nodeSchema: nodeSchema,
    locationSchema: locationSchema,
    linkSchema: linkSchema,
  });
}

export function parseJSONList(name: string, data: any): DataSet {
  // fill node and link table
  const linkTable = [];
  let line = [];
  const linkSchema = new LinkSchema(0, 1, 2);
  const nodes = data;
  let node;
  const nodeTable = [];
  const nodeSchema = new NodeSchema(0);
  const nodeNames = [];
  for (let i = 0; i < nodes.length; i++) {
    node = nodes[i];
    line = [i];
    if (node.name) {
      line.push(node.name);
      nodeSchema.label = 1;
    }
    if (node.label) {
      line.push(node.name);
      nodeSchema.label = 1;
    }
    nodeNames.push(node.name);
    nodeTable.push(line);
  }
  // links
  let s, t;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = 0; j < nodes[i].imports.length; j++) {
      s = nodeNames.indexOf(nodes[i].name);
      t = nodeNames.indexOf(nodes[i].imports[j]);
      if (s == -1 || t == -1) console.error("---");
      else linkTable.push([linkTable.length, s, t]);
    }
  }

  return new DataSet({
    name: name,
    nodeTable: nodeTable,
    linkTable: linkTable,
    nodeSchema: nodeSchema,
    linkSchema: linkSchema,
  });
}

export function parseNCube(name: string, data: any): DataSet {
  const nodeTable: any[][] = [];
  const linkTable: any[][] = [];

  const nodeSchema: NodeSchema = new NodeSchema(0);
  nodeSchema.id = 0;
  nodeSchema.label = 1;
  nodeSchema.nodeType = 2;

  // create node table:
  for (let i = 0; i < data.nodes.length; i++) {
    console.log(
      "data.nodes[i].name.substring(0,3)",
      data.nodes[i].name.substring(0, 3)
    );
    nodeTable.push([
      data.nodes[i].nodeId,
      data.nodes[i].name,
      data.nodes[i].name.substring(0, 3), // create node type for brain regions
    ]);
  }

  const linkSchema: LinkSchema = new LinkSchema(0, 1, 2);
  linkSchema.id = 0;
  linkSchema.source = 1;
  linkSchema.target = 2;
  linkSchema.time = 3;
  linkSchema.weight = 4;

  // create link table
  // data.edges = data.edges.slice(0,20000);
  for (let i = 0; i < data.edges.length; i++) {
    const d = addDate(new Date(), data.edges[i].timeIndex, "second");

    linkTable.push([
      data.edges[i].edgeId,
      data.edges[i].sourceNodeId,
      data.edges[i].targetNodeId,
      formatStandardTime(d),
      data.edges[i].weight,
    ]);
  }

  return new DataSet({
    name: name,
    nodeTable: nodeTable,
    linkTable: linkTable,
    nodeSchema: nodeSchema,
    linkSchema: linkSchema,
  });
}

export function parsePajek(name: string, data: any): DataSet {
  const lines = data.split("\n");
  const nodeTable = [];
  const nodeSchema = { id: 0, label: 1 };
  const linkTable = [];
  const linkSchema = { id: 0, source: 1, target: 2, directed: 3 };
  let parseType = "";
  let line;
  for (let i = 0; i < lines.length; i++) {
    line = lines[i];

    // define data type
    if (line.indexOf("*Vertices") > -1) {
      parseType = "nodes";
      continue;
    } else if (line.indexOf("*Arcs") > -1) {
      parseType = "undirectedLinks";
      continue;
    } else if (line.indexOf("*Edges") > -1) {
      parseType = "directedLinks";
      continue;
    }

    // prepare and clean line
    line = line.trim();
    line = line.split(" ");
    for (let j = 0; j < line.length; j) {
      if (line[j].length == 0) {
        line.splice(j, 1);
      } else {
        j++;
      }
    }
    if (line.length == 0) continue;

    // parse data
    if (parseType.indexOf("nodes") > -1) {
      nodeTable.push([nodeTable.length, line[1]]);
    } else if (parseType.indexOf("undirectedLinks") > -1) {
      linkTable.push([
        linkTable.length,
        parseInt(line[0]) - 1,
        parseInt(line[1]) - 1,
        false,
      ]);
    } else if (parseType.indexOf("directedLinks") > -1) {
      linkTable.push([
        linkTable.length,
        parseInt(line[0]) - 1,
        parseInt(line[1]) - 1,
        true,
      ]);
    }
  }

  return new DataSet({
    name: name,
    nodeTable: nodeTable,
    linkTable: linkTable,
    nodeSchema: nodeSchema,
    linkSchema: linkSchema,
  });
}

export function parseMat(name: string, text: string): DataSet {
  const lines = text.split("\n");
  const nodeTable = [];
  const nodeSchema = { id: 0, label: 1 };
  const linkTable = [];
  const linkSchema = { id: 0, source: 1, target: 2 };
  let parseType = "";
  let line;
  let rowCount = 0;
  let currRow = 0;
  for (let i = 0; i < lines.length; i++) {
    line = lines[i];

    // define data type
    if (line.indexOf("ROW LABELS") > -1) {
      parseType = "rows";
      continue;
    } else if (line.indexOf("COLUMN LABELS") > -1) {
      parseType = "cols";
      continue;
    } else if (line.indexOf("DATA:") > -1) {
      parseType = "links";
      continue;
    }
    if (parseType.length == 0) continue;

    line = line.trim();
    line = line.split(" ");
    if (parseType.indexOf("rows") > -1) {
      nodeTable.push([nodeTable.length, line[0]]);
      rowCount++;
    } else if (parseType.indexOf("cols") > -1) {
      if (line[0].includes(nodeTable[0][1].toString())) {
        parseType = "";
        rowCount = 0;
        continue;
      }
      nodeTable.push([nodeTable.length, line[0]]);
    } else if (parseType.indexOf("links") > -1) {
      for (let j = 0; j < line.length; j++) {
        if (parseInt(line[j]) == 1) {
          linkTable.push([linkTable.length, currRow, rowCount + 1]);
        }
      }
      currRow++;
    }
  }
  return new DataSet({
    name: name,
    nodeTable: nodeTable,
    linkTable: linkTable,
    nodeSchema: nodeSchema,
    linkSchema: linkSchema,
  });
}

export function parseGEDCOM(name: string, text: string) {
  const nodeTable: any[] = [];
  const nodeSchema = { id: 0, label: 1, nodeType: 2 };
  const linkTable: any[] = [];
  const linkSchema = { id: 0, source: 1, target: 2 };

  const data = text.split("\n");
  let singleLine: any;
  let line: any[];
  const personIds = [];
  const personSex = [];
  const familiyIds: any[] = [];
  const familiyChildren: any[][] = [];
  const familiyHusband: any[] = [];
  const familiyWife: any[] = [];
  for (let i = 0; i < data.length; i++) {
    singleLine = data[i].replace(/@/g, "");
    line = singleLine.split(" ");
    // parsing persons
    if (line.length < 3) continue;

    if (parseInt(line[0]) == 0 && line[2].indexOf("INDI") > -1) {
      personIds.push(line[1].trim());
      personSex.push("");
    } else if (parseInt(line[0]) == 1 && line[1].indexOf("SEX") > -1) {
      personSex[personSex.length - 1] = line[2].trim();
    } else if (parseInt(line[0]) == 0 && line[2].indexOf("FAM") > -1) {
      familiyIds.push(line[1].trim());
      familiyChildren.push([]);
      familiyHusband.push(undefined);
      familiyWife.push(undefined);
    } else if (parseInt(line[0]) == 1 && line[1].indexOf("CHIL") > -1) {
      familiyChildren[familiyChildren.length - 1].push(line[2].trim());
    } else if (parseInt(line[0]) == 1 && line[1].indexOf("HUSB") > -1) {
      familiyHusband[familiyChildren.length - 1] = line[2].trim();
    } else if (parseInt(line[0]) == 1 && line[1].indexOf("WIFE") > -1) {
      familiyWife[familiyChildren.length - 1] = line[2].trim();
    }
  }

  for (let fi = 0; fi < personIds.length; fi++) {
    nodeTable.push([fi, personIds[fi], personSex[fi]]);
  }

  let hi, wi, ci;
  for (let fi = 0; fi < familiyIds.length; fi++) {
    hi = personIds.indexOf(familiyHusband[fi]);
    wi = personIds.indexOf(familiyWife[fi]);
    console.log("-->", hi, wi, familiyHusband[fi], familiyWife[fi]);
    for (let i = 0; i < familiyChildren[fi].length; i++) {
      ci = personIds.indexOf(familiyChildren[fi][i]);
      if (ci == undefined || ci == -1) continue;
      if (hi != undefined && hi > -1)
        linkTable.push([linkTable.length, hi, ci]);
      if (wi != undefined && wi > -1)
        linkTable.push([linkTable.length, wi, ci]);
    }
  }

  return new DataSet({
    name: name,
    nodeTable: nodeTable,
    linkTable: linkTable,
    nodeSchema: nodeSchema,
    linkSchema: linkSchema,
  });
}

export function parseLinkList(name: string, text: string) {
  const lines = text.split("\n");
  const nodeTable = [];
  const nodeSchema = { id: 0, label: 1 };
  const linkTable = [];
  const linkSchema = { id: 0, source: 1, target: 2, weight: 3 };
  let line;
  let s, t;
  let i = 0;
  for (i; i < lines.length; i++) {
    line = lines[i];
    if (line.indexOf("#") == -1) {
      break;
    }
  }
  let DEL = " ";
  if (lines[i].indexOf(",") > -1) DEL = ",";
  else if (lines[i].indexOf("\t") > -1) DEL = "\t";

  const nodeLabels = [];
  let weight;
  for (i; i < lines.length; i++) {
    line = lines[i];
    line = line.split(DEL);
    for (let j = 0; j < line.length; j) {
      if (line[j].length == 0) {
        line.splice(j, 1);
      } else {
        j++;
      }
    }
    if (line.length < 2) continue;

    s = line[0].toLowerCase();
    if (s == undefined || s == "") continue;

    let si = nodeLabels.indexOf(s);
    if (si == -1) {
      si = nodeLabels.length;
      nodeLabels.push(s);
    }

    t = line[1].toLowerCase();
    if (t == undefined) continue;
    t = t.trim();
    let ti = nodeLabels.indexOf(t);
    if (ti == -1) {
      ti = nodeLabels.length;
      nodeLabels.push(t);
    }

    weight = 1;
    linkTable.push([linkTable.length, si, ti, weight]);
  }
  for (i = 0; i <= nodeLabels.length; i++) {
    nodeTable.push([i, nodeLabels[i] + ""]);
  }

  return new DataSet({
    name: name,
    nodeTable: nodeTable,
    linkTable: linkTable,
    nodeSchema: nodeSchema,
    linkSchema: linkSchema,
  });
}

export function parseMatrix(name: string, text: string) {
  const lines = text.split("\n");
  const nodeTable = [];
  const nodeSchema = { id: 0, label: 1 };
  const linkTable = [];
  const linkSchema = { id: 0, source: 1, target: 2 };

  const nodeNames = [];
  let label;
  // get nodes from rows
  const initialCol = lines[0].trim().split(",");
  for (let i = 0; i < initialCol.length; i++) {
    label = initialCol[i].trim();
    nodeTable.push([nodeTable.length, label]);
    nodeNames.push(label);
  }
  let t, line;
  for (let i = 1; i < lines.length; i++) {
    line = lines[i];
    line = line.trim();
    line = line.split(",");
    t = nodeNames.indexOf(line[0].trim());
    if (t == -1) {
      console.error("Node", line[0], "not defined");
      continue;
    }
    for (let j = 1; j < line.length; j++) {
      if (line[j].length > 0 && parseInt(line[j].replace(/\s/g, "")) > 300000) {
        linkTable.push([linkTable.length, t, j - 1]);
      }
    }
  }
  console.log("---->nodes found:", nodeTable.length);
  console.log("---->links found:", linkTable.length);
  return new DataSet({
    name: name,
    nodeTable: nodeTable,
    linkTable: linkTable,
    nodeSchema: nodeSchema,
    linkSchema: linkSchema,
  });
}

/// EXPORTERS

/** Returns a csv table representation of this graph. It should be the same as
 * the input table format (fix!)
 * Currently: returns simple list of node index pairs.
 */
export function exportCSV(graph: DynamicGraph): string {
  let csv = "";
  const DEL = ",";
  const ST = "";
  const BR = "\n";
  for (let i = 0; i < graph.links().length; i++) {
    const graph_link = graph.link(i);
    if (graph_link != undefined) {
      csv +=
        ST +
        graph_link.source.id() +
        ST +
        DEL +
        ST +
        graph_link.target.id() +
        ST +
        BR;
    }
  }
  return csv;
}

/// HELPER FUNCTIONS

/** Downloads a string as file.*/
export function downloadText(text: string, filename: string): void {
  const textFileAsBlob = new Blob([text], { type: "text/text" });
  const fileNameToSaveAs = filename;
  const downloadLink = document.createElement("a");
  downloadLink.download = fileNameToSaveAs;
  downloadLink.href = (window as any).webkitURL.createObjectURL(textFileAsBlob);
  downloadLink.click();
}
