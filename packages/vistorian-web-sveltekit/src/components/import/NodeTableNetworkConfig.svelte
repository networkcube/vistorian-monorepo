<script>
	import { Button, Card, CardBody, CardHeader, CardFooter } from 'sveltestrap';

	import FileSelector from './FileSelector.svelte';
	import FieldSelector from './FieldSelector.svelte';
	import { trace } from '../../lib/trace';
	export let config = {
		selectedFile: null,
		fieldNode: null,
		fieldRelations: []
	};

	export let stage, previous_stage, next_stage;

	$: ready = config.selectedFile && config.fieldRelations.length > 0;
	$: {
		console.log('In NodeTableNetworkConfig:', config);
	}
</script>

<Card class="mb-3" style="width: 100%">
	<CardHeader>
		<h4>Specifying your node table</h4>
	</CardHeader>
	<CardBody>
		<h4>1. Upload your node table:</h4>
		<br />
		<FileSelector
			bind:selectedFile={config.selectedFile}
			on:click={() => {
				trace.event('dat_2_NT', 'data view', 'Upload File', 'Node Table');
			}}
		/>

		{#if config.selectedFile}
			<br />
			<FieldSelector
				selectedFile={config.selectedFile}
				label={'Node'}
				bind:selectedField={config.fieldNode}
				required={true}
				
				on:change={() => {
					trace.event('dat_11', 'Column Type Specified', 'Node', this.value);
				}}
			/>

			<br />
			<br />
			<h4>2. Specify relations</h4>
			<!-- <p>From the dropdowns below, select the columns in your link table.</p> -->

			{#if config.fieldRelations.length === 0}
				You must define at least one relation type.
			{/if}

			<ul>
				{#each config.fieldRelations as fieldRelation, i}
					<li style="margin-bottom:25px">
						<FieldSelector
							selectedFile={config.selectedFile}
							label={'Column:'}
							bind:selectedField={fieldRelation.field}
							required={true}
							on:change={() => {
								trace.event('dat_11', 'Column Type Specified', 'Relation Column', this.value);
							}}
						/>
						<label
							><span style="display: inline-block; width: 180px;"> Link name (type): </span>
							<input bind:value={fieldRelation.relation}  /></label
						>
						<br />
						<br />
						<Button
							outline
							size="sm"
							on:click={() =>
								(config.fieldRelations = config.fieldRelations.filter((d, i2) => i !== i2))}
						>
							Delete this relation
						</Button>
					</li>
				{/each}
			</ul>

			<Button
				outline
				on:click={() => {
					config.fieldRelations = [...config.fieldRelations, { relation: null, field: null }];
					trace.event('dat_11', 'data view', 'Node Table', 'Add Relation');
				}}
			>
				+ Add relation
			</Button>
		{:else}
			<p>You must select a file to import.</p>
		{/if}
	</CardBody>
	<CardFooter>
		<Button style="float: left" on:click={() => (stage = previous_stage())}>Previous</Button>
		<Button style="float: right" on:click={() => (stage = next_stage())} disabled={!ready}
			>Next</Button
		>
	</CardFooter>
</Card>
