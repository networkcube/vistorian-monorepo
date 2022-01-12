<script>
	import { onMount } from 'svelte';
	import { Button } from 'sveltestrap';

	import Fa from 'svelte-fa';
	import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

	import { importData, importIntoNetworkcube } from '../lib/vistorian';
	import { getLastSessionId } from '../lib/storage';

	import { trace } from '../lib/trace';

	import ConsentModal from '../components/ConsentModal.svelte';
	import Footer from '../components/Footer.svelte';

	const citationBibtex = `@misc{bach:hal-01205822,
    TITLE = {{NetworkCube: Bringing Dynamic Network Visualizations to Domain Scientists}},
    AUTHOR = {Bach, Benjamin and Henry Riche, Nathalie and Fernandez, Roland and Giannisakis, Emmanoulis and Lee, Bongshin and Fekete, Jean-Daniel},
    URL = {https://hal.inria.fr/hal-01205822},
    NOTE = {Poster},
    HOWPUBLISHED = {{Posters of the Conference on Information Visualization (InfoVis)}},
    YEAR = {2015},
    MONTH = Oct
}`;

	onMount(async () => {
		// var vis, biblio;
		var SESSION_NAME = Date.now();
		// TODO: ???
		// $('#quickstartlink').attr('href', 'dataview.html?session=' + SESSION_NAME)

		// set link to previous sesssion
		var PREVIOUS_SESSION = getLastSessionId();

		if (!PREVIOUS_SESSION || PREVIOUS_SESSION == '0' || PREVIOUS_SESSION == 0) {
			PREVIOUS_SESSION = SESSION_NAME;
			console.log('create new session', PREVIOUS_SESSION);
		} else {
			console.log('continue previous session', PREVIOUS_SESSION);
		}
		//document.getElementById("resumeSessionLink").href = "./dataview?session=" + PREVIOUS_SESSION;
		//document.getElementById("resumeSessionLink2").href = "./dataview?session=" + PREVIOUS_SESSION;
		//document.getElementById("resumeSessionLink3").href = "./dataview?session=" + PREVIOUS_SESSION;

		// Load demo data
		fetch('./demo/demo_scientists.vistorian')
			.then((res) => res.json())
			.then((data) => {
				importData(data, 0);
				importIntoNetworkcube(data, '0', false);
			});

		// log the page load
		trace.event('log_2', 'index', 'webpage', 'load');
	});
</script>

<svelte:head>
	<title>The Vistorian</title>
</svelte:head>

