/// <reference path='./dynamicgraph.ts' />
var networkcube;
(function (networkcube) {
    function searchForTerm(term, dgraph, type) {
        var terms = term.toLowerCase().split(',');
        var result = new IDCompound();
        for (var i = 0; i < terms.length; i++) {
            term = terms[i].trim();
            console.log('search term', term);
            if (!type || type == 'node')
                result.nodeIds = result.nodeIds.concat(dgraph.nodes().filter(function (e) {
                    return e.label().toLowerCase().indexOf(term) > -1
                        || e.nodeType().toLowerCase().indexOf(term) > -1;
                }).ids());
            if (!type || type == 'link')
                result.linkIds = result.linkIds.concat(dgraph.links().filter(function (e) {
                    return e.source.label().toLowerCase().indexOf(term) > -1
                        || e.target.label().toLowerCase().indexOf(term) > -1
                        || e.linkType().indexOf(term) > -1;
                }).ids());
            if (!type || type == 'locations')
                result.locationIds = result.locationIds.concat(dgraph.locations().filter(function (e) {
                    return e.label().toLowerCase().indexOf(term) > -1;
                }).ids());
        }
        return result;
    }
    networkcube.searchForTerm = searchForTerm;
    var StringContainsFilter = /** @class */ (function () {
        function StringContainsFilter(pattern) {
            this.pattern = pattern;
        }
        StringContainsFilter.prototype.test = function (word) {
            console.log('contains:', word, this.pattern);
            return word.indexOf(this.pattern) > -1;
        };
        return StringContainsFilter;
    }());
})(networkcube || (networkcube = {}));
