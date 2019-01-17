
// Return items common to both sets. 
// Set.intersection([1, 1, 2], [2, 2, 3]) => [2]

export function intersection(a: any, b: any) {
    return a.filter((x: any) => b.includes(x));
};

// Symmetric difference. Items from either set that
// are not in both sets.
// Set.difference([1, 1, 2], [2, 3, 3]) => [1, 3]
export function difference(a: any, b: any) {
    return a.filter((x: any) => !b.includes(x)).concat(b.filter((x: any) => !a.includes(x)));
};