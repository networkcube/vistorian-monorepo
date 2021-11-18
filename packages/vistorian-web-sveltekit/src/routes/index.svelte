<script>
	import { onMount } from 'svelte';
	import { importData, importIntoNetworkcube } from '../lib/vistorian';
	import { getLastSessionId } from '../lib/storage';

	import { trace } from '../lib/trace';

	import ConsentModal from '../components/ConsentModal.svelte';
	import Footer from '../components/Footer.svelte';

	const citationBibtex = `@misc{bach:hal-01205822,
                    TITLE = {{NetworkCube: Bringing Dynamic Network Visualizations
                    to Domain Scientists}},
                    AUTHOR = {Bach, Benjamin and
                    Henry Riche, Nathalie and
                    Fernandez , Roland and
                    Giannisakis, Emmanoulis and
                    Lee, Bongshin and
                    Fekete, Jean-Daniel},
                    URL = {https://hal.inria.fr/hal-01205822},
                    NOTE = {Poster},
                    HOWPUBLISHED = {{Posters of the Conference on Information
                    Visualization (InfoVis)}},
                    YEAR = {2015},
                    MONTH = Oct,
                    KEYWORDS = {information visualization ; networks ;
                    social networks ; brain connectivity},
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

		document.getElementById('resumeSessionLink').href = './dataview?session=' + PREVIOUS_SESSION;
		document.getElementById('resumeSessionLink2').href = './dataview?session=' + PREVIOUS_SESSION;
		document.getElementById('resumeSessionLink3').href = './dataview?session=' + PREVIOUS_SESSION;

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

			<ul id="menu">
				<li>
					<a
						href="./demo?session=0&datasetName=demo_scientists"
						target="_blank"
						on:click={() => trace.event('hlp_7', 'index', 'Visualizations href', 'click')}
						><img src="./logos/eye65.png" class="menuicon" target="_blank" />Visualizations</a
					>
				</li>
				<li>
					<a
						href="./dataview?session=0"
						target="_blank"
						on:click={() => trace.event('hlp_6', 'index', 'Demo href', 'click')}
						><img src="./logos/soccer.png" class="menuicon" />Demo</a
					>
				</li>
				<li>
					<!-- VS: Clicks on Your Session -->
					<a
						id="resumeSessionLink2"
						target="_blank"
						on:click={() => trace.event('log_3', 'index', 'my session href', 'click')}
					>
						<!-- VS: Old code -->
						<!-- <a id="resumeSessionLink2" target="_blank"> -->
						<img src="./logos/003-avatar.png" class="menuicon" />My Session</a
					>
				</li>
				<br />
				<br />
				<br />
				<li>
					<a
						href="http://github.com/networkcube/networkcube/wiki/Visualization-Manual"
						target="_blank"
						on:click={() => trace.event('hlp_1', 'index', 'Vis Manual', 'click')}
					>
						<img src="./logos/002-share.png" class="menuicon" target="_blank" />Visualization Manual</a
					>
				</li>
				<li>
					<a
						href="https://github.com/networkcube/networkcube/wiki/Data-Preparation"
						target="_blank"
						on:click={() => trace.event('hlp_2', 'index', 'Data Formating', 'click')}
					>
						<img src="./logos/001-file.png" class="menuicon" target="_blank" />Data Formatting</a
					>
				</li>

				<li>
					<a
						href="http://github.com/networkcube/networkcube"
						target="_blank"
						on:click={() => trace.event('com_1', 'index', 'github', 'click')}
						><img src="./logos/favourite15.png" class="menuicon" />Github</a
					>
				</li>

				<li>
					<a
						href="https://vistorian.github.io/vistorianLab.html"
						target="_blank"
						class="menuicon"
						on:click={() => trace.event('com_2', 'index', 'vistorinaLab study', 'click')}
						><img src="./logos/VistorianLab.png" class="menuicon" />Vistorian Lab</a
					>
				</li>
				<li>
					<a
						href="mailto:benj.bach@gmail.com"
						class="menuicon"
						on:click={() => trace.event('com_2', 'index', 'contact', 'click')}
						><img src="./logos/chat44.png" class="menuicon" />Contact</a
					>
				</li>
			</ul>

			<div id="logos">
				<a href="http://www.ed.ac.uk/informatics"
					><img id="uoe" src="./figures/university-of-edinburgh-logo.jpg" /></a
				>
				<a href="https://www.microsoft.com/en-us/research/collaboration/inria-joint-centre/"
					><img src="./figures/msr-inria-logo.png" /></a
				>
				<a href="http://www.aviz.fr/"><img src="./figures/aviz.png" /></a>
				<a href="http://www.inria.fr"><img src="./figures/inria.png" /></a>
				<a href="http://research.microsoft.com/en-us/labs/redmond/"
					><img src="./figures/msr.png" /></a
				>
			</div>
		</div>

		<h2>Overview:</h2>

		<div id="video_div">
			<video
				width="800"
				height="500"
				controls
				on:play={() => trace.event('hlp_3', 'index', 'help video', 'play')}
			>
				<source src="./teaser.mp4" type="video/ogg" />
			</video>
		</div>

		<div id="content">
			<div id="description">
				<h2>What is The Vistorian?</h2>
				<p id="description">
					The Vistorian is an online platform that provides interactive visualization for various
					kinds of networks. It is a collaborative open-source research-project currently in the
					prototyping phase.

					<img id="features" src="./logos/multiple-links.png" alt="" />
					<br />

					Enter your data once, and explore it using various visualizations.
				</p>

				<h2>Use</h2>

				The Vistorian is both

				<ul>
					<li>
						a <a href="https://github.com/networkcube/networkcube/tree/master/core"
							>javascript library called networkcube.js</a
						> for importing, storing, and querying dynamic networks in your browser cache,
					</li>
					<li>
						a <a href="./demo?session=0&datasetName=demo_scientists">set of online visualizations</a
						>
						build on top of that library, and
					</li>
					<li>a ready-to-use web application (this website).</li>
				</ul>

				You can:

				<ul>
					<li>
						start using this website by <a id="resumeSessionLink3" target="_blank"
							>creating my session</a
						>
						(no registration required) and start importing your data. Data gets stored in your browser's
						cache,
					</li>
					<li>
						build your own website/webapp <a href="">using networkcube.js</a> and include our visualizations
						through a simple call to the API,
					</li>
					<li>
						write your own visualizations on top of network and provide their URL for others to
						integrate, and
					</li>
					<li>help us improving the visualizations and the core-functionality of networkcube</li>
				</ul>

				<h2>Stay updated and discuss with us</h2>

				Join our mailing list to get updates on the project and post questions to the forum:<a
					href="https://groups.google.com/forum/#!forum/vistorian/join"
					target="_blank">https://groups.google.com/forum/#!forum/vistorian/join</a
				>

				<h2>Contribute</h2>

				Networkcube and the underlying library are open source. For getting involved, visit
				<a href="https://github.com/networkcube/networkcube"
					>https://github.com/networkcube/networkcube</a
				>
				and
				<a href="mailto:benj.bach@gmail.com">e-mail us</a>.

				<h2>Current and past contributors</h2>

				<a href="http://benjbach.me">Benjamin Bach</a>, Edinburgh University, UK<br />
				<a href="http://www.aviz.fr/~fekete/pmwiki/pmwiki.php/Main/CV">Jean-Daniel Fekete</a>, Inria<br
				/>
				<a href="https://www.microsoft.com/en-us/research/people/nath/">Nathalie Henry Riche</a>,
				Microsoft Research<br />
				Nicole Dufournaud, EHSS, France<br />
				<br />
				Roland Fernandez, Microsoft Research<br />
				Charles Parker, Microsoft Research<br />
				Rick Guiterrez, Microsoft Research<br />
				Paola Llerena Valdivia, Inria<br />
				Emmanouil Giannisakis, Inria<br />

				<h2>Related Projects</h2>

				<a href="https://nodexl.codeplex.com">NodeXL</a><br />
				<a href="http://republicofletters.stanford.edu/">Republic of letters</a><br />
				<a href="http://hdlab.stanford.edu/palladio/">Standford's Palladio</a><br />
			</div>

			<div id="upload">
				<h2>Import data</h2>
				<p>
					Your data must be formatted in <a
						href="https://github.com/networkcube/networkcube/wiki/Data-Preparation"
						>CSV data tables.</a
					>. Data is <b>imported into your browser</b>, but neveer to any server. Deleting the
					browser cache, deletes your data.
				</p>
				<p>Follow the link below to resume your last session or start a new one to import data.</p>
				<a id="resumeSessionLink" target="_blank"
					><img src="./logos/003-avatar.png" class="menuicon" id="startcontinue" /><big
						>My Session</big
					></a
				>

				<h2>Data</h2>

				Currently, data has to be formatted as shown below. Each row specifies a link in the
				networks. The two mandatory fields in this example are<i>Name 1</i> and <i>Name 2</i>,
				specifying start and end node. Header names are up to the user and will be specified once
				the data is uploaded. Further importer functions are work-in-progress.

				<img class="dataPicture" src="./figures/nodetable.png" alt="" />

				<a
					href="https://github.com/networkcube/networkcube/wiki/Importing-Data"
					on:click={() => trace.event('hlp_2', 'index', 'importing data', 'click')}>Learn more</a
				>
				about data formatting and data schemas in networkcube.

				<h2>Learn</h2>

				<a href="#video_div">Overview video</a> (the video still shows the old project name
				Networkcube. However, both are identical.<br />
				<a href="http://github.com/networkcube/networkcube/wiki/Visualization-Manual">Manual</a><br
				/>
				<a href="./demo?session=0&datasetName=demo_scientists">Interactive visualizations</a><br />
				<a href="./dataview?session=0">Demo session</a><br />

				<h2>Cite</h2>

				<p>
					<i
						>Benjamin Bach, Nathalie Henry Riche, Roland Fernandez, Emmanoulis Giannisakis, Bongshin
						Lee, Jean-Daniel Fekete. NetworkCube: Bringing Dynamic Network Visualizations to Domain
						Scientists. Posters of the Conference on Information Visualization (InfoVis), Oct 2015,
						Chicago, United States. 2015.
					</i>
				</p>

				<pre style="font-size: 80%"> {citationBibtex} </pre>

				<a href="https://hal.inria.fr/hal-01205822/document">Read the paper</a>
			</div>
		</div>
	</div>

	<Footer />
</main>

<style>
	div#noNetworkTables {
		padding-top: 100px;
		height: 100px;
	}

	.nobr {
		white-space: nowrap;
	}

	img.visicon {
		height: 100px;
		margin-right: 10px;
		border: 1px solid #eee;
		padding: 5px;
	}

	table#main {
		border-collapse: collapse;
		min-width: 1110px;
	}

	#firstRow {
		border-bottom: 1px solid #ddd;
	}

	td#menu {
		padding: 20px;
		width: 200px;
		min-width: 250px;
		max-width: 250px;
	}

	td#lists {
		padding: 30px;
	}

	#center {
		/* width: 400px; */
		/* margin:20px; */
		padding: 20px;
		padding-top: 30px;
		/* padding-left:40px; */
	}

	h2 {
		margin-top: 5px;
	}

	h3 {
		font-weight: bold;
	}

	div.title {
		font-weight: 100;
		font-size: 12pt;
		background-color: #eee;
		border-style: none;
		padding: 5px;
		padding: 20px;
		border-radius: 10px;
		padding-top: 10px;
	}

	div.tableDiv {
		margin-bottom: 20px;
		margin-top: 20px;
	}

	img.controlIcon {
		height: 10px;
		margin-left: 10px;
		cursor: pointer;
	}

	.menuicon {
		height: 30px;
	}

	.inlineicon {
		height: 12pt;
	}

	input#replaceButton {
		margin-left: 10px;
		background-color: #e17f3e;
		border-radius: 10px;
		border: none;
		display: inline-block;
		cursor: pointer;
		color: #ffffff;
		font-size: 12px;
	}

	.menuButton {
		margin-left: 10px;
		background-color: #bbb;
		font-size: 14px;
		font-weight: normal;
		border-radius: 10px;
		border: none;
		display: inline-block;
		cursor: pointer;
		color: #fff;
		padding: 4px;
		padding-left: 8px;
		padding-right: 8px;
		margin: 4px;
	}

	.inputfile {
		width: 0.1px;
		height: 0.1px;
		opacity: 0;
		overflow: hidden;
		position: absolute;
		/* z-index: -1; */
		font-weight: 500;
	}

	input#clearCacheButton {
		margin-top: 40px;
		text-align: left;
		background-color: #eee;
		border-radius: 10px;
		border: none;
		display: inline-block;
		cursor: pointer;
		color: #111;
		font-size: 12px;
		font-weight: 400;
		padding-top: 2px;
		padding-right: 6px;
		padding-bottom: 3px;
		padding-left: 6px;
	}

	#networkStatus {
		padding: 10px;
		border-radius: 10px;
	}

	/* Tables */

	option.tableSelection {
		display: inline;
	}

	.emptyTableCell {
		background-color: #ffeeee;
	}

	.schemaCellSet {
		background-color: #8c8;
	}

	.messageBox {
		width: 100%;
		height: 100%;
		background-color: #ffffff;
		opacity: 0.9;
		position: absolute;
		top: 0px;
		left: 0px;
	}

	.messageBox div {
		font-size: 20pt;
		font-weight: bold;
		font-family: 'Helvetica Neue', Helvetica, sans-serif;
		width: 500px;
		padding-top: 300px;
		text-align: center;
		margin: auto;
	}

	.tablePic {
		height: 100px;
		padding: 10px;
		padding-left: 4px;
	}

	.tablePic:hover {
		outline: solid 3px #000;
	}
</style>
