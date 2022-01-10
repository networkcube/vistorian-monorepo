<script>
	import { Button, Card, CardBody, CardFooter } from 'sveltestrap';

	import FileSelector from './FileSelector.svelte';
	import FieldSelector from './FieldSelector.svelte';

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

<Card class="mb-3" style="width: 50%">
	<CardBody>
		<h3>What is the structure of this node table?</h3>

		<FileSelector bind:selectedFile={config.selectedFile} />

		{#if config.selectedFile}
			<br />
			<FieldSelector
				selectedFile={config.selectedFile}
				label={'Node'}
				bind:selectedField={config.fieldNode}
				required={true}
			/>

			<h3>Relations</h3>

			{#if config.fieldRelations.length === 0}
				You must define at least one relation type.
			{/if}

			<ul>
				{#each config.fieldRelations as fieldRelation, i}
					<li>
						<label>Relation name/link type: <input bind:value={fieldRelation.relation} /></label>
						<FieldSelector
							selectedFile={config.selectedFile}
							label={'Column in CSV file'}
							bind:selectedField={fieldRelation.field}
							required={true}
						/>
					</li>
					<button
						on:click={() =>
							(config.fieldRelations = config.fieldRelations.filter((d, i2) => i !== i2))}
					>
						Delete this relation
					</button>
				{/each}
			</ul>

			<button
				on:click={() =>
					(config.fieldRelations = [...config.fieldRelations, { relation: null, field: null }])}
			>
				Add relation
			</button>
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
