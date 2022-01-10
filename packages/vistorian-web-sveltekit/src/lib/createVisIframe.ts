// A copy of vistorian-core/src/data/main re-written to not use iFrame

// returns an iframe that loads a visualization of type vistype,
// with the data set dataname
export function createVisualizationIFrame(
	parentId: string,
	visUri: string,
	session: string,
	dataName: string,
	width: number,
	height: number,
	visParams?: any
): HTMLIFrameElement {
	let visParamString = '';
	for (const prop in visParams) {
		visParamString += '&' + prop + '=' + visParams[prop];
	}

	if (!visUri.startsWith('http')) {
		let server;
		if (window.location.port)
			server =
				location.protocol +
				'//' +
				window.location.hostname +
				':' +
				window.location.port +
				'' +
				window.location.pathname;
		else
			server = location.protocol + '//' + window.location.hostname + '' + window.location.pathname;
		visUri = server + '/node_modules/vistorian-' + visUri + '/web/index.html';
	}

	const iFrame = document.createElement('iframe');

	iFrame.width = width.toString();
	iFrame.height = height.toString();
	iFrame.src = visUri + '?' + 'session=' + session + '&datasetName=' + dataName + visParamString;
	if (visParams != undefined && Object.prototype.hasOwnProperty.call(visParams, 'scrolling')) {
		iFrame.scrolling = visParams.scrolling;
	}

	document.getElementById(parentId).appendChild(iFrame);

	return iFrame;
}
