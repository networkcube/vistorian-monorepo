<script>
	import Papa from 'papaparse';

	import Dropzone from 'svelte-file-dropzone';

	import { fileStore } from './stores.js';
	import TablePreview from './TablePreview.svelte';
	import { trace } from '../../lib/trace';

	let fileList;
	$: fileList = Object.keys($fileStore);

	export let selectedFile = null;

	export let showPreviewTable = true;
	export let acceptedFormats = '.csv';
	export let parseAsCSV = true;

	let hasHeaderRow = false;

	function handleFilesSelect(e) {
		const { acceptedFiles, fileRejections } = e.detail;

		console.log('Seleted:', e.detail);

		for (const f of acceptedFiles) {
			// has a .path and .name

			console.log(`Uploaded file: ${f}`);

			if (parseAsCSV) {
				Papa.parse(f, {
					header: false,
					complete: function (results) {
						// TODO: get list of columns
						// TODO: save the uploaded data to a store

						fileStore.update((oldFileStore) => ({
							...oldFileStore,
							[f.name]: { data: results.data, hasHeaderRow: hasHeaderRow }
						}));

						selectedFile = f.name;
					}
				});
			} else {
				f.text().then((res) => {
					fileStore.update((oldFileStore) => ({
						...oldFileStore,
						[f.name]: { data: res, hasHeaderRow: hasHeaderRow }
					}));

					selectedFile = f.name;
				});
			}
		}
	}

	$: {
		if (selectedFile) {
			$fileStore[selectedFile].hasHeaderRow = hasHeaderRow;
		}
	}
</script>

<div class="fileSelector">
	Select a previously uploaded file:
	<select bind:value={selectedFile}>
		{#each Object.keys($fileStore) as file}
			<option value={file}>{file}</option>
		{/each}
	</select>

	<br />

	<b>or</b>
	<Dropzone on:drop={handleFilesSelect} accept={acceptedFormats}>
		<p>Upload a new file</p>
	</Dropzone>
</div>

{#if selectedFile && showPreviewTable}
	<label id="headerCheckbox">
		<input
			type="checkbox"
			bind:checked={hasHeaderRow}
			on:click={() => {
				trace.event('dat_2', 'data view', 'table has header', this.value);
			}}
		/> Has header row?
	</label>

	<TablePreview data={$fileStore[selectedFile].data} {hasHeaderRow} />
{/if}

<style>
	#headerCheckbox {
		font-weight: bold;
		padding-bottom: 0.25em;
	}

	.fileSelector {
		font-weight: 100;
		font-size: 12pt;
		background-color: #eee;
		border-style: none;
		padding: 5px;
		padding: 20px;
		padding-top: 20px;
		border-radius: 10px;
		padding-top: 10px;

		width: max-content;
		margin-bottom: 1em;
	}
</style>
