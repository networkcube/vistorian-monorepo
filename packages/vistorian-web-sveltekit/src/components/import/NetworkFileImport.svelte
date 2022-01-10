<script>
	import { Button, Card, CardBody, CardFooter, CardText } from 'sveltestrap';
	import FileSelector from './FileSelector.svelte';

	export let fileFormat = 'network';
	export let config = {};
	export let stage, previous_stage, next_stage;
</script>

<Card class="mb-3" style="width: 50%">
	<CardBody>
		<CardText>
			Choose the file containing the network.

			<p>Currently, GEDCOM, PAJEK and GraphML (XML) formats are supported.</p>
		</CardText>

		<FileSelector
			bind:selectedFile={config.selectedFile}
			acceptedFormats=".ged,.paj,.xml,.graphml"
			parseAsCSV={false}
			showPreviewTable={false}
		/>
	</CardBody>
	<CardFooter>
		<Button style="float: left" on:click={() => (stage = previous_stage())}>Previous</Button>
		<Button
			style="float: right"
			on:click={() => (stage = next_stage())}
			disabled={!config.selectedFile}>Next</Button
		>
	</CardFooter>
</Card>
