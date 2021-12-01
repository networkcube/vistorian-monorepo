import { parsePajek } from "./importers";

const undirectedPajekData = `
*Vertices 4
1 "A"
2 "B"
3 "C"
4 "D"
*Edges
1 2 1
1 3 1
2 3 1
1 4 1
`;

test("can open undirected Pajek graph", () => {
  const result = parsePajek(undirectedPajekData, "testDatast");

  expect(result.name).toBe("testDatast");

  expect(result.nodeSchema).toStrictEqual({ id: 0, label: 1 });
  expect(result.nodeTable).toStrictEqual([
    [0, '"A"'],
    [1, '"B"'],
    [2, '"C"'],
    [3, '"D"'],
  ]);

  expect(result.linkSchema).toStrictEqual({
    id: 0,
    source: 1,
    target: 2,
    directed: 3,
  });
  expect(result.linkTable).toStrictEqual([
    [0, 0, 1, false],
    [1, 0, 2, false],
    [2, 1, 2, false],
    [3, 0, 3, false],
  ]);
});

const directedPajekData = `
*Vertices 4
1 "A"
2 "B"
3 "C"
4 "D"
*Arcs
1 2 1
1 3 1
2 3 1
1 4 1
`;

test("can open directed Pajek graph", () => {
  const result = parsePajek(directedPajekData, "testDatast");

  expect(result.name).toBe("testDatast");

  expect(result.nodeSchema).toStrictEqual({ id: 0, label: 1 });
  expect(result.nodeTable).toStrictEqual([
    [0, '"A"'],
    [1, '"B"'],
    [2, '"C"'],
    [3, '"D"'],
  ]);

  expect(result.linkSchema).toStrictEqual({
    id: 0,
    source: 1,
    target: 2,
    directed: 3,
  });
  expect(result.linkTable).toStrictEqual([
    [0, 0, 1, true],
    [1, 0, 2, true],
    [2, 1, 2, true],
    [3, 0, 3, true],
  ]);
});
