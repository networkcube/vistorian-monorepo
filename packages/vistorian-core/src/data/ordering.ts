import { Node, Link, Time, DynamicGraph } from "./dynamicgraph";
import * as reorder from "reorder.js";

/**
 * Calculates an ordering for the passed graph and time span
 * @param  {DynamicGraph} graph [description]
 * @param  {OrderingConfiguration} config  [description]
 */
export function orderNodes(
  graph: DynamicGraph,
  config?: OrderingConfiguration
): number[] {
  const similarityMatrix: number[][] = [];
  const order: number[] = graph.nodes().ids();
  let distance: any;
  let nodes: Node[];
  let links: Link[];
  let start: Time;
  let end: Time;

  if (config != undefined) {
    distance = config.distance ? config.distance : distance.manhattan;
    nodes = config.nodes ? config.nodes : graph.nodes().toArray();
    links = config.links ? config.links : graph.links().toArray();
    start = config.start ? config.start : graph.startTime;
    end = config.end ? config.end : graph.endTime;
  } else {
    distance = distance.manhattan;
    nodes = graph.nodes().toArray();
    links = graph.links().toArray();
    start = graph.startTime;
    end = graph.endTime;
  }

  // init similarity matrix with all 0.
  let arr: number[];
  for (let i = 0; i < nodes.length; i++) {
    arr = [];
    similarityMatrix.push(arr);
    for (let j = 0; j < nodes.length; j++) {
      similarityMatrix[i].push(0);
    }
  }
  // fill matrix
  let weight = 0;
  let s: number;
  let t: number;
  for (let i = 0; i < links.length; i++) {
    weight = 0;
    // check if nodes are in allowed nodes
    s = nodes.indexOf(links[i].source);
    t = nodes.indexOf(links[i].target);
    if (s == -1 || t == -1) continue;

    // get weight in allowed time span
    weight += links[i].weights(start, end).mean();
    if (weight) {
      similarityMatrix[s][t] = weight;
      similarityMatrix[t][s] = weight;
    } else {
      console.log("weight", weight);
    }
  }

  // Reorder
  const leafOrder = reorder
    .optimal_leaf_order()
    //.distance(distance)
    .reorder(similarityMatrix);

  leafOrder.forEach(function (lo: any, i: number) {
    order[nodes[lo].id()] = i;
  });

  return order;
}

export class OrderingConfiguration {
  start: Time;
  end: Time;
  nodes: Node[] = [];
  links: Link[] = [];
  algorithm: string[] = [];
  distance: string[] = [];

  constructor(start: Time, end: Time) {
    this.start = start;
    this.end = end;
  }
}
