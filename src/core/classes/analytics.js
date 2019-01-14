"use strict";
exports.__esModule = true;
var nt_q = require("./queries");
var networkcube;
(function (networkcube) {
    function findDegree(nodes) {
        var motifs = [];
        var ns;
        var ls;
        var finalLinks;
        var n;
        for (var i = 0; i < nodes.length; i++) {
            n = nodes[i];
            ns = n.neighbors().removeDuplicates().toArray().concat(n);
            ls = n.links().removeDuplicates().toArray();
            motifs.push(new nt_q.networkcube.Motif(ns, ls));
        }
        return motifs;
    }
    networkcube.findDegree = findDegree;
})(networkcube = exports.networkcube || (exports.networkcube = {}));
