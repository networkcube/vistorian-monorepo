import { Node } from "./dynamicgraph";
import { Motif } from "./motifs";

export function findDegree(nodes: Node[]): Motif[] {
  const motifs: Motif[] = [];
  for (const n of nodes) {
    const ns = n.neighbors().removeDuplicates().toArray().concat(n);
    const ls = n.links().removeDuplicates().toArray();
    motifs.push(new Motif(ns, ls));
  }
  return motifs;
}
