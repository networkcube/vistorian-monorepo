import {dynamicegoRestore, mapRestore, matrixRestore, nodeLinkRestore} from "../components/bookmarks/bookmark";

function getUrlVars() {
    const vars = {};
    const params = window.location.search.replace("?", "").split("&");
    let tmp;
    let value;
    params.forEach(function (item) {
        tmp = item.split("=");
        value = decodeURIComponent(tmp[1]);
        vars[tmp[0]] = value;
    });
    return vars;
};
const read = (key) => {
    return JSON.parse(localStorage.getItem(key));
};

const getBookmarks = () => {
    return read("vistorianBookmarks");
}

const getSelectedNetwork = () => {
    let params = getUrlVars();
    let datasetName = params["datasetName"].replace(/___/g, " ");
    let sessionid = params["session"].replace(/___/g, " ");
    let selectedNetwork = null;
    const getNetwork = (networkId, sid) => read(`${sid}#Network#${networkId}`);
    const networks = read(`${sessionid}#NetworkIds`)
        .map((id) => getNetwork(id, sessionid));
    const nets = networks.filter((n) => n.name === datasetName);
    if (nets.length > 0) {
        selectedNetwork = nets[0];
    }

    return selectedNetwork;
}


const loadBookmark = (setState, bookmarks, index, iFrameIndex) => {
	console.log("Loading bookmark");
    const bookmark = bookmarks[index];
    switch (bookmark.viewType) {
        case 'nodelink':
            nodeLinkRestore(bookmarks, index, iFrameIndex, 0);
            setState(bookmark.controlsValues[0], 'nodelink');
            break;
        case 'matrix':
            matrixRestore(bookmarks, index, iFrameIndex, 0);
            setState(bookmark.controlsValues[0], 'matrix');
            break;
        case 'dynamicego':
            dynamicegoRestore(bookmarks, index, iFrameIndex, 0);
            setState(bookmark.controlsValues[0], 'dynamicego');
            break;
        case 'map':
            mapRestore(bookmarks, index, iFrameIndex, 0);
            setState(bookmark.controlsValues[0], 'map');
            break;
        case 'mat-nl':
			break;
        case 'tileview':
          break;
    }
};


export {getBookmarks, getSelectedNetwork, loadBookmark}