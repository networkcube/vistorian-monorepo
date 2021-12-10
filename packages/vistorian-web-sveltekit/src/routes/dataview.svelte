<script>
	import { onMount } from 'svelte';

	import { trace } from '../lib/trace';

	import { Button } from 'sveltestrap';

	import Fa from 'svelte-fa';
	import { faPlus, faRedo } from '@fortawesome/free-solid-svg-icons';

	import Bookmarks from '../components/Bookmarks.svelte';
	import Feedback from '../components/Feedback.svelte';
	import Footer from '../components/Footer.svelte';
	import ImportWizard from '../components/import/ImportWizard.svelte';

	import * as storage from '../lib/storage';
	import { getUrlVars } from '../lib/utils';
	import * as main from 'vistorian-core/src/data/main';

	// TODO: default to selectng first network

	let selectedNetwork = null;
	let state = null;

	// This replaces a jQuery $(document).ready()
	let SESSION_NAME,
		params,
		networks = [];

	const reloadNetworks = () => {
		networks = storage
			.getNetworkIds(SESSION_NAME)
			.map((id) => storage.getNetwork(id, SESSION_NAME));
	};

	onMount(async () => {
		trace.event('log_2', 'load', 'webpage', document.location.pathname);

		SESSION_NAME = getUrlVars()['session'];
		reloadNetworks();

		const datasetName = getUrlVars()['datasetName'];
		const nets = networks.filter((n) => n.name === datasetName);
		if (nets.length > 0) {
			selectedNetwork = nets[0];
		}
	});

	const deleteNetwork = (network) => {
		if (!confirm('Are you sure you want to delete this network?')) {
			return;
		}

		// const currentNetwork = storage.getNetwork(network.id, SESSION_NAME);

		// removes the network from the vistorian front-ed
		storage.deleteNetwork(network, SESSION_NAME);

		// update list of networks in UI
		reloadNetworks();

		// deletes the network from the networkcube
		main.deleteData(network.name);

		// log
		trace.event('dat_4', 'data view', 'selected network', 'deleted');
	};

	const exportNetwork = (network) => {
		const element = document.createElement('a');
		element.setAttribute(
			'href',
			'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(network))
		);
		element.setAttribute('download', network.name + '.vistorian');
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);

		trace.event('dat_7', 'data view', 'selected network', 'downloaded');
	};

	const clearCache = () => {
		const msg =
			'Are you sure you want to clear the cache? This will remove ALL your networks and tables from your browser cache. FOREVER.';
		if (!confirm(msg)) {
			return;
		}

		const sessionLogId = localStorage.getItem('SessionLogId');
		localStorage.clear();
		localStorage.getItem(sessionLogId);

		trace.event('dat_5', 'data view', 'browser cache', 'cleared');

		location.reload();
	};

	const truncateName = (networkName) => {
		return networkName.length <= 15 ? networkName : networkName.slice(0, 15) + '...';
	};

	const createNetwork = () => {
		state = 'NEW_NETWORK';
		selectedNetwork = null;

		trace.event('dat_1', 'data view', 'new network', 'created');
	};
</script>

<svelte:head>
	<title>Data view</title>
</svelte:head>

<svelte:body
	on:error={(event, source, lineno, colno, error) =>
		trace.event('err', event + ' ' + source + ' ' + lineno, error, document.location.pathname)}
	on:beforeunload={() => trace.event('log_12', 'page', 'close', document.location.pathname)} />

<main>
	<div style="display: grid; grid-template-columns: 300px 1fr;">
		<div id="lists" xs="2">
			<div id="menu">
				<a href="/"><img width="250px" src="../logos/logo-networkcube.png" /></a>
			</div>

			<Button
				on:click={createNetwork}
				title="Create new network from one or more tables."
				color="success"
			>
				<Fa icon={faPlus} />
				Add network
			</Button>

			<br />

			<div id="networkListDiv">
				<h2>My Networks</h2>
				<p>
					These are the networks that you have already created. Click any of them then select a
					visualization below.
				</p>

				<ul id="networkList" class="nointent" />

				{#each networks as network}
					<li
						style={`font-weight: ${
							selectedNetwork && selectedNetwork.id === network.id ? 'bold' : 'normal'
						}`}
					>
						<a on:click={() => (selectedNetwork = network)}>{truncateName(network.name)}</a>
						<img
							class="controlIcon"
							title="Delete this network."
							src="../logos/delete.png"
							on:click={() => deleteNetwork(network)}
						/>
						<img
							class="controlIcon"
							title="Download this network in .vistorian format."
							src="../logos/download.png"
							on:click={() => exportNetwork(network)}
						/>
					</li>
				{/each}
			</div>
			<br />

			<div>
				<h2>Visualizations</h2>
				{#if selectedNetwork}
					<ul class="vis-types">
						<li>
							<a href="./nodelink?session=0&datasetName={selectedNetwork.name}">
								<img src="vis_icons/node-link.png" width="75px" /> Node-link
							</a>
						</li>
						<li>
							<a href="./matrix?session=0&datasetName={selectedNetwork.name}">
								<img src="vis_icons/matrix.png" width="75px" /> Adjacency matrix
							</a>
						</li>
						<li>
							<a href="./dynamicego?session=0&datasetName={selectedNetwork.name}">
								<img src="vis_icons/dynamicego.png" width="75px" /> Timeline
							</a>
						</li>
						<li>
							<a href="./map?session=0&datasetName={selectedNetwork.name}">
								<img src="vis_icons/map.png" width="75px" /> Map
							</a>
						</li>
					</ul>
				{:else}
					<p>First select a network.</p>
					<ul style="opacity: 0.4" class="vis-types">
						<li>
							<img src="vis_icons/node-link.png" width="75px" /> Node-link
						</li>
						<li>
							<img src="vis_icons/matrix.png" width="75px" /> Adjacency matrix
						</li>
						<li>
							<img src="vis_icons/dynamicego.png" width="75px" /> Timeline
						</li>
						<li>
							<img src="vis_icons/map.png" width="75px" /> Map
						</li>
					</ul>
				{/if}
			</div>

			<div>
				<Button
					title="This will remove ALL your networks and tables from your browser cache. FOREVER. Use this function if your browser stops responding. "
					on:click={clearCache}
					outline
					color="danger"
				>
					<Fa icon={faRedo} /> Empty browser cache</Button
				>
			</div>
			<br />
			<div class="helpSidebar">
				<h2><span> Quick Help</span></h2>
				<ul style="list-style-type:disc;">
					<li>
						<a
							href="https://vistorian.github.io/formattingdata.html"
							on:click={() => trace.event('hlp_8', 'dataview', 'tutorials', 'click')}
							target="_blank">Formatting data</a
						>
					</li>

					<li>
						<a
							href="https://vistorian.github.io/visualizations.html"
							on:click={() => trace.event('hlp_8', 'dataview', 'tutorials', 'click')}
							target="_blank">Visualization features</a
						>
					</li>
				</ul>
			</div>
		</div>

		<div id="center">
			{#if state === 'NEW_NETWORK'}
				<ImportWizard {reloadNetworks} />
			{/if}
		</div>
	</div>

	<Footer />

	<Bookmarks />

	<Feedback />
</main>

<style>
	img.controlIcon {
		height: 10px;
		margin-left: 10px;
		cursor: pointer;
	}

	.vis-types > li {
		margin-top: 0.25em;
	}
</style>
