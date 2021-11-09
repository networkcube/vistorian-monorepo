import * as d3 from "d3";

import { DataSet, LinkSchema, NodeSchema } from "./dynamicgraphutils";
import { DynamicGraph } from "./dynamicgraph";
import * as moment from "moment";
import * as main from "./main";

export function loadDyson(
  url: string,
  callback: (dataset: DataSet) => void
): void {
  d3.json(url).then((data: any) => {
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
    callback(
      new DataSet({
        nodeTable: nodeTable,
        linkTable: linkTable,
        linkSchema: linkSchema,
        nodeSchema: nodeSchema,
        name: url,
      })
    );
  });
}

/** Loads a .csv file from the indicated url*/
// does not check for locations
export function loadLinkTable(
  url: string,
  callBack: (dataset: DataSet) => void,
  linkSchema: LinkSchema,
  delimiter: string,
  timeFormat?: string
): void {
  if (timeFormat == undefined) timeFormat = "x";

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

  $.get(
    url,
    (linkData) => {
      const array = [];
      const rows = linkData.split("\r\n");
      for (let i = 1; i < rows.length; i++) {
        array.push(rows[i].split(delimiter));
      }
      linkData = array;
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
          linkRow[newLinkSchema.time] = moment
            .utc(linkData[i][linkSchema.time], timeFormat)
            .format(main.timeFormat());
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
    },
    "text"
  );
}

export function loadXML(
  url: string,
  callBack: (dataset: DataSet) => void
): void {
  d3.xml(url).then((data: any) => {
    // "application/xml",
    const nodes = data.documentElement.getElementsByTagName("node");
    const nodeTable = [];
    const nodeIds = [];
    const nodeSchema = { id: 0, label: 1, nodeType: 2 };
    for (let i = 0; i < nodes.length; i++) {
      nodeTable.push([
        nodeTable.length,
        nodes[i].getAttribute("name"),
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
      s = nodeIds.indexOf(links[i].getAttribute("source"));
      t = nodeIds.indexOf(links[i].getAttribute("through"));
      if (sPrev == s && tPrev == t) {
        continue;
      }
      sPrev = s;
      tPrev = t;
      linkTable.push([linkTable.length, s, t]);
    }
    callBack(
      new DataSet({
        name: url.split("=")[0],
        nodeTable: nodeTable,
        linkTable: linkTable,
        nodeSchema: nodeSchema,
        linkSchema: linkSchema,
      })
    );
  });
}

/** Loads a .json file from the indicated url.
 * The json must have a 'nodes/vertices' and a 'links/edge/connections/relations' array.
 */
export function loadJson(
  url: string,
  callBack: (dataset: DataSet) => void,
  dataName?: string
): void {
  d3.json(url).then((data: any) => {
    if (!data) return;

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

    if (dataName == undefined) dataName = url.split("=")[0];
    callBack(
      new DataSet({
        name: dataName,
        nodeTable: nodeTable,
        locationTable: locationTable,
        linkTable: linkTable,
        nodeSchema: nodeSchema,
        locationSchema: locationSchema,
        linkSchema: linkSchema,
      })
    );
  });
}

export function loadJsonList(
  url: string,
  callBack: (dataset: DataSet) => void
): void {
  d3.json(url).then((data: any) => {
    if (!data) return;

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

    callBack(
      new DataSet({
        name: url.split("=")[0],
        nodeTable: nodeTable,
        linkTable: linkTable,
        nodeSchema: nodeSchema,
        linkSchema: linkSchema,
      })
    );
  });
}

export function loadNCube(
  url: string,
  callBack: (dataset: DataSet) => void
): void {
  d3.json(url).then((data: any) => {
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
      linkTable.push([
        data.edges[i].edgeId,
        data.edges[i].sourceNodeId,
        data.edges[i].targetNodeId,
        moment
          .utc()
          .add(data.edges[i].timeIndex, "seconds")
          .format("YYYY-MM-DD hh:mm:ss"),
        data.edges[i].weight,
      ]);
    }

    callBack(
      new DataSet({
        name: url.split("=")[0],
        nodeTable: nodeTable,
        linkTable: linkTable,
        nodeSchema: nodeSchema,
        linkSchema: linkSchema,
      })
    );
  });
}

export function loadPajek(
  url: string,
  callBack: (dataset: DataSet) => void
): void {
  $.get(url, (data) => {
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

    callBack(
      new DataSet({
        name: url.split("=")[0],
        nodeTable: nodeTable,
        linkTable: linkTable,
        nodeSchema: nodeSchema,
        linkSchema: linkSchema,
      })
    );
  });
}

export function loadMat(
  url: string,
  callBack: (dataset: DataSet) => void
): void {
  $.get(url, (data) => {
    const lines = data.split("\n");
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
        if (line[0].indexOf(nodeTable[0][1] > -1)) {
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
    callBack(
      new DataSet({
        name: url.split("=")[0],
        nodeTable: nodeTable,
        linkTable: linkTable,
        nodeSchema: nodeSchema,
        linkSchema: linkSchema,
      })
    );
  });
}

export function loadGEDCOM(
  url: string,
  callBack: (dataset: DataSet) => void
): void {
  const nodeTable: any[] = [];
  const nodeSchema = { id: 0, label: 1, nodeType: 2 };
  const linkTable: any[] = [];
  const linkSchema = { id: 0, source: 1, target: 2 };

  $.get(url, (data) => {
    data = data.split("\n");
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

    callBack(
      new DataSet({
        name: url.split("=")[0],
        nodeTable: nodeTable,
        linkTable: linkTable,
        nodeSchema: nodeSchema,
        linkSchema: linkSchema,
      })
    );
  });
}

export function loadLinkList(
  url: string,
  callBack: (dataset: DataSet) => void
): void {
  $.get(url, (data) => {
    const lines = data.split("\n");
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

    callBack(
      new DataSet({
        name: url.split("=")[0],
        nodeTable: nodeTable,
        linkTable: linkTable,
        nodeSchema: nodeSchema,
        linkSchema: linkSchema,
      })
    );
  });
}

export function loadMatrix(
  url: string,
  callBack: (dataset: DataSet) => void
): void {
  $.get(url, (data) => {
    const lines = data.split("\n");
    const nodeTable = [];
    const nodeSchema = { id: 0, label: 1 };
    const linkTable = [];
    const linkSchema = { id: 0, source: 1, target: 2 };

    const nodeNames = [];
    let label;
    // get nodes from rows
    let line = lines[0].trim().split(",");
    for (let i = 0; i < line.length; i++) {
      label = line[i].trim();
      nodeTable.push([nodeTable.length, label]);
      nodeNames.push(label);
    }
    let t;
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
        if (
          line[j].length > 0 &&
          parseInt(line[j].replace(/\s/g, "")) > 300000
        ) {
          linkTable.push([linkTable.length, t, j - 1]);
        }
      }
    }
    console.log("---->nodes found:", nodeTable.length);
    console.log("---->links found:", linkTable.length);
    callBack(
      new DataSet({
        name: url.split("=")[0],
        nodeTable: nodeTable,
        linkTable: linkTable,
        nodeSchema: nodeSchema,
        linkSchema: linkSchema,
      })
    );
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
