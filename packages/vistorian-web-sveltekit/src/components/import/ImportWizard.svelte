<script>
	// Refer to the documentation at https://vistorian.github.io/formattingdata.html

	import { Button, Card, CardHeader, CardBody, CardFooter } from 'sveltestrap';

	import End from './End.svelte';
	import NetworkFormat from './NetworkFormat.svelte';
	import NetworkFileImport from './NetworkFileImport.svelte';
	import LinkDataType from './LinkDataType.svelte';
	import LinkTableConfig from './LinkTableConfig.svelte';
	import NodeTableNetworkConfig from './NodeTableNetworkConfig.svelte';
	import ExtraNodeDate from './ExtraNodeData.svelte';
	import LocationTableConfig from './LocationTableConfig.svelte';


	export let reloadNetworks;

	let settings = {
		name: '',
		fileFormat: 'tabular',
		linkDataType: null,

		networkFileConfig: {
			selectedFile: null
		},

		nodeTableConfig: {
			selectedFile: null,
			fieldNode: null,
			fieldRelations: []
		},

		linkTableConfig: {
			edgesAreDirected: null,

			selectedFile: null,

			fieldLinkId: null,
			fieldSourceId: null,
			fieldTargetId: null,

			fieldLocationSource: null,
			fieldLocationTarget: null,
			fieldWeight: null,
			fieldLinkType: null,
			fieldLinkIsDirected: null,

			timeConfig: {
				edgeTimeType: null,
				selectedFile: null,

				startTimeField: null,
				endTimeField: null,
				timeField: null,

				formatString: '%d/%m/%Y'
			}
		},

		locationTableConfig: {
			selectedFile: null,
			usingLocationFile: false,
			fieldPlaceName: null,
			fieldLat: null,
			fieldLon: null
		},

		// TODO?
		nodeLocationConfig: {
			locationFormat: '',
			fieldPlaceName: null,
			fieldLat: null,
			fieldLon: null,
			fieldX: null,
			fieldY: null
		},

		nodeMetadataConfig: {
			hasMetadata: false,
			selectedFile: null,
			fieldNodeId: null,
			fieldNodeType: null

			//	fieldLabel: null,
			//	fieldColor: null,
			//	selectedFile: null
		}
	};

	$: {
		console.log(settings);
	}

	const setName = () => {
		settings.name = settings.name.trim().replace(/ /g, '_').replace(/[\W]+/g, '');
	};

	let stage = 'name',
		previousStages = [];
</script>

<h3>Network data import wizard</h3>
<br />
{#if stage === 'name'}
	<Card class="mb-3" style="width: 100%">
		<CardHeader>
			<h4>Enter a name for your network:</h4>
		</CardHeader>
		<CardBody>
			<input bind:value={settings.name} on:blur={setName} />
		</CardBody>

		<CardFooter>
			<Button
				style="float: right"
				disabled={!settings.name}
				on:click={() => {
					previousStages.push('name');
					stage = 'network_format';
				}}
			>
				Next
			</Button>
		</CardFooter>
	</Card>
{:else if stage === 'network_format'}
	<NetworkFormat
		bind:stage
		next_stage={() => {
			previousStages.push(stage);
			return settings.fileFormat;
		}}
		previous_stage={() => previousStages.pop()}
		bind:fileFormat={settings.fileFormat}
	/>
{:else if stage === 'network'}
	<NetworkFileImport
		bind:stage
		bind:config={settings.networkFileConfig}
		previous_stage={() => previousStages.pop()}
		next_stage={() => {
			previousStages.push(stage);
			return 'end';
		}}
	/>
{:else if stage === 'tabular'}
	<LinkDataType
		bind:linkDataType={settings.linkDataType}
		bind:stage
		previous_stage={() => previousStages.pop()}
		next_stage={() => {
			previousStages.push(stage);
			return settings.linkDataType;
		}}
	/>
{:else if stage === 'linkTable'}
	<LinkTableConfig
		bind:config={settings.linkTableConfig}
		bind:stage
		previous_stage={() => previousStages.pop()}
		next_stage={() => {
			previousStages.push(stage);
			return settings.linkTableConfig.fieldLocationSource ||
				settings.linkTableConfig.fieldLocationTarget
				? 'location_table'
				: 'extraNodeData';
		}}
	/>
{:else if stage === 'extraNodeData'}
	<ExtraNodeDate
		bind:config={settings.nodeMetadataConfig}
		bind:stage
		previous_stage={() => previousStages.pop()}
		next_stage={() => {
			previousStages.push(stage);
			return 'end';
		}}
	/>
{:else if stage === 'nodeTable'}
	<NodeTableNetworkConfig
		bind:config={settings.nodeTableConfig}
		bind:stage
		previous_stage={() => previousStages.pop()}
		next_stage={() => {
			previousStages.push(stage);
			return 'end';
		}}
	/>
{:else if stage === 'location_table'}
	<LocationTableConfig
		bind:config={settings.locationTableConfig}
		bind:stage
		previous_stage={() => previousStages.pop()}
		next_stage={() => {
			previousStages.push(stage);
			return 'extraNodeData';
		}}
	/>
{:else if stage === 'end'}
	<End
		bind:settings
		bind:stage
		previous_stage={() => previousStages.pop()}
		next_stage={() => {
			previousStages.push(stage);
			return null;
		}}
		{reloadNetworks}
	/>
{/if}

<style>
	input {
		width: 100%;
		margin-top: 20px;
		margin-bottom: 20px;
	}
</style>
