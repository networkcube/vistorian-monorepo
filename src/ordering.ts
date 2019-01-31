import { Node, Link, Time, DynamicGraph } from './dynamicgraph'
//import { distance_manhattan } from './lib/science'
import * as reorder from 'reorder.js'

//namespace networkcube{

/**
* Calculates an ordering for the passed graph and time span
* @param  {DynamicGraph} dgraph [description]
* @param  {Time}         start  [description]
* @param  {Time}         end    [description]
* @return {[type]}              [description]
*/
export function orderNodes(graph: DynamicGraph, config?: OrderingConfiguration): number[] {
    var max: number = 0;
    var similarityMatrix: number[][] = [];
    var order: number[] = graph.nodes().ids();
    var distance: any;
    var nodes: Node[];
    var links: Link[];
    var start: Time;
    var end: Time;

    if (config != undefined) {
        distance = config.distance ? config.distance : distance.manhattan;
        nodes = config.nodes ? config.nodes : graph.nodes().toArray();
        links = config.links ? config.links : graph.links().toArray();
        start = config.start ? config.start : graph.startTime;
        end = config.end ? config.end : graph.endTime;
    }
    else {
        distance = distance.manhattan;
        nodes = graph.nodes().toArray();
        links = graph.links().toArray();
        start = graph.startTime;
        end = graph.endTime;
    }

    // console.log('-> yeah! Reorder!')
    // init similarity matrix with all 0.
    var arr: number[];
    for (var i = 0; i < nodes.length; i++) {
        arr = []
        similarityMatrix.push(arr);
        for (var j = 0; j < nodes.length; j++) {
            similarityMatrix[i].push(0);
        }
    }
    // fill matrix
    var weight = 0;
    var l: Link;
    var s: number;
    var t: number;
    // console.log('order with', links.length, 'links and ', nodes.length,  'nodes');
    for (var i = 0; i < links.length; i++) {
        weight = 0;
        // check if nodes are in allowed nodes
        s = nodes.indexOf(links[i].source)
        t = nodes.indexOf(links[i].target)
        if (s == -1 || t == -1)
            continue;

        // get weight in allowed time span                 
        weight += links[i].weights(start, end).mean();
        if (weight) {
            similarityMatrix[s][t] = weight;
            similarityMatrix[t][s] = weight;
        } else {
            console.log('weight', weight);
        }
    }

    // console.log('similarityMatrix', similarityMatrix)
    // Reorder
    var leafOrder = reorder
        .optimal_leaf_order()
        .distance(distance)
        .reorder(similarityMatrix);

    // console.log(leafOrder);
    leafOrder.forEach(function (lo: any, i: number) {
        order[nodes[lo].id()] = i;
    });

    return order;
}



export class OrderingConfiguration {
    // HOW TO INIT?
    start: Time;
    end: Time;
    nodes: Node[] = [];
    links: Link[] = [];
    algorithm: string[] = [];
    distance: string[] = [];

    constructor(start: Time, end: Time) {
        this.start = start,
            this.end = end
    }
}
//}
