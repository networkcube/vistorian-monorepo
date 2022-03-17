<script>
	import { onMount } from 'svelte';
	import Grid from 'gridjs-svelte';

	import { trace } from '../lib/trace';

	import { Button } from 'sveltestrap';

	import Fa from 'svelte-fa';
	import { faPlus, faRedo, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

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

	let linkData = [],
		linkColumns = [],
		nodeData = [],
		nodeColumns = [],
		nodeSchema = {};

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

	const selectNetwork = (networkName) => {
		selectedNetwork = networkName;
		state = '';
	};

	const launchNetworkNarratives = () => {
		const url = "http://localhost:8090/external.html";

		const w = window.open(url, "_blank");

		// using a fixed delay to wait for the page to have loaded is a hack, but is the simplest solution for now
		new Promise(resolve => setTimeout(resolve, 2000)).then(() => {
			const msg = {
				...selectedNetwork,
				nodeSchema,
				nodeTable: nodeData
			}
			w.postMessage(msg, "*");
		});
	};


	$: {
		if (selectedNetwork) {
			const dgraph = main.getDynamicGraph(selectedNetwork.name, SESSION_NAME);
			const nodes = dgraph.nodes().toArray();

			const nodesHaveTypes = nodes.some((n) => n.nodeType());

			if (nodesHaveTypes) {
				nodeColumns = ['id', 'label', 'node type'];

				nodeSchema = {
					"name": "nodeSchema",
					"relation": [],
					"location": -1,
					"id": 0,
					"label": 1,
					"time": -1,
					"nodeType": 2
				};


				nodeData = nodes.map((n) => [n.id(), n.label() || '', n.nodeType() || '']);
				// N.B. we need to replace any nulls with empty string for sort to work
			} else {
				nodeColumns = ['id', 'label'];

				nodeSchema = {
					"name": "nodeSchema",
					"relation": [],
					"location": -1,
					"id": 0,
					"label": 1,
					"time": -1,
					"nodeType": -1
				};

				nodeData = nodes.map((n) => [n.id(), n.label() || '']);
			}

			let links = dgraph.links().toArray();
			linkData = links.map((l) => [
				l._id,
				l.source.id(),
				l.source.label(),
				l.target.id(),
				l.target.label(),
				l.linkType(),
				l.times().toArray()[0].time().toUTCString()
			]);
			linkColumns = [
				'Link id',
				'Source ID',
				'Source label',
				'Target ID',
				'Target Label',
				'Link type',
				'Date'
			];
		}
	}
</script>

<svelte:head>
	<title>Data view</title>
</svelte:head>

<svelte:body
	on:error={(event, source, lineno, colno, error) =>
		trace.event('err', event + ' ' + source + ' ' + lineno, error, document.location.pathname)}
	on:beforeunload={() => trace.event('log_12', 'page', 'close', document.location.pathname)} />

<div id="divMain">
	<!-- svelte-ignore component-name-lowercase -->
	<main>
		<div style="display: grid; grid-template-columns: 300px 1fr;">
			<div id="lists" xs="2">
				<div id="menu">
					<a href="/"> <img width="250px" src="../logos/logo-networkcube.png" /></a>
				</div>

				<div id="networkListDiv" class="boxed">
					<h3>My Networks</h3>
					<p>Create or select a network to visualize.</p>
					<div id="divAddNetwork">
						<Button
							size="sm"
							on:click={createNetwork}
							title="Create new network from one or more tables."
						>
							<Fa icon={faPlus} />
							Create network
						</Button>
					</div>

					<ul id="networkList" class="nointent" />

					{#each networks as network}
						<li
							style={`font-weight: ${
								selectedNetwork && selectedNetwork.id === network.id ? 'bold' : 'normal'
							}`}
						>
							<a on:click={() => selectNetwork(network)}>{truncateName(network.name)}</a>
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

				<div id="divVisualizations" class="boxed">
					<h3>Visualizations</h3>
					{#if selectedNetwork}
						<ul class="vis-types">
							<li>
								<a
									href="/nodelink?session=0&datasetName={selectedNetwork.name}"
									target="blank"
									on:click={() => {
										trace.event('vis_1', 'data view', 'Create Visualization', 'Node-link');
									}}
								>
									<img src="/figures/nodelink.png" width="75px" />
									Node-link
									<!-- <img src="vis_icons/node-link.png" width="75px" />Node-link -->
								</a>
							</li>
							<li>
								<a
									href="/matrix?session=0&datasetName={selectedNetwork.name}"
									target="blank"
									on:click={() => {
										trace.event('vis_1', 'data view', 'Create Visualization', 'Matrix');
									}}
								>
									<img src="/figures/matrix.png" width="75px" />
									Matrix
									<!-- <img src="vis_icons/matrix.png" width="75px" />Adjacency matrix -->
								</a>
							</li>
							<li>
								<a
									href="/dynamicego?session=0&datasetName={selectedNetwork.name}"
									target="blank"
									on:click={() => {
										trace.event('vis_1', 'data view', 'Create Visualization', 'Timeline');
									}}
								>
									<img src="/figures/dynamicego.png" width="75px" />
									Timeline
									<!-- <img src="vis_icons/dynamicego.png" width="75px" />Timeline -->
								</a>
							</li>
							<li>
								<a
									href="/map?session=0&datasetName={selectedNetwork.name}"
									target="blank"
									on:click={() => {
										trace.event('vis_1', 'data view', 'Create Visualization', 'Map');
									}}
								>
									<img src="/figures/map.png" width="75px" />
									Map
									<!-- <img src="vis_icons/map.png" width="75px" />Map -->
								</a>
							</li>
						</ul>

						<Button on:click={launchNetworkNarratives}>Open in NetworkNarratives
							<Fa icon={faExternalLinkAlt} />
						</Button>

					{:else}
						<p>First select a network.</p>
					{/if}
				</div>

				<div class="helpSidebar boxed">
					<h3><span> Quick Help</span></h3>
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

				<div id="divEmptyCache">
					<Button
						title="This will remove ALL your networks and tables from your browser cache. FOREVER. Use this function if your browser stops responding. "
						on:click={clearCache}
						outline
						color="danger"
					>
						<Fa icon={faRedo} /> Empty browser cache</Button
					>
				</div>
			</div>

			<div id="center">
				{#if state === 'NEW_NETWORK'}
					<ImportWizard {reloadNetworks} />
				{:else if selectedNetwork}
					<h3>{selectedNetwork.name}</h3>

					<br />
					<h4>Node table</h4>
					<Grid
						data={nodeData}
						columns={nodeColumns}
						sort={true}
						pagination={true}
						search={true}
						resizable={true}
					/>

					<br />
					<h4>Link table</h4>
					<Grid
						data={linkData}
						columns={linkColumns}
						sort={true}
						pagination={true}
						search={true}
						resizable={true}
					/>
				{:else}
					<h3>This is your Data View</h3>
					<h5 class="vertical-centered">
						Select a network or create a new one using the panel on the left.
					</h5>
				{/if}
			</div>
		</div>
		<Footer />

		<Bookmarks />

		<Feedback />
	</main>
</div>

<style>
	@import 'https://cdn.jsdelivr.net/npm/gridjs/dist/theme/mermaid.min.css';

	#divMain {
		padding: 20px;
		padding-left: 40px;
		padding-right: 40px;
	}

	#divAddNetwork {
		margin-bottom: 15px;
		margin-top: 15px;
	}

	#menu {
		margin-bottom: 40px;
	}

	.boxed {
		border-radius: 7px;
		/* border: 3px solid #eee; */
		padding: 20px;
		margin-bottom: 20px;
		background-color: #f0f0f0;
	}

	#divVisualizations li {
		margin-bottom: 20px;
		margin-top: 20px;
	}
	#divVisualizations ul {
		padding-left: 0px;
	}

	#divVisualizations img {
		margin-right: 10px;
		height: 70px;
		width: 70px;
	}

	#divEmptyCache {
		margin-top: 30px;
	}

	#center {
		margin-top: 120px;
		padding-left: 50px;
	}

	.vertical-centered {
		height: fit-content;
		height: auto;
		bottom: auto;
	}

	img.controlIcon {
		height: 10px;
		margin-left: 10px;
		cursor: pointer;
	}

	.vis-types > li {
		margin-top: 0.25em;
	}
</style>
