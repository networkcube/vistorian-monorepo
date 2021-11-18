// extracted from logbook.html

class Bookmark {
	constructor(id, createdOn, title, viewType, networkDataset, controlsValues, visControls) {
		this.id = id;
		this.createdOn = createdOn;
		this.title = title;
		this.note = '';
		this.type = '';
		this.analysisOpts = [];
		this.viewType = viewType;
		this.networkDataset = networkDataset;
		this.controlsValues = controlsValues;
		this.visNetworkControl = visControls;
	}

	updateBookmark(title, note, type) {
		this.title = title;
		this.note = note;
		this.type = type;
	}

	updateBookmarkTitle(title) {
		this.title = title;
	}

	updateNote(noteText) {
		this.note = noteText;
	}

	updateAnalysisOpts(analysisOpts) {
		this.analysisOpts = analysisOpts;
	}

	updateBookmarkNotes(note) {
		this.note = note;
	}

	updateBookmarkType(type) {
		this.type = type;
	}

	updateBookmarkDataset(networkDataset) {
		this.networkDataset = networkDataset;
	}

	updateBookmarkAnalysisType(chkbx_AnalysisGroup) {
		this.analysisOpts = [];
		for (var i = 0; i < chkbx_AnalysisGroup.length; i++) {
			if (chkbx_AnalysisGroup[i].checked) {
				this.analysisOpts.push(i);
			}
		}
	}

	printBk() {
		return (
			'title: ' +
			this.title +
			' notes: ' +
			this.note +
			' Type: ' +
			this.type +
			' View' +
			this.viewType +
			' DS ' +
			this.networkDataset +
			' ' +
			this.analysisOpts.forEach(function (a) {
				return a;
			}) +
			this.controlsValues.toString()
		);
	}
}

class networkControls {
	constructor(networkType, startTime, endTime, globalZoom, panOffsetLocal, panOffsetGlobal) {
		this.networkType = networkType;
		this.timeSliderStart = startTime;
		this.timeSliderEnd = endTime;
		this.globalZoom = globalZoom;
		this.panOffsetLocal = panOffsetLocal;
		this.panOffsetGlobal = panOffsetGlobal;
	}
}

class nodeLinkControls extends networkControls {
	constructor(
		networkType,
		startTime,
		endTime,
		linkOpacity,
		nodeOpacity,
		nodeSize,
		edgeGap,
		linkWidth,
		labellingType
	) {
		super(networkType, startTime, endTime);
		this.linkOpacity = linkOpacity;
		this.nodeOpacity = nodeOpacity;
		this.nodeSize = nodeSize;
		this.edgeGap = edgeGap;
		this.linkWidth = linkWidth;
		this.labellingType = labellingType;
	}
}

class matrixControls extends networkControls {
	constructor(networkType, startTime, endTime, zoom, labellingType) {
		super(networkType, startTime, endTime);
		this.zoom = zoom;
		this.labellingType = labellingType;
	}
}

class timeArchsControls extends networkControls {
	constructor(networkType, startTime, endTime, labellingType) {
		super(networkType, startTime, endTime);
		this.labellingType = labellingType;
	}
}

class mapControls extends networkControls {
	constructor(
		networkType,
		startTime,
		endTime,
		nodeOverlap,
		edgeGap,
		linkOpacity,
		linkWidth,
		opacityOfPositionlessNodes
	) {
		super(networkType, startTime, endTime);
		this.nodeOverlap = nodeOverlap;
		this.edgeGap = edgeGap;
		this.linkOpacity = linkOpacity;
		this.linkWidth = linkWidth;
		this.opacityOfPositionlessNodes = opacityOfPositionlessNodes;
	}
}

// These functions were in logbook.html
// captureControlsValues modified to add viewType argument

