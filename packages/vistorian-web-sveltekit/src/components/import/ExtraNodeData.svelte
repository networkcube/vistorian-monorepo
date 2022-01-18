<script>
	import { Button, Card, CardBody, CardFooter } from 'sveltestrap';

	import FileSelector from './FileSelector.svelte';
	import FieldSelector from './FieldSelector.svelte';

	export let config, stage, previous_stage, next_stage;

	$: ready =
		!config.hasMetadata ||
		(config.hasMetadata &&
			config.selectedFile &&
			config.fieldNodeId !== null &&
			config.fieldNodeType !== null);
</script>

<Card class="mb-3" style="width: 50%">
	<h4>Do you have an extra file recording node types?</h4>

	<CardBody>
		<input type="radio" bind:group={config.hasMetadata} value={true} />
		Yes, I have a file recording the type for each node.
		<br />

		<input type="radio" bind:group={config.hasMetadata} value={false} />
		No, I do not have a file recording the type for each node.
		<br />

		{#if config.hasMetadata}
			<FileSelector bind:selectedFile={config.selectedFile} />
			<br />

			{#if config.selectedFile}
				<FieldSelector
					selectedFile={config.selectedFile}
					label={'Node ID'}
					bind:selectedField={config.fieldNodeId}
					required={true}
				/>
				<br />
				<FieldSelector
					selectedFile={config.selectedFile}
					label={'Node type'}
					bind:selectedField={config.fieldNodeType}
					required={true}
				/>
			{/if}
		{/if}
	</CardBody>
	<CardFooter>
		<Button style="float: left" on:click={() => (stage = previous_stage())}>Previous</Button>
		<Button style="float: right" on:click={() => (stage = next_stage())} disabled={!ready}
			>Next</Button
		>
	</CardFooter>
</Card>
