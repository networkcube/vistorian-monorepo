"use strict";
exports.__esModule = true;
exports.getUrlVars = void 0;
function getUrlVars() {
    var vars = {};
    var params = window.location.search.replace("?", "").split('&');
    var tmp, value;
    params.forEach(function (item) {
        tmp = item.split("=");
        value = decodeURIComponent(tmp[1]);
        vars[tmp[0]] = value;
    });
    return vars;
}
exports.getUrlVars = getUrlVars;
