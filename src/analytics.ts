import { Link, Node, Time, Motif, MotifTemplate } from './queries'
export function findDegree(nodes: Node[]): Motif[] {
    var motifs: Motif[] = [];
    var ns;
    var ls;
    var finalLinks;
    var n;
    for (var i = 0; i < nodes.length; i++) {
        n = nodes[i];
        ns = n.neighbors().removeDuplicates().toArray().concat(n);
        ls = n.links().removeDuplicates().toArray();
        motifs.push(new Motif(ns, ls))
    }
    return motifs;
}