function captureControlsValues(viewType) {
	//Create/Update an object to hold the controls' values of the network
	var visIframe = window.parent.document.getElementsByTagName('iframe')[1];
	let visControls = [];
	if (viewType === 'nodelink' || viewType === 'mat-nl' || viewType === 'tileview') {
		let startTime = visIframe.contentWindow.document
			.getElementById('sliderKnobMin')
			.getAttribute('cx');
		let endTime = visIframe.contentWindow.document
			.getElementById('sliderKnobMax')
			.getAttribute('cx');
		let cntrls = visIframe.contentWindow.document.getElementsByTagName('circle');
		let linkOpacity = cntrls[0].getAttribute('cx');
		let nodeOpacity = cntrls[1].getAttribute('cx');
		let nodeSize = cntrls[2].getAttribute('cx');
		let edgeGap = cntrls[3].getAttribute('cx');
		let linkWidth = cntrls[4].getAttribute('cx');
		let labellingType = visIframe.contentWindow.document.getElementById(
			'selection-input_Labeling'
		).selectedIndex;
		visControls.push(
			new nodeLinkControls(
				viewType,
				startTime,
				endTime,
				linkOpacity,
				nodeOpacity,
				nodeSize,
				edgeGap,
				linkWidth,
				labellingType
			)
		);
	}
	if (viewType === 'matrix' || viewType === 'mat-nl' || viewType === 'tileview') {
		if (viewType === 'mat-nl' || viewType === 'tileview')
			visIframe = window.parent.document.getElementsByTagName('iframe')[2];
		let matrixStartTime = visIframe.contentWindow.document
			.getElementById('sliderKnobMin')
			.getAttribute('cx');
		let matrixEndTime = visIframe.contentWindow.document
			.getElementById('sliderKnobMax')
			.getAttribute('cx');
		let matrixZoomVal = visIframe.contentWindow.document.getElementById('cellSizeBox').value;
		let matrixLabellingType =
			visIframe.contentWindow.document.getElementById('labelOrdering').selectedIndex;
		visControls.push(
			new matrixControls(
				viewType,
				matrixStartTime,
				matrixEndTime,
				matrixZoomVal,
				matrixLabellingType
			)
		);
	}
	if (viewType === 'dynamicego' || viewType === 'tileview') {
		if (viewType === 'tileview')
			visIframe = window.parent.document.getElementsByTagName('iframe')[3];
		let dyStartTime = visIframe.contentWindow.document
			.getElementById('sliderKnobMin')
			.getAttribute('cx');
		let dyEndTime = visIframe.contentWindow.document
			.getElementById('sliderKnobMax')
			.getAttribute('cx');
		let dyLabellingType =
			visIframe.contentWindow.document.getElementById('labelOrdering').selectedIndex;
		visControls.push(new timeArchsControls(viewType, dyStartTime, dyEndTime, dyLabellingType));
	}
	if (viewType === 'map' || viewType === 'tileview') {
		if (viewType === 'tileview')
			visIframe = window.parent.document.getElementsByTagName('iframe')[4];
		let mapStartTime = visIframe.contentWindow.document
			.getElementById('sliderKnobMin')
			.getAttribute('cx');
		let mapEndTime = visIframe.contentWindow.document
			.getElementById('sliderKnobMax')
			.getAttribute('cx');
		let mapCntrls = visIframe.contentWindow.document.getElementsByTagName('circle');

		let mapNodeOverlap = mapCntrls[0].getAttribute('cx');
		let mapEdgeGap = mapCntrls[1].getAttribute('cx');
		let mapLinkOpacity = mapCntrls[2].getAttribute('cx');
		let mapLinkWidth = mapCntrls[3].getAttribute('cx');
		let mapOpacityOfPositionlessNodes = mapCntrls[4].getAttribute('cx');

		visControls.push(
			new mapControls(
				viewType,
				mapStartTime,
				mapEndTime,
				mapNodeOverlap,
				mapEdgeGap,
				mapLinkOpacity,
				mapLinkWidth,
				mapOpacityOfPositionlessNodes
			)
		);
	}
	return visControls;
}

function nodeLinkRestore(bkFile, bkIndex, iframeIndex, controlsObjectIndex) {
	var visIframe = window.parent.document.getElementsByTagName('iframe')[iframeIndex];
	let nodelinkObj = bkFile[bkIndex].visNetworkControl[controlsObjectIndex];
	let cntrls = visIframe.contentWindow.document.getElementsByTagName('circle');
	if (cntrls) {
		cntrls[0].setAttribute('cx', nodelinkObj.linkOpacity);
		cntrls[1].setAttribute('cx', nodelinkObj.nodeOpacity);
		cntrls[2].setAttribute('cx', nodelinkObj.nodeSize);
		cntrls[3].setAttribute('cx', nodelinkObj.edgeGap);
		cntrls[4].setAttribute('cx', nodelinkObj.linkWidth);
		visIframe.contentWindow.document.getElementById('selection-input_Labeling').selectedIndex =
			nodelinkObj.labellingType;
	}
}

function matrixRestore(bkFile, bkIndex, iframeIndex, controlsObjectIndex) {
	var visIframe = window.parent.document.getElementsByTagName('iframe')[iframeIndex];
	let matrixObj = bkFile[bkIndex].visNetworkControl[controlsObjectIndex];
	visIframe.contentWindow.document.getElementById('labelOrdering').selectedIndex =
		matrixObj.labellingType;
	visIframe.contentWindow.document.getElementById('cellSizeBox').value = matrixObj.zoom;
}

function dynamicegoRestore(bkFile, bkIndex, iframeIndex, controlsObjectIndex) {
	var visIframe = window.parent.document.getElementsByTagName('iframe')[iframeIndex];
	let dyEObj = bkFile[bkIndex].visNetworkControl[controlsObjectIndex];
	visIframe.contentWindow.document.getElementById('labelOrdering').selectedIndex =
		dyEObj.labellingType;
}

function mapRestore(bkFile, bkIndex, iframeIndex, controlsObjectIndex) {
	var visIframe = window.parent.document.getElementsByTagName('iframe')[iframeIndex];
	let mapObj = bkFile[bkIndex].visNetworkControl[controlsObjectIndex];
	let mapCntrls = visIframe.contentWindow.document.getElementsByTagName('circle');
	mapCntrls[0].setAttribute('cx', mapObj.nodeOverlap);
	mapCntrls[1].setAttribute('cx', mapObj.edgeGap);
	mapCntrls[2].setAttribute('cx', mapObj.linkOpacity);
	mapCntrls[3].setAttribute('cx', mapObj.linkWidth);
	mapCntrls[4].setAttribute('cx', mapObj.opacityOfPositionlessNodes);
}

export {
	Bookmark,
	captureControlsValues,
	nodeLinkRestore,
	matrixRestore,
	dynamicegoRestore,
	mapRestore
};
