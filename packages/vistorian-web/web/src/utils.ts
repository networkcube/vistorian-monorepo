export function getUrlVars() {
    const vars: any = {};
    const params: any = window.location.search.replace("?", "").split('&');
    let tmp: any, value: any;
    params.forEach(function (item: any) {
        tmp = item.split("=");
        value = decodeURIComponent(tmp[1]);
        vars[tmp[0]] = value;
    });
    return vars;
}
