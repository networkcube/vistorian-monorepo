export function getUrlVars() {
    var vars: any = {};
    var params: any = window.location.search.replace("?", "").split('&');
    var tmp: any, value: any;
    params.forEach(function (item: any) {
        tmp = item.split("=");
        value = decodeURIComponent(tmp[1]);
        vars[tmp[0]] = value;
    });
    return vars;
}
