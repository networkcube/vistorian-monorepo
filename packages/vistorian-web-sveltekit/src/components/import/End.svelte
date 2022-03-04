<script>
	import { Button, Card, CardBody, CardHeader, CardFooter } from 'sveltestrap';
	import { onMount } from 'svelte';
	import * as main from 'vistorian-core/src/data/main';
	import { trace } from '../../lib/trace';
	import { fileStore } from './stores.js';

	import { importNetworkFromTables, importNetworkFromFile } from './import_network';
	import { getUrlVars } from '$lib/utils';
	export let settings, reloadNetworks, stage, previous_stage, next_stage;

	async function loadVis(visName) {
		const SESSION_NAME = getUrlVars()['session'];

		if (!hasImported) {
			await importNetwork(settings, $fileStore, reloadNetworks);
		}
		window.location.href = `./${visName}?session=${SESSION_NAME}&datasetName=${settings.name}`;
		hasImported = true;
		const dgraph = main.getDynamicGraph();
		const num_visible_nodes = dgraph.nodes().visible().toArray().length;
		trace.event('dat_19', 'Network size', 'visible nodes', num_visible_nodes);
		const num_visible_links = dgraph.links().visible().toArray().length;
		trace.event('dat_19', 'Network size', 'visible links', num_visible_links);
	}

	async function saveNetwork(settings, $fileStore, reloadNetworks) {
		if (!hasImported) {
			await importNetwork(settings, $fileStore, reloadNetworks);
		}
		hasImported = true;
	}

	async function importNetwork(settings, $fileStore, reloadNetworks) {
		if (settings.fileFormat === 'tabular') {
			await importNetworkFromTables(settings, $fileStore, reloadNetworks);
		}

		if (settings.fileFormat === 'network') {
			await importNetworkFromFile(settings, $fileStore, reloadNetworks);
		}
	}

	async function saveNetworkWithoutLoadingVis() {
		await saveNetwork(settings, $fileStore, reloadNetworks);
		stage = 'name';
		hasImported = false;
	}

	let hasImported = false;
</script>

<Card class="mb-3" style="width: 100%">
	<CardHeader>
		<h4>You are all set!</h4>
		<h6>Your network has been imported successfully</h6>
	</CardHeader>
	<CardBody>
		<h4>Select a visualization and start exploring:</h4>
		<br />

		<div id="visOptions" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;">
			<div>
				<img
					src="/figures/nodelink.png"
					on:click={() => {
						loadVis('nodelink');
						trace.event('vis_1', 'data view', 'Create Visualization', 'Node-link');
					}}
				/>
				<!-- <img src="vis_icons/node-link.png" height="100px" on:click={() => loadVis('nodelink')} /> -->
				<p>Node link</p>
			</div>

			<div>
				<img
					src="/figures/matrix.png"
					on:click={() => {
						loadVis('matrix');
						trace.event('vis_1', 'data view', 'Create Visualization', 'Matrix');
					}}
				/>
				<!-- <img src="vis_icons/matrix.png" height="100px" on:click={() => loadVis('matrix')} /> -->
				<p>Matrix</p>
			</div>

			<div>
				<img
					src="/figures/dynamicego.png"
					on:click={() => {
						loadVis('dynamicego');
						trace.event('vis_1', 'data view', 'Create Visualization', 'Timeline');
					}}
				/>
				<!-- <img src="vis_icons/dynamicego.png" height="100px" on:click={() => loadVis('dynamicego')} /> -->
				<p>Timeline</p>
			</div>

			<div>
				<img
					src="/figures/map.png"
					on:click={() => {
						loadVis('map');
						trace.event('vis_1', 'data view', 'Create Visualization', 'Map');
					}}
				/>
				<!-- <img src="vis_icons/map.png" height="100px" on:click={() => loadVis('map')} /> -->
				<p>Map</p>
			</div>

			<div>
				<img
					src="/figures/nl+mat.png"
					on:click={() => {
						loadVis('mat-nl');
						trace.event('vis_1', 'data view', 'Create Visualization', 'Mat+Nl');
					}}
				/>
				<!-- <img src="vis_icons/map.png" height="100px" on:click={() => loadVis('map')} /> -->
				<p>Node-Link &amp; map</p>
			</div>
		</div>

		<br />
		<br />
		<h4>Or, import another network:</h4>
		<br />
		<Button outline on:click={() => saveNetworkWithoutLoadingVis()}>+ Create new network</Button>
		<br />
		<br />
	</CardBody>
	<CardFooter>
		<Button style="float: left" on:click={() => (stage = previous_stage())}>Previous</Button>
	</CardFooter>
</Card>

<style>
	#visOptions img {
		height: 160px;
		padding: 0px;
	}
	#visOptions div {
		text-align: center;
		border: 2px solid #eee;
		border-radius: 5px;
		padding-top: 0px;
		margin-right: 20px;
	}
	#visOptions p {
		font-size: 1.2em;
		margin-top: 10px;
		/* margin-bottom: -15px; */
	}
	#visOptions img {
		cursor: pointer;
	}
</style>
