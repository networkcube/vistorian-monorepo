<script>
	import { Button, FormGroup, Input } from 'sveltestrap';

	import { trace } from '../../lib/trace';
	import { onMount } from 'svelte';

	import Bookmark from './Bookmark.svelte';
	import AddNewBookmark from './AddNewBookmark.svelte';

	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	/*
  var viewType = window.parent.location.pathname;
  if ((viewType.length != 0) && (typeof viewType !== 'undefined')) {
      viewType = window.parent.location.pathname.split('/', 3)[2].split('.')[0];
  }

  var networkName = window.parent.location.search;
  if (networkName.indexOf('&') > -1) {
      networkName = window.parent.location.search.split('&')[1].split('=')[1];
  }
  */

	//    window.vc.messenger.addEventListener("STATE_CREATED", stateCreatedHandler);//   window.vc.messenger.addEventListener("ZOOM_INTERACTION", zoomLoggingHandler);

	let bookmarks = [];

	let whichBookMarksToShow = 'all';

	let newBookmarkModalOpen = false;

	let showSessionID = false;
	const toggleMySessionID = () => {
		const change = showSessionID ? 'hide' : 'show';
		trace.event('log_11', ' Session ID Button', change, window.parent.location.pathname);
		showSessionID = !showSessionID;
	};

	const exportBookmarks = () => {
		trace.event(
			'bkm_9',
			window.parent.location.pathname,
			'bookmark_tool',
			'Bookmarks File Exported'
		);

		var fileToExport = localStorage.getItem('vistorianBookmarks');
		if (fileToExport) {
			var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(fileToExport);
			var downloadElement = document.createElement('a');
			downloadElement.setAttribute('href', dataStr);
			downloadElement.setAttribute('download', 'vistorian_bookmarks.json');
			downloadElement.click();
			trace.event('bkm_9', ' bookmarks file export', true, window.parent.location.pathname);
		} else {
			alert('No bookmarks yet created to be exported!');
			trace.event('bkm_9', ' bookmarks file export', false, window.parent.location.pathname);
		}
	};

	function initializeJSON() {
		//var logsContainer = document.getElementById("logs");
		//logsContainer.innerHTML = "";
		let bks = localStorage.getItem('vistorianBookmarks');
		bookmarks = JSON.parse(bks) || [];
	}

	async function readFile(event) {
		const file = event.target.files.item(0);
		const data = await file.text();
		localStorage.setItem('vistorianBookmarks', data);
		initializeJSON();
	}

	const importBookmarks = () => {
		trace.event(
			'bkm_10',
			window.parent.location.pathname,
			'bookmark_tool',
			'Bookmarks File Imported'
		);

		var fileImported = document.createElement('input');
		fileImported.type = 'file';
		fileImported.id = 'jsonFile';
		fileImported.accept = '.json';
		fileImported.onchange = (event) => {
			readFile(event);
		};

		var importStatus = false;
		let userBookmarks = JSON.parse(localStorage.getItem('vistorianBookmarks')) || [];
		if (userBookmarks && userBookmarks.length > 0) {
			if (
				confirm(
					'Are you sure you want to import the selected file? This will overwrite existing bookmarks'
				)
			) {
				fileImported.click();
				importStatus = true;
			}
		} else {
			fileImported.click();
			importStatus = true;
		}

		trace.event('bkm_10', ' bookmark file imported', importStatus, window.parent.location.pathname);
	};

	const clearBookmarks = () => {
		trace.event(
			'bkm_10',
			window.parent.location.pathname,
			'bookmark_tool',
			'Bookmarks File Cleared'
		);

		if (confirm('Are you sure you want to delete all bookmarks?')) {
			localStorage.removeItem('vistorianBookmarks');
			initializeJSON();
			window.parent.document.getElementById('myFrame').src =
				window.parent.document.getElementById('myFrame').src;
		}
	};

	const addBookmark = () => {
		newBookmarkModalOpen = true;
		trace.event('bkm_1', ' new bookmark button', 'clicked', window.parent.location.pathname);
	};

	let viewType;
	onMount(async () => {
		// from logbook.html
		viewType = window.parent.location.pathname;
		if (viewType.length !== 0 && typeof viewType !== 'undefined') {
			viewType = window.parent.location.pathname.split('/', 3)[1].split('.')[0];
		}

		initializeJSON();
	});

	let bookmarksToShow;
	$: bookmarksToShow = bookmarks.filter(
		(b) => whichBookMarksToShow === 'all' || b.viewType === viewType
	);
</script>

<main>
	<div id="logbook_container">
		<AddNewBookmark bind:bookmarks bind:open={newBookmarkModalOpen} />

		<FormGroup>
			<Input
				id="r1"
				type="radio"
				bind:group={whichBookMarksToShow}
				on:click={() =>
					trace.event(
						'bkm_7',
						' show all bookmarks (view)',
						'selected',
						window.parent.location.pathname
					)}
				value="all"
				label="Show all bookmarks"
			/>
			<Input
				id="r2"
				type="radio"
				bind:group={whichBookMarksToShow}
				on:click={() =>
					trace.event(
						'bkm_7',
						' show current view bookmarks',
						'selected',
						window.parent.location.pathname
					)}
				value="specific"
				label="Show only bookmarks of current visualization"
			/>
		</FormGroup>

		{#if bookmarksToShow.length === 0}
			<p>No bookmarks to display.</p>
		{:else}
			<div>
				{#each bookmarks as bookmark, index}
					<Bookmark bind:bookmarks {index} {whichBookMarksToShow} />
				{/each}
			</div>
		{/if}

		<Button block outline on:click={addBookmark} disabled={viewType === 'dataview'}>
			<u>A</u>dd New
		</Button>

		<Button
			block
			outline
			on:click={() => {
				location.href =
					"mailto:vistorian@inria.fr?subject=[Vistorian] Consultation Request&body=Hi, kindly I would like to arrange a 10-minutes meeting to consult about my data's visualization. Thank you.";
				trace.event('com_3', window.parent.location.pathname, 'bookmark_tool', 'consult_team');
			}}
		>
			<u>E</u>mail Us & Consult an Expert
		</Button>

		<Button
			block
			outline
			on:click={() => {
				location.href =
					'mailto:vistorian@inria.fr?subject=[Vistorian] Report Technical Bug &body=Hello,\n I am facing a technical problem and would like to request your help. The description of my problem is :\n';
				trace.event('com_4', window.parent.location.pathname, 'bookmark_tool', 'ReportTechBug');
			}}
		>
			Report a Technical B<u>u</u>g
		</Button>

		<div style="float: left; width: 45%">
			<Button outline on:click={exportBookmarks} style="width: 100%">
				E<u>x</u>port Bookmarks
			</Button>

			<Button outline on:click={toggleMySessionID} style="width: 100%">
				Show/<u>H</u>ide My Session ID
			</Button>
		</div>

		<div style="float: right; width: 45%">
			<Button outline on:click={importBookmarks} style="width: 100%">
				<u>I</u>mport Bookmarks
			</Button>

			<Button outline on:click={clearBookmarks} style="width: 100%">
				<u>C</u>lear Bookmarks
			</Button>
		</div>

		{#if showSessionID}
			<div style="display: inline-block;">
				<label
					id="loggingSessionID"
					style=" align-items: center;text-align: center; border-style:outset;padding: 5px;"
				>
					Your session id is: {localStorage.getItem('SessionLogId')}
				</label>
			</div>
		{/if}
	</div>
</main>

<style>
	div {
		margin: 10px;
	}
</style>
