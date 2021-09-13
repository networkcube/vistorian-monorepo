// import swiftSet from 'swiftset';
import { Motif, MotifTemplate } from './queries'
import { DynamicGraph, Link, Node } from './dynamicgraph'
import netClustering from 'netclustering'

export function findTemplate(nodes: Node[],
    template: MotifTemplate,
    config?: Object) {

    var nodeCount = template.nodes.length;
    var linkCount = template.links.length;
    // test every node if it matches one of the nodes in the motif
    var n;
    var links
    var candidateNodes = []
    for (var i = 0; i < nodes.length; i++) {
        links = nodes[i].links().toArray();
        for (var j = 0; j < nodeCount; j++) {
            for (var k = 0; k < linkCount; k++) {
                if (template.links[k][0] == template.nodes[j])

                    for (var l = 0; l < linkCount; l++) {
                    }
            }
        }
    }


}


export function findClusters(nodes: Node[], config?: Object) {
    if (nodes.length == 0)
        return []

    var g: DynamicGraph = nodes[0].g
    var links: any[] = nodes[0].g.links().toArray()
    for (var i = 0; i < links.length; i++) {
        links[i].value = links[i].weights().sum() // VALUE ???
    }
    var clusters = netClustering.cluster(nodes, links);

    var motifs = []
    var clusterArray = []
    // replace ids with nodes

    var clusterLinks: any[] = []
    var cl;
    var s, t
    for (var c = 0; c < clusters.length; c++) {
        clusterLinks = []
        cl = clusters[c]
        // exclude clusters with less than 4 nodes
        if (cl.length < 4)
            continue;

        for (var j = 0; j < cl.length; j++) {
            cl[j] = g.node(parseInt(cl[j]))
        }
        for (var i = 0; i < cl.length; i++) {
            for (var j = i + 1; j < cl.length; j++) {
                clusterLinks = clusterLinks.concat(cl[i].linksBetween(cl[j]).toArray())
            }
        }
        motifs.push({ nodes: cl, links: clusterLinks })
    }

    return motifs;
}

/*
export function findCliques(nodes: Node[], config?: any) {
    var cliques = [];
    // var p=[];
    var p = nodes.slice();
    // for(var i = 0 ; i <nodes.length ; i++){
    //     p.push(nodes[i].id());
    // }
    var r = [];
    var x = [];

    if (!config)
        var config: any = {}

    if (config.links == undefined)
        config.links = nodes[0].g.links().toArray();

    cliques = bronKerboschIterative(nodes, config);

    // create motifs
    var motifs = []
    var cliqueLinks = []
    for (var c = 0; c < cliques.length; c++) {
        // do not consider triangles and dyads as cliques
        if (cliques[c].length < 4)
            continue;

        cliqueLinks = []
        for (var i = 0; i < cliques[c].length; i++) {
            for (var j = i + 1; j < cliques[c].length; j++) {
                cliqueLinks.push(cliques[c][i].linksBetween(cliques[c][j]).get(0))
            }
        }
        motifs.push({ nodes: cliques[c], links: cliqueLinks })
    }

    return motifs;
};
*/

function bronKerbosch(nodes: Node[], r: any[], p: any[], x: any[], cliques: any[], config: Object) {

    if (p.length === 0 && x.length === 0) {
        cliques.push(r);
        return;
    }

    p.forEach(function (v) {
        var tempR = r.splice(0);
        tempR.push(v);
        bronKerbosch(nodes, tempR, p.filter(function (temp) {
            return v.neighbors().contains(temp);
        }), x.filter(function (temp) {
            return v.neighbors().contains(temp);
        }), cliques, config);

        p.splice(p.indexOf(v), 1);
        if (x.indexOf(v) == -1)
            x.push(v);
    });
}

/*
function bronKerboschIterative(nodes: Node[], config: Object): any[] {
    var cliques: any[] = []

    var stack: any[] = [];
    var R: number = 0
    var P: number = 1
    var X: number = 2
    stack.push([[], nodes, []])

    var r: Node[];
    var p: Node[];
    var x: Node[];
    var p2: Node[];
    var x2: Node[];
    var step: any[];
    var newStep: any[];
    var v: Node;
    var count: number = 0;
    while (stack.length > 0) {
        count++;
        step = stack.pop();
        r = [].concat(step[R]);
        p = [].concat(step[P]);
        x = [].concat(step[X]);
        if (p.length == 0
            && x.length == 0) {
            cliques.push(r.slice())
        }
        if (p.length > 0) {
            v = p[0] // 'some vertex in P'

            // P \ v
            p2 = p.slice()
            p2.splice(p2.indexOf(v), 1)

            // X u v                
            x2 = x.slice()
            if (x2.indexOf(v) == -1)
                x2.push(v);

            // R, P\v, X u v                    
            stack.push([r.slice(), p2, x2])

            // R u v
            if (r.indexOf(v) == -1)
                r.push(v)

            newStep = [r]

            p = swiftSet.intersection(p2, v.neighbors().toArray())
            p2 = []
            for (var i = 0; i < p.length; i++) {
                if (p2.indexOf(p[i]) == -1)
                    p2.push(p[i])
            }
            newStep.push(p2)

            x = swiftSet.intersection(x2, v.neighbors().toArray())
            x2 = []
            for (var i = 0; i < x.length; i++) {
                if (x2.indexOf(x[i]) == -1)
                    x2.push(x[i])
            }
            newStep.push(x2)

            stack.push(newStep)
        }
    }


    return cliques;
}
*/

