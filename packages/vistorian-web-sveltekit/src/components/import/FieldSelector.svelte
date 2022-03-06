<script>
	import Fa from 'svelte-fa';
	import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
	import { Button } from 'sveltestrap';

	import { fileStore } from './stores.js';
	import { trace } from '../../lib/trace';

	export let selectedFile;
	export let helpText = '';

	let fields;
	let hasHeaderRow;
	$: hasHeaderRow = $fileStore[selectedFile].hasHeaderRow;

	let firstDataRow;
	$: {
		let firstRow = $fileStore[selectedFile].data[0];

		if (hasHeaderRow) {
			fields = firstRow;
			firstDataRow = $fileStore[selectedFile].data[1];
		} else {
			fields = Object.keys(firstRow);
			firstDataRow = $fileStore[selectedFile].data[0];
		}
	}

	export let label = '';
	export let selectedField = null;
	export let required = false;

	$: {
		console.log($fileStore[selectedFile].data[0]);
	}

	let showHelp = false;
</script>

<label style="margin-bottom:10px;">
	<span style="display: inline-block; width: 180px;">
		{label}

		{#if helpText}
			<Button
				size="sm"
				outline
				on:click={() => {
					console.log(`showHelp is ${showHelp}`);
					showHelp = !showHelp;
				}}
			>
				<Fa icon={faQuestionCircle} />
			</Button>
		{/if}
	</span>

	<select
		bind:value={selectedField}
		on:change={() => {
			if (selectedField) {
				trace.event('dat_11', 'Column Type Specified', label, selectedField);
			}
		}}
	>
		{#if !required}
			<option value={null}>-</option>
		{/if}
		{#each fields as field, i}
			<option value={i}>{field} (first value is "{firstDataRow[i]}")</option>
		{/each}
	</select>

	{#if showHelp}
		<p class="help">{helpText}</p>
	{/if}
</label>

<style>
	.help {
		margin-left: 2em;
	}
</style>
