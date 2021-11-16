function dragElement(elmnt) {
	var pos1 = 0,
		pos2 = 0,
		pos3 = 0,
		pos4 = 0;
	if (document.getElementById(elmnt.id + 'header')) {
		/* if present, the header is where you move the DIV from:*/
		document.getElementById(elmnt.id + 'header').onmousedown = dragMouseDown;
	} else {
		/* otherwise, move the DIV from anywhere inside the DIV:*/
		elmnt.onmousedown = dragMouseDown;
	}

	function dragMouseDown(e) {
		e = e || window.event;
		e.preventDefault();
		// get the mouse cursor position at startup:
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closeDragElement;
		// call a function whenever the cursor moves:
		document.onmousemove = elementDrag;
	}

	function elementDrag(e) {
		e = e || window.event;
		e.preventDefault();
		// calculate the new cursor position:
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		// set the element's new position:
		elmnt.style.top = elmnt.offsetTop - pos2 + 'px';
		elmnt.style.left = elmnt.offsetLeft - pos1 + 'px';
	}

	function closeDragElement() {
		/* stop moving when mouse button is released:*/
		document.onmouseup = null;
		document.onmousemove = null;
	}
}

function refreshBookmarks() {
	var urlTxt = window.location.pathname;
	urlTxt = urlTxt.substring(urlTxt.lastIndexOf('/') + 1, urlTxt.indexOf('.'));

	var bkFrame = document.getElementById('myFrame');
	var bkFrameDoc;
	if (bkFrame) bkFrameDoc = bkFrame.contentDocument || bkFrame.contentWindow.document;
	else bkFrameDoc = document;

	// var bksContainer=bkFrameDoc.getElementById("logs");
	var visBookmarks = localStorage.getItem('vistorianBookmarks');
	var visBookmarksArray = JSON.parse(visBookmarks);
	var i, id;
	if (visBookmarks && bkFrame) {
		// if (typeof visBookmarksArray !== "undefined" && visBookmarksArray!==null && visBookmarksArray.length!=0){
		for (i = 0; i < visBookmarksArray.length; i++) {
			id = visBookmarksArray[i].id;
			bkFrameDoc.getElementById('btn_dateTime' + id).innerHTML = visBookmarksArray[i].createdOn;
			bkFrameDoc.getElementById('btn_title_' + id).innerHTML = visBookmarksArray[i].title;
			bkFrameDoc.getElementById('lbl_type_' + id).innerHTML = visBookmarksArray[i].type;
			bkFrameDoc.getElementById('txt_note_' + id).innerText = visBookmarksArray[i].note;

			var divBtns = bkFrameDoc.getElementsByName('menuButton_' + id);
			var checkOtherType = true;
			for (var j = 0; j < divBtns.length; j++) {
				if (divBtns[j].value == visBookmarksArray[i].type)
					divBtns[j].style.backgroundColor = '#FF7F50';
				else divBtns[j].style.backgroundColor = '#bbb';
			}

			var frmChk = bkFrameDoc.getElementById('frmcheck_' + id);
			if (visBookmarksArray[i].type == 'Analyze Data') {
				frmChk.style.display = 'block';
				for (var cntr = 0; cntr < visBookmarksArray[i].analysisOpts.length; cntr++)
					bkFrameDoc.getElementsByName('chkGroup_' + id)[cntr].checked = checkOptionExistance(
						cntr,
						visBookmarksArray[i].analysisOpts
					);
			} else frmChk.style.display = 'none';

			for (var m = 0; m < generalPBtns.length; m++) {
				if (visBookmarksArray[i].type == generalPBtns[m]) {
					checkOtherType = false;
					break;
				}
			}
			var txt_OtherTypeCont = bkFrameDoc.getElementById('txt_otherType_' + id);
			if (checkOtherType) {
				txt_OtherTypeCont.setAttribute('style', 'display:block;visibility: visible;');
				//bkFrameDoc.getElementsByName("menuButton_"+id)[divBtns.length-1].style.backgroundColor= "#FF7F50";
			} else txt_OtherTypeCont.style.display = 'none';
		}
	}
	if (bkFrameDoc != document)
		document.getElementById('myFrame').src = document.getElementById('myFrame').src;

	bkFrame = document.getElementById('myFrame');

	if (bkFrame) bkFrame = bkFrame.contentWindow;
	else bkFrame = window;

	localStorage.setItem('currentPageInFocus', bkFrame.viewType);
	trace.event('log_17', 'page', 'focus', urlTxt);
	checkLogStatus();
}

export { refreshBookmarks, dragElement };