export function findFullEgoNetwork(nodes: Node[], config?: Object): Motif[] {
    var motifs: Motif[] = [];
    var ns;
    var ls;
    var finalLinks;
    var n;
    for (var i = 0; i < nodes.length; i++) {
        n = nodes[i];
        finalLinks = [];
        ns = n.neighbors().removeDuplicates()
        ls = ns.links().removeDuplicates().toArray();
        ns = ns.toArray().concat(n);
        for (var j = 0; j < ls.length; j++) {
            if (ls[j] == undefined)
                continue;
            if (ns.indexOf(ls[j].source) > -1 && ns.indexOf(ls[j].target) > -1) {
                finalLinks.push(ls[j])
            }
        }
        motifs.push(new Motif(ns, finalLinks))
    }
    return motifs;
}

/*
export function findStars(nodes: Node[], config?: any) {
    if (!config)
        var config: any = {}

    if (config.minLinkCount == undefined)
        config.minLinkCount = 5;

    if (config.minNeighborCount == undefined) {
        config.minNeighborCount = 5;
        config.minLinkCount = 5;
    }

    if (config.links == undefined)
        config.links = nodes[0].g.links().toArray();

    var motifs: Motif[] = [];
    var n: Node;
    var lls: Link[]
    var m: Motif;
    var neighbors;
    for (var i = 0; i < nodes.length; i++) {
        n = nodes[i];
        lls = n.links().toArray();
        lls = swiftSet.intersection(lls, config.links);
        if (lls.length <= config.minLinkCount)
            continue

        // count real neighbors
        neighbors = []
        for (var j = 0; j < lls.length; j++) {
            if (neighbors.indexOf(lls[j].other(n)) == -1)
                neighbors.push(lls[j].other(n))
        }
        if (neighbors.length <= config.minNeighborCount)
            continue;

        // create motif
        m = new Motif([n], [])
        for (var j = 0; j < lls.length; j++) {
            m.links.push(lls[j])
            m.nodes.push(lls[j].other(n))
        }
        motifs.push(m);
    }
    return motifs;
}
*/

/*
// returns triangles
export function findTriangles(nodes: Node[], config?: any): Motif[] {

    if (!config)
        var config: any = {}

    if (config.links == undefined)
        config.links = nodes[0].g.links().toArray();



    var motifs: Motif[] = [];
    var g: DynamicGraph = nodes[0].g;

    var l: Link;
    var s: Node, t: Node
    var ns: Node[], nt: Node[];
    var common: Node[]
    var n: Node;
    var ll1: Link[], ll2: Link[];
    var found;
    var m: Motif;
    for (var i = 0; i < config.links.length; i++) {
        s = config.links[i].source;
        ns = s.neighbors().toArray();
        ns = swiftSet.intersection(ns, nodes);
        if (ns.length == 0)
            continue;
        t = config.links[i].target;
        nt = t.neighbors().toArray();
        nt = swiftSet.intersection(nt, nodes);
        if (nt.length == 0)
            continue;
        common = swiftSet.intersection(ns, nt);
        // remove s and t from common neighbors
        common = swiftSet.difference(common, [s, t])
        if (common.length == 0)
            continue;

        // create triangle motifs
        for (var j = 0; j < common.length; j++) {
            n = common[j];
            ll1 = swiftSet.intersection(g.linksBetween(s, n).toArray(), config.links);
            if (ll1.length == 0) continue;
            ll2 = swiftSet.intersection(g.linksBetween(t, n).toArray(), config.links);
            if (ll2.length == 0) continue;

            ll1 = ll1.concat(ll2);
            ll1.push(config.links[i]);
            motifs.push(new Motif(
                [s, t, n],
                ll1
            ))
        }
    }

    return motifs;
}
*/




//}
