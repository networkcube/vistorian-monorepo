<script>
	import { Button, Card, CardBody, CardFooter, CardHeader } from 'sveltestrap';

	import FileSelector from './FileSelector.svelte';
	import FieldSelector from './FieldSelector.svelte';
	import EdgeTimeSelector from './EdgeTimeSelector.svelte';
	import { trace } from '../../lib/trace';

	export let config, stage, previous_stage, next_stage;

	$: ready =
		config.edgesAreDirected !== null &&
		config.selectedFile &&
		config.fieldSourceId !== null &&
		config.fieldTargetId !== null &&
		(config.timeConfig.edgeTimeType == null ||
			(config.timeConfig.formatString && config.timeConfig.timeField !== null));
	// TODO: check location set

	$: console.log(config);
</script>

<Card class="mb-3" style="width: fit-content">
	<CardHeader>
		<h4>Specifying your link table</h4>
	</CardHeader>
	<CardBody>
		<h4>
			1. Are links <i>directed</i>?
		</h4>
		<p>
			Doses it matter which node is the <b>source</b>, and which is the
			<b>target</b>?
		</p>

		<input
			type="radio"
			bind:group={config.edgesAreDirected}
			value={true}
			on:click={() => {
				trace.event('dat_12', 'data view', 'directed checkbox', 'True');
			}}
		/>
		Yes
		<br />

		<input
			type="radio"
			bind:group={config.edgesAreDirected}
			value={false}
			on:click={() => {
				trace.event('dat_12', 'data view', 'directed checkbox', 'False');
			}}
		/>
		No

		<br />
		<br />

		<!-- <h5>What is the structure of your link table?</h5> -->
		<h4>2. Upload your table</h4>
		<br />

		<FileSelector bind:selectedFile={config.selectedFile} />

		{#if config.selectedFile}
			<br />
			<br />
			<h4>2. What is the structure of your link table?</h4>
			<p>From the dropdowns below, select the columns in your link table.</p>
			<br />
			<h5>Required fields:</h5>

			<FieldSelector
				selectedFile={config.selectedFile}
				label={'Source node label:*'}
				bind:selectedField={config.fieldSourceId}
				required={true}
				on:change={() => {
					if (this.selectedField) {
						trace.event('dat_11', 'Column Type Specified', this.label, this.selectedField);
					}
				}}
			/>
			<br />

			<FieldSelector
				selectedFile={config.selectedFile}
				label={'Target node label:*'}
				bind:selectedField={config.fieldTargetId}
				required={true}
				on:change={() => {
					if (this.selectedField) {
						trace.event('dat_11', 'Column Type Specified', 'Target node', config.fieldTargetId);
					}
				}}
			/>

			<br />
			<br />
			<h5>Optional fields:</h5>

			<FieldSelector
				selectedFile={config.selectedFile}
				label={'Link ID:'}
				bind:selectedField={config.fieldLinkId}
			/>
			<br />

			<FieldSelector
				selectedFile={config.selectedFile}
				label={'Location of source node:'}
				bind:selectedField={config.fieldLocationSource}
			/>
			<br />

			<FieldSelector
				selectedFile={config.selectedFile}
				label={'Location of target node:'}
				bind:selectedField={config.fieldLocationTarget}
			/>
			<br />

			<FieldSelector
				selectedFile={config.selectedFile}
				label={'Link weight:'}
				helpText={'A numerical measure of the strength of connection between nodes (e.g., the travel time between two locations, the value of a cash transfer.)'}
				bind:selectedField={config.fieldWeight}
			/>
			<br />

			<FieldSelector
				selectedFile={config.selectedFile}
				label={'Link type:'}
				bind:selectedField={config.fieldLinkType}
			/>
			<br />

			{#if config.edgesAreDirected}
				<FieldSelector
					selectedFile={config.selectedFile}
					label={'Whether a link is directed:'}
					bind:selectedField={config.fieldLinkIsDirected}
				/>
				<br />
			{/if}

			<br />
			<br />
			<EdgeTimeSelector selectedFile={config.selectedFile} bind:config={config.timeConfig} />
		{/if}
	</CardBody>
	<CardFooter>
		<Button style="float: left" on:click={() => (stage = previous_stage())}>Previous</Button>
		<Button style="float: right" on:click={() => (stage = next_stage())} disabled={!ready}
			>Next</Button
		>
	</CardFooter>
</Card>
