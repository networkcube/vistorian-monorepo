import * as nt_q from "./queries"

export namespace networkcube {

    export function findDegree(nodes: nt_q.networkcube.Node[]): nt_q.networkcube.Motif[] {
        var motifs: nt_q.networkcube.Motif[] = [];
        var ns;
        var ls;
        var finalLinks;
        var n;
        for (var i = 0; i < nodes.length; i++) {
            n = nodes[i];
            ns = n.neighbors().removeDuplicates().toArray().concat(n);
            ls = n.links().removeDuplicates().toArray();
            motifs.push(new nt_q.networkcube.Motif(ns, ls))
        }
        return motifs;
    }

}