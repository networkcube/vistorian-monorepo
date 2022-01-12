<script>
	import { onMount, setContext } from 'svelte';

	import { createVisualizationIFrame } from '../lib/createVisIframe';
	import { getUrlVars } from '../lib/utils';
	import { trace } from '../lib/trace';

	import Bookmarks from '../components/Bookmarks.svelte';
	import Feedback from '../components/Feedback.svelte';
	import Footer from '../components/Footer.svelte';
	import LogoFrame from '../components/LogoFrame.svelte';

	setContext('viewType', 'map');

	// TODO: implement the scripts from the body tag

	// This replaces a jQuery $(document).ready()
	let params;
	onMount(async () => {
		let SERVER;
		if (window.location.port) {
			SERVER =
				location.protocol +
				'//' +
				window.location.hostname +
				':' +
				window.location.port +
				'' +
				window.location.pathname +
				'/';
		} else {
			SERVER =
				location.protocol + '//' + window.location.hostname + '' + window.location.pathname + '/';
		}

		SERVER = SERVER.split('/')[0];

		const width = window.innerWidth - 30;
		const width_col1 = 220;
		const width_col2 = width - width_col1;

		const height = window.innerHeight - 50;

		params = getUrlVars();
		params['datasetName'] = params['datasetName'].replace(/___/g, ' ');

		createVisualizationIFrame(
			'bookmarkFrame',
			SERVER + '../node_modules/vistorian-bookmarkbrowser/web/index.html',
			params['session'],
			params['datasetName'],
			width_col1,
			height
		);

		createVisualizationIFrame(
			'visFrame',
			SERVER + '../node_modules/vistorian-map/web/index.html',
			params['session'],
			params['datasetName'],
			width_col2,
			height
		);

		trace.event('log_2', 'load', 'webpage', document.location.pathname);

		// window.exports.networkcube.vistorian.setHeader('logoFrame', params['datasetName']);
	});
</script>

<svelte:head>
	<title>Map</title>
</svelte:head>

<svelte:body
	on:error={(event, source, lineno, colno, error) =>
		trace.event('err', event + ' ' + source + ' ' + lineno, error, document.location.pathname)}
	on:beforeunload={() => trace.event('log_12', 'page', 'close', document.location.pathname)} />

	<div id="divMain">

<main>
	<table>
		<tr>
			<td width="220px">
				<LogoFrame {params} />
				<div width="220" id="bookmarkFrame" />
			</td>
			<td width="220px">
				<div width="220" id="visFrame" />
			</td>
		</tr>
	</table>

	<Footer />

	<Bookmarks />

	<Feedback />
</main>
</div>

<style>
	#divMain{
		margin: 20px;
	}

	#visFrame{
		margin-left: 20px;
	}
</style>