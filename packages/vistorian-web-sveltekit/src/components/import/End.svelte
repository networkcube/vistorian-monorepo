<script>
	import { Button, Card, CardBody, CardHeader, CardFooter } from 'sveltestrap';

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
	}

	function saveNetwork(settings, $fileStore, reloadNetworks) {
		if (!hasImported) {
			importNetwork(settings, $fileStore, reloadNetworks);
		}
		hasImported = true;
	}

	function importNetwork(settings, $fileStore, reloadNetworks) {
		if (settings.fileFormat === 'tabular') {
			importNetworkFromTables(settings, $fileStore, reloadNetworks);
		}

		if (settings.fileFormat === 'network') {
			importNetworkFromFile(settings, $fileStore, reloadNetworks);
		}
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
				<img src="figures/nodelink.png" on:click={() => loadVis('nodelink')} />
				<!-- <img src="vis_icons/node-link.png" height="100px" on:click={() => loadVis('nodelink')} /> -->
				<p>Node link</p>
			</div>

			<div>
				<img src="figures/matrix.png" on:click={() => loadVis('matrix')} />
				<!-- <img src="vis_icons/matrix.png" height="100px" on:click={() => loadVis('matrix')} /> -->
				<p>Matrix</p>
			</div>

			<div>
				<img src="figures/dynamicego.png" on:click={() => loadVis('dynamicego')} />
				<!-- <img src="vis_icons/dynamicego.png" height="100px" on:click={() => loadVis('dynamicego')} /> -->
				<p>Timeline</p>
			</div>

			<div>
				<img src="figures/map.png" on:click={() => loadVis('map')} />
				<!-- <img src="vis_icons/map.png" height="100px" on:click={() => loadVis('map')} /> -->
				<p>Map</p>
			</div>
		</div>

		<br />
		<br />
		<h4>Or, import another network:</h4>
		<br />
		<Button
			outline
			on:click={() => {
				saveNetwork(settings, $fileStore, reloadNetworks);
				stage = 'name';
			}}>+ Create new network</Button
		>
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
