<script>
	import { Button, Card, CardBody, CardHeader, CardFooter } from 'sveltestrap';

	import FileSelector from './FileSelector.svelte';
	import FieldSelector from './FieldSelector.svelte';

	export let config, stage, previous_stage, next_stage;

	let ready;
	$: ready =
		!config.usingLocationFile || (config.fieldPlaceName && config.fieldLat && config.fieldLon);
</script>

<Card class="mb-3" style="width: fit-content">
	<CardHeader>
		<h4>Specifying location table</h4>
	</CardHeader>

	<CardBody>
		<h4>Do you have a file giving the lat/long of each location?</h4>
		<br />

		<h5>No, ...</h5>
		<input type="radio" bind:group={config.usingLocationFile} value={false} />... I do not have a
		file specifying the longitude and latitude of place names. I want the Vistorian to get these for
		me, please.

		<br />
		<br />

		<h5>Yes, ...</h5>
		<input type="radio" bind:group={config.usingLocationFile} value={'true'} /> ... I have a file
		specifying the longitude and latitude of each place name used in the node-link table.

		<br />

		{#if config.usingLocationFile}
			<FileSelector bind:selectedFile={config.selectedFile} />
			<br />
		{/if}

		{#if config.selectedFile}
			<FieldSelector
				selectedFile={config.selectedFile}
				label={'Place name'}
				bind:selectedField={config.fieldPlaceName}
				required={true}
			/>
			<br />
			<FieldSelector
				selectedFile={config.selectedFile}
				label={'Latitude'}
				bind:selectedField={config.fieldLat}
				required={true}
			/>
			<br />
			<FieldSelector
				selectedFile={config.selectedFile}
				label={'Longitude'}
				bind:selectedField={config.fieldLon}
				required={true}
			/>
		{/if}
	</CardBody>
	<CardFooter>
		<Button style="float: left" on:click={() => (stage = previous_stage())}>Previous</Button>
		<Button style="float: right" on:click={() => (stage = next_stage())}>Next</Button>
	</CardFooter>
</Card>
