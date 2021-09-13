import {
    Node,
    Link,
    Time,
} from './dynamicgraph'

////////////////
//// MOTIFS ////
////////////////

export class Motif {
    nodes: Node[] = []
    links: Link[] = []
    times: Time[] = []

    constructor(nodes: Node[], links: Link[]) {
        this.nodes = nodes.slice(0)
        this.links = links.slice(0);
    }

    print() {
        console.log('nodes:', this.nodes.length, 'links:', this.links.length)
    }
}

export class MotifTemplate {
    nodes: number[] = []
    links: number[][] = []

    constructor(nodes: number[], links: number[][]) {
        this.nodes = nodes.slice(0)
        this.links = links.slice(0);
    }
}

export class MotifSequence {
    motifs: Motif[] = [];
    push(m: Motif) {
        this.motifs.push(m);
    }
}
//}