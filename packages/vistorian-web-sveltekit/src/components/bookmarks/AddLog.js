function AddNewLog(
	id,
	dateCreated,
	title,
	note,
	selectedType,
	analysisOptions,
	networkType,
	networkDataset
) {
	let userBookmarks = JSON.parse(localStorage.getItem('vistorianBookmarks')) || [];

	var logs = document.getElementById('logs');
	//Create new log div
	var newDiv = document.createElement('div');
	var currentCounterValue;
	//set div ID and network type
	if (id == 0) {
		counter++;
		currentCounterValue = counter;
		newDiv.className = viewType;
	} else {
		currentCounterValue = id;
		newDiv.className = networkType;
	}
	newDiv.id = 'div_log_' + currentCounterValue;

	// create inner collapsible div
	//set bookmark date
	var newContentDiv = document.createElement('div');
	newContentDiv.id = currentCounterValue;
	newContentDiv.setAttribute('class', 'content');
	var timeLabelHeader = document.createElement('label');
	timeLabelHeader.innerHTML = 'Date/Time Created: &nbsp;&nbsp;&nbsp; ';
	timeLabelHeader.style = 'font-weight: bold;float:left;';

	//    var timeLabel=document.createElement("label");

	var btn_dateTime = document.createElement('span');
	btn_dateTime.id = 'btn_dateTime' + currentCounterValue;

	if (dateCreated == '') {
		var today = new Date();
		var date = today.getDate() + '-' + monthNames[today.getMonth()] + '-' + today.getFullYear();
		var time = today.getHours() + ':' + today.getMinutes(); // + ":" + today.getSeconds();
		//        timeLabel.innerHTML=date+ "  "+time;
		btn_dateTime.innerHTML = date + '  ' + time;
	} else {
		//        timeLabel.innerHTML=dateCreated;
		btn_dateTime.innerHTML = dateCreated;
	}

	//create log collapsible title
	var headerButton = document.createElement('button');

	var btn_title = document.createElement('span');
	btn_title.id = 'btn_title_' + currentCounterValue;

	if (title != '') btn_title.innerHTML = title;
	else btn_title.innerHTML = 'Bookmark ' + currentCounterValue + ' : ';
	var btn_bookmarkViewType = document.createElement('span');
	//    btn_bookmarkViewType.style=" font-weight: bold;";
	if (id == 0)
		btn_bookmarkViewType.innerHTML = '&#9;&#9;&#9;' + '&#9;&#9;&#9;' + viewType.toUpperCase();
	else btn_bookmarkViewType.innerHTML = networkType.toUpperCase();

	var lowerContainer = document.createElement('span');
	lowerContainer.style = 'display: flex;justify-content: space-between;';
	lowerContainer.appendChild(btn_dateTime);
	lowerContainer.appendChild(btn_bookmarkViewType);

	//  lowerContainer.style="display:flex;";
	if (viewType != 'dataview') {
		var restoreStateIcon = document.createElement('i');
		restoreStateIcon.className = 'fa fa-refresh';
		restoreStateIcon.addEventListener('click', function () {
			var bkFile = JSON.parse(localStorage.getItem('vistorianBookmarks')) || [];
			var bkIndex = locateLogObj(bkFile, newContentDiv.id); //this.parentElement.id);

			trace.event('bkm_5', ' bookmark state', 'restoreted', window.parent.location.pathname);

			window.vc.messenger.setState(bkFile[bkIndex].controlsValues[0], bkFile[bkIndex].viewType);
			var content = this.parentElement.parentElement.nextElementSibling;
			headerButton.classList.toggle('active');
			if (content.style.maxHeight != null) {
				content.style.maxHeight = content.scrollHeight + 'px';
			} else {
				content.style.maxHeight = null;
			}
			switch (bkFile[bkIndex].viewType) {
				case 'nodelink':
					nodeLinkRestore(bkFile, bkIndex, 1, 0);
					break;
				case 'matrix':
					matrixRestore(bkFile, bkIndex, 1, 0);

					break;
				case 'dynamicego':
					dynamicegoRestore(bkFile, bkIndex, 1, 0);
					break;
				case 'map':
					mapRestore(bkFile, bkIndex, 1, 0);
					break;
				case 'mat-nl':
				case 'tileview':
					window.vc.messenger.setState(bkFile[bkIndex].controlsValues[0], 'nodelink');
					nodeLinkRestore(bkFile, bkIndex, 1, 0);
					window.vc.messenger.setState(bkFile[bkIndex].controlsValues[1], 'matrix');
					matrixRestore(bkFile, bkIndex, 2, 1);

					if (bkFile[bkIndex].viewType == 'tileview') {
						window.vc.messenger.setState(bkFile[bkIndex].controlsValues[2], 'dynamicego');
						dynamicegoRestore(bkFile, bkIndex, 3, 2);
						window.vc.messenger.setState(bkFile[bkIndex].controlsValues[3], 'map');
						mapRestore(bkFile, bkIndex, 4, 3);
					}
			}
		});
		lowerContainer.appendChild(restoreStateIcon);
	}
	headerButton.appendChild(btn_title);
	headerButton.appendChild(document.createElement('br'));
	headerButton.appendChild(lowerContainer);

	headerButton.setAttribute('class', 'collapsible');

	headerButton.addEventListener('click', function () {
		this.classList.toggle('active');
		var content = this.nextElementSibling;
		if (content.style.maxHeight) {
			content.style.maxHeight = null;
		} else {
			content.style.maxHeight = content.scrollHeight + 'px';
		}
	});

	newDiv.appendChild(headerButton);

	//set the title update container
	var lbl_title = document.createElement('label');
	lbl_title.innerText = 'Bookmark Label:';
	lbl_title.style = 'font-weight: bold;float:left;';

	var newTitle = document.createElement('input');
	newTitle.type = 'text';
	newTitle.id = 'txt_title_' + currentCounterValue;
	if (title != '') newTitle.value = title;
	else newTitle.placeholder = 'Update bookmark label here ..';
	newTitle.addEventListener('keyup', function () {
		let userBks = JSON.parse(localStorage.getItem('vistorianBookmarks')) || [];
		document.getElementById(btn_title.id).innerHTML = this.value;
		userBks[locateLogObj(userBks, this.parentElement.id)].title = this.value;
		updateLocalStorage(userBks);
	});

	lbl_title.htmlFor = newTitle.id;

	newContentDiv.appendChild(lbl_title);
	newContentDiv.appendChild(newTitle);
	newContentDiv.appendChild(document.createElement('br'));

	var newNote = document.createElement('textarea');
	newNote.id = 'txt_note_' + currentCounterValue;

	newNote.rows = 5;

	// newNote.innerHTML=note;

	newNote.placeholder = 'Enter your notes here ..';
	if (note != '') newNote.innerText = note;

	/*  newNote.addEventListener('keyup', function(event) {
         
         bookmarksJSONFile[locateLogObj(bookmarksJSONFile,this.parentElement.id)].updateBookmarkNotes(this.value);
         updateLocalStorage(bookmarksJSONFile);
         updatesNotSaved();
         return false; 
     }); */
	var notesLabel = document.createElement('label');
	notesLabel.innerText = 'Notes:';
	notesLabel.style = 'font-weight: bold;';
	notesLabel.htmlFor = newNote.id;

	newContentDiv.appendChild(notesLabel);

	newContentDiv.appendChild(newNote);

	// Add bookmark type (purpose)
	var flagTypes = [
		'Review Data Quality',
		'Test a particular hypothesis',
		'Compare different visualizations',
		'Retrieve specific details',
		'Repeat analysis with new data'
	];
	var bmTypeLabel = document.createElement('label');
	bmTypeLabel.innerText = 'Activity: ';
	bmTypeLabel.style = 'font-weight: bold;';
	newContentDiv.appendChild(bmTypeLabel);

	var bmType = document.createElement('label');
	bmType.id = 'lbl_type_' + currentCounterValue;
	bmType.style = 'font-style: italic; ';
	if (selectedType != '') bmType.innerText = selectedType;
	bmType.style.display = 'none';
	newContentDiv.appendChild(bmType);

	// Add "analyze data" with its sub-types
	var btn = document.createElement('input');
	btn.type = 'button';
	btn.name = 'menuButton_' + currentCounterValue;
	btn.classList.add('menuButton');
	btn.style = ' display: inline-block;';
	btn.value = generalPBtns[0];
	if (selectedType != '') {
		if (btn.value == selectedType) btn.style.backgroundColor = '#FF7F50';
	}

	btn.addEventListener('click', function () {
		let userBks = JSON.parse(localStorage.getItem('vistorianBookmarks')) || [];

		document.getElementById(bmType.id).innerText = this.value;
		frmChk.style.display = 'block';
		txt_otherType.style.display = 'none';
		document.getElementsByName(this.name).forEach((btn) => {
			if (btn == this) {
				btn.style.backgroundColor = '#FF7F50';
				trace.event(
					'bkm_3',
					' bookmark type specified',
					this.value,
					window.parent.location.pathname
				);
			} else btn.style.backgroundColor = '#bbb';
		});
		document.getElementById(newContentDiv.id).style.maxHeight =
			document.getElementById(newContentDiv.id).scrollHeight + 'px';
		userBks[locateLogObj(userBks, this.parentElement.id)].type = document.getElementById(
			bmType.id
		).innerText;
		updateLocalStorage(userBks);

		updatesNotSaved();
	});
	newContentDiv.appendChild(btn);
	//Add rest of the types except (Other) type
	for (var i = 1; i < generalPBtns.length; i++) {
		var btn = document.createElement('input');
		btn.type = 'button';
		btn.classList.add('menuButton');
		btn.style = ' display: inline-block;';
		btn.name = 'menuButton_' + currentCounterValue;
		btn.value = generalPBtns[i];
		if (selectedType != '') {
			if (btn.value == selectedType) btn.style.backgroundColor = '#FF7F50';
		}
		btn.addEventListener('click', function () {
			let userBks = JSON.parse(localStorage.getItem('vistorianBookmarks')) || [];

			document.getElementById(bmType.id).innerText = this.value;
			document.getElementsByName(this.name).forEach((btn) => {
				if (btn == this) {
					btn.style.backgroundColor = '#FF7F50';
					trace.event(
						'bkm_3',
						' bookmark type specified',
						this.value,
						window.parent.location.pathname
					);
				} else btn.style.backgroundColor = '#bbb';
			});
			txt_otherType.style.display = 'none';
			frmChk.style.display = 'none';
			userBks[locateLogObj(userBks, this.parentElement.id)].type = document.getElementById(
				bmType.id
			).innerText;
			updatesNotSaved();
			updateLocalStorage(userBks);
		});
		newContentDiv.appendChild(btn);
	}
	btn = document.createElement('input');
	btn.type = 'button';
	btn.value = 'Other';
	btn.classList.add('menuButton');
	btn.name = 'menuButton_' + currentCounterValue;
	//create other type textarea
	var txt_otherType = document.createElement('textarea');
	txt_otherType.id = 'txt_otherType_' + currentCounterValue;
	txt_otherType.placeholder = "Explian other type here .. Please don't add personal information";
	var otherType = true;
	if (selectedType != '') {
		for (var i = 0; i < generalPBtns.length; i++)
			if (generalPBtns[i] == selectedType) {
				otherType = false;
				break;
			}
	}
	// if ( !otherType || id==0 ){

	if (!otherType) {
		txt_otherType.style.display = 'none';
	} else {
		btn.style.backgroundColor = '#FF7F50';
		txt_otherType.innerText = selectedType;
		txt_otherType.style.display = 'block';
	}

	btn.addEventListener('click', function () {
		if (document.getElementById(bmType.id).innerText.length == 0)
			document.getElementById(bmType.id).innerText = this.value;
		let userBks = JSON.parse(localStorage.getItem('vistorianBookmarks')) || [];

		document.getElementsByName(this.name).forEach((btn) => {
			if (btn == this) {
				btn.style.backgroundColor = '#FF7F50';
				trace.event(
					'bkm_3',
					' bookmark type specified',
					this.value,
					window.parent.location.pathname
				);
			} else btn.style.backgroundColor = '#bbb';
		});
		if (txt_otherType.style.display == 'none') {
			txt_otherType.style.display = 'block';
			document.getElementById(newContentDiv.id).style.maxHeight =
				document.getElementById(newContentDiv.id).scrollHeight + 'px';
		}
		userBks[locateLogObj(userBks, this.parentElement.id)].type = document.getElementById(
			bmType.id
		).innerText;
		updatesNotSaved();
		updateLocalStorage(userBks);
	});
	newContentDiv.appendChild(btn);

	/*                 
                    if (bmType.innerText==generalPBtns[generalPBtns.length-1])
                    else */

	txt_otherType.addEventListener('keyup', function () {
		// let userBks = JSON.parse(localStorage.getItem("vistorianBookmarks")) || [];

		document.getElementById(bmType.id).innerText = this.value;
		trace.event(
			'bkm_3',
			' bookmark type specified',
			'Other: ' + this.value,
			window.parent.location.pathname
		);
		// if (this.value.length==0)
		//     document.getElementById(bmType.id).innerText="Other:";
		//     userBks[locateLogObj(userBks,this.parentElement.id)].type=document.getElementById(bmType.id).innerText;
		updatesNotSaved();
		// updateLocalStorage(userBks);
	});
	newContentDiv.appendChild(txt_otherType);

	var frmChk = document.createElement('form');
	frmChk.id = 'frmcheck_' + +currentCounterValue;
	frmChk.action = '#';
	if (bmType.innerText == generalPBtns[0]) {
		frmChk.style.display = 'block';
	} else frmChk.style.display = 'none';
	newContentDiv.appendChild(frmChk);
	var logFlag = document.createElement('fieldset');
	logFlag.name = 'fs_logType_' + currentCounterValue;
	var selectHeader = document.createElement('legend');
	selectHeader.style = 'font-weight: bold;';
	selectHeader.innerText = 'Characterize your analysis: ';
	logFlag.appendChild(selectHeader);
	for (var i = 0; i < flagTypes.length; i++) {
		var optChk = document.createElement('input');
		optChk.type = 'checkbox';
		optChk.value = i;
		optChk.name = 'chkGroup_' + currentCounterValue;
		optChk.id = 'chk_analysis_' + currentCounterValue + '_' + (i + 1);
		optChk.style = 'float:left;';

		optChk.checked = checkExistance(optChk.value, analysisOptions);

		optChk.addEventListener('click', function () {
			//     let userBks = JSON.parse(localStorage.getItem("vistorianBookmarks")) || [];

			trace.event(
				'bkm_6',
				' bookmark analysis type selected',
				this.value,
				window.parent.location.pathname
			);
			if (document.getElementById(txt_otherType.id).value.length == 0)
				document.getElementById(bmType.id).innerText = 'Other:';
			/*                         let bkIndex=locateLogObj(userBks,this.name.charAt(this.name.length-1));
                                    updateBookmarkAnalysisTypeGeneral(userBks[bkIndex],document.getElementsByName(this.name)); */
			updatesNotSaved();
			//updateLocalStorage(userBks);
		});
		var opt = document.createElement('label');
		opt.innerHTML = flagTypes[i];
		opt.htmlFor = optChk.id;

		opt.appendChild(optChk);
		logFlag.appendChild(opt);
	}
	frmChk.appendChild(logFlag);
	newContentDiv.appendChild(frmChk);

	//Add buttons (Restore State|Delete)
	newContentDiv.appendChild(document.createElement('br'));
	newContentDiv.appendChild(document.createElement('br'));
	//Hide restore-state button for non-visualization pages
	/*  if (newDiv.className!= "dataview" ){
         var restoreButton = document.createElement("input");
         restoreButton.type = "button";
         restoreButton.value="Restore Visualization State";
         restoreButton.addEventListener('click', function() {
             var bkFile=JSON.parse(localStorage.getItem("vistorianBookmarks")) || [];
             var bkIndex=locateLogObj(bkFile,this.parentElement.id);

             trace.event('bkm_5', ' bookmark state', 'restoreted', window.parent.location.pathname);
           
             window.vc.messenger.setState(bkFile[bkIndex].controlsValues[0]);
            // window.parent.exports.networkcube.vistorian.setState(bookmarksJSONFile[locateLogObj(bookmarksJSONFile,this.parentElement.id)].controlsValues);

          });
         newContentDiv.appendChild(restoreButton);
     } */

	// Delete button: deletes the current bookmark
	var deleteButton = document.createElement('input');
	deleteButton.type = 'button';
	deleteButton.value = 'Delete Bookmark';

	deleteButton.addEventListener('click', function () {
		let userBks = JSON.parse(localStorage.getItem('vistorianBookmarks')) || [];

		if (confirm('Are you sure you want to Delete?')) {
			this.parentElement.parentElement.remove();
			userBks.splice(locateLogObj(userBks, this.parentElement.id), 1);
			trace.event('bkm_4', ' bookmark ', 'deleted', window.parent.location.pathname);
			updateLocalStorage(userBks);
		}
		//logFileJSON.push();
		if (userBks.length == 0)
			document.getElementById('lbl_changesState').innerText = 'No bookmarks yet!';
	});
	newContentDiv.appendChild(deleteButton);

	// Save button: Saves the current bookmark's updates
	var saveButton = document.createElement('input');
	saveButton.type = 'button';
	saveButton.value = 'Save Changes';

	saveButton.addEventListener('click', function () {
		var bkFile = JSON.parse(localStorage.getItem('vistorianBookmarks') || '[]');

		var updatedNotes = this.parentElement.getElementsByTagName('textarea')[1];

		var bkIndex = locateLogObj(bkFile, this.parentElement.id);

		if (viewType != 'dataview' && bkFile[bkIndex].viewType == viewType) {
			//not to override the state of a visualization incorrectly with a mismatching type or absence of state
			//Create an object to hold the state of the network
			switch (viewType) {
				case 'nodelink':
				case 'matrix':
				case 'map':
				case 'dynamicego':
					window.vc.messenger.getState(bkIndex, viewType, false, '');
					break;
				case 'mat-nl':
					window.vc.messenger.getState(bkIndex, 'nodelink', false, 'mat-nl');

					// window.vc.messenger.getState(bkIndex,"matrix",false);

					break;
				case 'tileview':
					window.vc.messenger.getState(bkIndex, 'nodelink', false, 'tileview');
					//window.vc.messenger.getState(bkIndex,"matrix",false);
					//window.vc.messenger.getState(bkIndex,"dynamicego",false);
					//window.vc.messenger.getState(bkIndex,"map",false);
					break;
			}

			bkFile[bkIndex].visNetworkControl = captureControlsValues();
		}

		bkFile[bkIndex].note = updatedNotes.value;

		updateBookmarkAnalysisTypeGeneral(
			bkFile[bkIndex],
			document.getElementsByName('chkGroup_' + bkFile[bkIndex].id)
		);

		//if (document.getElementById("txt_otherType_"+bkFile[bkIndex].id).value.length==0)
		//document.getElementById("lbl_type_"+bkFile[bkIndex].id).innerText="Other:";
		if (document.getElementById('lbl_type_' + bkFile[bkIndex].id).innerText.length == 0)
			alert('You did not specify the type of your bookmark!');
		bkFile[locateLogObj(bkFile, this.parentElement.id)].type = document.getElementById(
			'lbl_type_' + bkFile[bkIndex].id
		).innerText;

		//currentBookmark.updateBookmarkType(document.getElementById('lbl_type_'+x.id).value);
		//currentBookmark.updateBookmarkAnalysisType(currentBookmark)
		// (bookmarksJSONFile[bkIndex]).updateBookmarkNotes(updatedNotes.value);

		// lsBookmarks[locateLogObj(lsBookmarks,this.parentElement.id)].updateBookmarkNotes(updatedNotes.value);
		//    localStorage.setItem("vistorianBookmarks", JSON.stringify(bookmarksJSONFile));

		//  trace.event('bkm_4', ' bookmark ', 'deleted', window.parent.location.pathname);
		updateLocalStorage(bkFile);
		trace.event('bkm_2', ' updates/changes', 'saved by user', window.parent.location.pathname);

		return false;
	});
	newContentDiv.appendChild(saveButton);

	newContentDiv.appendChild(document.createElement('br'));

	/* if (title!="")
    {
        newContentDiv.style.height=   newContentDiv.scrollHeight +"px";
    } */
	newDiv.appendChild(newContentDiv);
	logs.prepend(newDiv);

	/*  else
newBookmark.updateBookmarkDataset(networkName); */
	var newBookmark;
	if (id == 0) {
		newBookmark = new Bookmark(
			currentCounterValue,
			btn_dateTime.innerHTML,
			btn_title.innerHTML,
			newDiv.className,
			networkName,
			[],
			[]
		);
		newBookmark.note = newNote.value;
		newBookmark.analysisOpts = analysisOptions;
		newBookmark.updateBookmarkType(selectedType);
		userBookmarks.push(newBookmark);
		switch (viewType) {
			case 'dataview':
				networkName = window.parent.document.getElementById('networknameInput').value;
				break;
			case 'nodelink':
			case 'matrix':
			case 'dynamicego':
			case 'map':
				window.vc.messenger.getState(currentCounterValue - 1, viewType, true, '');
				break;
			case 'mat-nl': // location= index of 0(nodelink)//1(matrix) in the visControls
				window.vc.messenger.getState(currentCounterValue - 1, 'nodelink', true, 'mat-nl');

				// window.vc.messenger.getState(currentCounterValue-1,"matrix",true);
				break;
			case 'tileview': // location= index of 0(nodelink)//1(matrix)//2(DynamicEgo)//3(Map) in the visControls
				window.vc.messenger.getState(currentCounterValue - 1, 'nodelink', true, 'tileview');
			// window.vc.messenger.getState(currentCounterValue-1,"matrix",true);
			// window.vc.messenger.getState(currentCounterValue-1,"dynamicego",true);
			// window.vc.messenger.getState(currentCounterValue-1,"map",true);
		}
		userBookmarks[userBookmarks.length - 1].visNetworkControl = captureControlsValues();
	}

	updateLocalStorage(userBookmarks);
}

export { AddNewLog };
