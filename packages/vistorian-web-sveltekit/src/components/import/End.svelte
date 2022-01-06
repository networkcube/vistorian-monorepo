<script>
	import { Button, Card, CardBody, CardFooter } from 'sveltestrap';

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

<Card class="mb-3" style="width: 50%">
	<CardBody>
		<h2>Import and view network</h2>

		<div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;">
			<div>
				<img src="vis_icons/node-link.png" height="75px" on:click={() => loadVis('nodelink')} />
				<p>Node link</p>
			</div>

			<div>
				<img src="vis_icons/matrix.png" height="75px" on:click={() => loadVis('matrix')} />
				<p>Matrix</p>
			</div>

			<div>
				<img src="vis_icons/dynamicego.png" height="75px" on:click={() => loadVis('dynamicego')} />
				<p>Timeline</p>
			</div>

			<div>
				<img src="vis_icons/map.png" height="75px" on:click={() => loadVis('map')} />
				<p>Map</p>
			</div>
		</div>

		<h3>or</h3>

		<Button on:click={() => saveNetwork(settings, $fileStore, reloadNetworks)}
			>Just import network</Button
		>
	</CardBody>
	<CardFooter>
		<Button style="float: left" on:click={() => (stage = previous_stage())}>Previous</Button>
	</CardFooter>
</Card>