<main>
	<div id="main">
		<ConsentModal />

		<p id="sessId" style="display:none" />
		<div id="intro">
			<img width="350px" id="logo" src="./logos/logo-networkcube.png" />
			<p class="subtitle">
				Interactive Visualizations for Dynamic and Multivariate Networks. <br /> Free, online, and open
				source.
			</p>
			<br />

			<div id="vistiles">
				<a
					href="./nodelink?session=0&datasetName=demo_scientists"
					target="_blank"
					on:click={() => trace.event('hlp_4', 'index', 'Node Link Example', 'click')}
				>
					<img class="visimage" src="./figures/nodelink.png" />
				</a>
				<a
					href="./dynamicego?session=0&datasetName=demo_scientists"
					target="_blank"
					on:click={() => trace.event('hlp_4', 'index', 'Dynamic Ego Example', 'click')}
				>
					<img class="visimage" src="./figures/dynamicego.png" />
				</a>
				<a
					href="./matrix?session=0&datasetName=demo_scientists"
					target="_blank"
					on:click={() => trace.event('hlp_4', 'index', 'Matrix Example', 'click')}
				>
					<img class="visimage" src="./figures/matrix.png" />
				</a>
				<a
					href="./map?session=0&datasetName=demo_scientists"
					target="_blank"
					on:click={() => trace.event('hlp_4', 'index', 'Map Example', 'click')}
				>
					<img class="visimage" src="./figures/map.png" />
				</a>
			</div>

			<div id="divStartSession">
				<a href="./dataview?session=0">
					<Button size="lg">Start my session</Button>
				</a>
			</div>

			<br />
			<!-- <div id="divMenu">
				<h4>
					<a href="/demo?session=0&datasetName=demo_scientists">
						Description of the available visualizations
					</a>
				</h4>
			</div> -->

			<br />

			<div id="divMenu" style="display: inline-block">
				<div style="display: flex; text-align: left">
					<div class="menuCol">
						<h2>Overview</h2>
						<a href="https://vistorian.github.io">Home</a>
						<br />
						<a href="https://vistorian.github.io/visualizations.html">Visualizations</a>
						<br />
						<a href="https://vistorian.github.io/formattingdata.html">Formatting Data</a>
					</div>

					<div class="menuCol">
						<h2>Learn</h2>
						<a href="https://vistorian.github.io/gettingstarted.html">Getting Started</a>
						<br />
						<a href="https://vistorian.github.io/courses.html">Courses</a>
						<br />
						<a href="https://vistorian.github.io/tutorials.html">Workshop</a>
						<br />
						<a href="https://vistorian.github.io/Troubleshooting.html">Troubleshooting</a>
						<br />
						<a href="https://vistorian.github.io/Resources.html">Resources</a>
					</div>

					<div class="menuCol">
						<h2>Context</h2>
						<a href="https://vistorian.github.io/vistorianLab.html">Research &amp; VistorianLab</a>
						<br />
						<a href="https://vistorian.github.io/publications.html">Publications</a>
						<br />
						<a href="https://vistorian.github.io/development.html">Contribute</a>
						<br />
						<a href="https://vistorian.github.io/team.html">Team</a>
						<br />
						<a href="mailto: vistorian@inria.fr">Contact</a>
					</div>
				</div>
			</div>

			<div id="divCitation" style="padding-top: 2em">
				<h2>Help us sustain the Vistorian by citing us:</h2>
				<p>
					Benjamin Bach, Nathalie Henry Riche, Roland Fernandez, Emmanoulis Giannisakis, Bongshin
					Lee, Jean-Daniel Fekete.
					<a href="https://hal.inria.fr/hal-01205822/document"
						>NetworkCube: Bringing Dynamic Network Visualizations to Domain Scientists <Fa
							icon={faExternalLinkAlt}
						/></a
					>. Posters of the Conference on Information Visualization (InfoVis), Oct 2015, Chicago,
					United States. 2015.
				</p>

				<pre class="citation_bibtex"> {citationBibtex} </pre>
				<br />
			</div>
		</div>
	</div>

	<Footer />
</main>

<style>
	#divStartSession {
		padding-top: 20px;
		padding-bottom: 20px;
		margin: auto;
	}

	.menuCol {
		padding-right: 40px;
		padding-left: 40px;
	}

	.menuCol h2 {
		margin-bottom: 20px;
	}

	#divMenu {
		padding-bottom: 40px;
		margin: auto;
	}

	#divCitation {
		width: 600px;
		text-align: left;
		margin: auto;
	}

	#divCitation h2 {
		padding-bottom: 30px;
		text-align: center;
	}

	#divCitation p {
		padding-bottom: 50px;
	}

	Footer {
		padding-bottom: 100px;
	}

	.citation_bibtex {
		font-size: 80%;
		text-align: left;
		/* width: fit-content; */
		max-width: 100%;
		overflow-x: auto;
		height: fit-content;

		margin-left: auto;
		margin-right: auto;

		padding: 20px;
		background: #f3f3f3;
		color: #636363;
		margin-bottom: 100px;
	}

	#overview_img {
		width: 45%;
		margin-top: 20px;
		margin-bottom: 20px;
	}

	#link_list {
		/*		text-align: left; */
		margin-left: auto;
		margin-right: auto;
		width: fit-content;
	}
</style>
