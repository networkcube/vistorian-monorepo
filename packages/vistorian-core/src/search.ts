import { DynamicGraph, Link, Node, Location, IDCompound } from "./dynamicgraph";

export function searchForTerm(
  term: string,
  dgraph: DynamicGraph,
  type?: string
): IDCompound {
  const terms = term.toLowerCase().split(",");

  const result: IDCompound = new IDCompound();

  for (let i = 0; i < terms.length; i++) {
    term = terms[i].trim();
    if (!type || type == "node")
      result.nodeIds = result.nodeIds.concat(
        dgraph
          .nodes()
          .filter(
            (e: Node) =>
              e.label().toLowerCase().indexOf(term) > -1 ||
              e.nodeType().toLowerCase().indexOf(term) > -1
          )
          .ids()
      );
    if (!type || type == "link")
      result.linkIds = result.linkIds.concat(
        dgraph
          .links()
          .filter(
            (e: Link) =>
              e.source.label().toLowerCase().indexOf(term) > -1 ||
              e.target.label().toLowerCase().indexOf(term) > -1 ||
              e.linkType().indexOf(term) > -1
          )
          .ids()
      );
    if (!type || type == "locations")
      result.locationIds = result.locationIds.concat(
        dgraph
          .locations()
          .filter((e: Location) => e.label().toLowerCase().indexOf(term) > -1)
          .ids()
      );
  }
  return result;
}

/// FILTERS

export interface IFilter {
  test(o: any): boolean;
}

class StringContainsFilter {
  pattern: string;
  constructor(pattern: string) {
    this.pattern = pattern;
  }

  test(word: any) {
    console.log("contains:", word, this.pattern);
    return word.indexOf(this.pattern) > -1;
  }
}
