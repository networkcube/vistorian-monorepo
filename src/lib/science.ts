export function distance_manhattan(a: any, b: any): number {
    var n: number = a.length;
    var i: number = -1;
    var s: number = 0;
    while (++i < n) {
        s += Math.abs(a[i] - b[i]);
    }
    return s;
}