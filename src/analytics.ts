<<<<<<< HEAD
import { Motif, Node } from "./queries";
=======
import { Motif } from "./queries";
import { Node } from './dynamicgraph';
>>>>>>> ee2731e2adc7617f0c0d750fb7dff1642c35c5d7
export function findDegree(nodes: Node[]): Motif[] {
    const motifs: Motif[] = [];
    for (const n of nodes) {
        const ns = n.neighbors().removeDuplicates().toArray().concat(n);
        const ls = n.links().removeDuplicates().toArray();
        motifs.push(new Motif(ns, ls));
    }
    return motifs;
}
