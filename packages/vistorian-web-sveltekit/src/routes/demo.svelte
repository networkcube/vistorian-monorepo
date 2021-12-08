<script>
	import { onMount } from 'svelte';

	import { createVisualizationIFrame } from '../lib/createVisIframe';
	import { getUrlVars } from '../lib/utils';

	import Footer from '../components/Footer.svelte';

	onMount(async () => {
		let SERVER;
		if (window.location.port)
			SERVER =
				location.protocol +
				'//' +
				window.location.hostname +
				':' +
				window.location.port +
				'' +
				window.location.pathname +
				'/';
		else
			SERVER =
				location.protocol + '//' + window.location.hostname + '' + window.location.pathname + '/';

		SERVER = SERVER.split('/')[0];

		var WIDTH = 1000;
		var HEIGHT = 700;

		var visparams = { scrolling: 'no' };

		var params = getUrlVars();
		params['datasetName'] = params['datasetName'].replace(/___/g, ' ');

		createVisualizationIFrame(
			'div_nodelink',
			SERVER + '../node_modules/vistorian-nodelink/web/index.html',
			params['session'],
			params['datasetName'],
			WIDTH,
			HEIGHT,
			visparams
		);

		createVisualizationIFrame(
			'div_matrix',
			SERVER + '../node_modules/vistorian-matrix/web/index.html',
			params['session'],
			params['datasetName'],
			WIDTH,
			HEIGHT,
			visparams
		);

		createVisualizationIFrame(
			'div_dynamicego',
			SERVER + '../node_modules/vistorian-dynamicego/web/index.html',
			params['session'],
			params['datasetName'],
			WIDTH,
			HEIGHT,
			visparams
		);

		createVisualizationIFrame(
			'div_map',
			SERVER + '../node_modules/vistorian-map/web/index.html',
			params['session'],
			params['datasetName'],
			WIDTH,
			HEIGHT,
			visparams
		);
	});
</script>

<main>
	<div id="main">
		<p id="sessId" style="display:none" />
		<div id="intro">
			<a href="/"><img id="logo" src="../logos/logo-networkcube.png" /></a>
			<p class=" subtitle">
				Interactive Visualizations for Dynamic and Multivariate Networks. <br /> Online and Open Source.
			</p>
		</div>

		<div id="content">
			<p>
				Scroll down and interact with the visualizations. Each view shows the same network, a
				fictive dynamic scientific social network. Hovering elements in one visualization propagates
				to the other views, highlighting the same element(s).
			</p>

			<p>
				Use the time slider in each visualization to navigate through time. Each visualization
				provides additional parameters for visual refinement. (Possible delays in interaction are
				due to synchronization between visualizations. Visualizations will be faster if used in
				isolation).
			</p>

			<p>
				<a href="../">Back to main page</a>
			</p>

			<div id="div_nodelink">
				<h2>Node Link Visualization</h2>
				<p>
					Node-link diagrams show nodes in the network as points (dots) and (multiple) relations
					between nodes as straight parallel lines. Moving the time slider on the top of the
					visualization filters links between nodes according to their presence in time. Colors show
					the type of relation.
				</p>
			</div>

			<div id="div_matrix">
				<h2>Matrix Visualization</h2>

				<p>
					Adjacency matrices (or simply matrices) are table representations of networks. Nodes are
					represented both as rows and columns, connections between nodes are shown as black or
					colored cells in the matrix. Contrary to node-link representations, matrices do not suffer
					from visual clutter if the network is dense (i.e. contains many links). Matrices help you
					exploring dense networks that would look too cluttered with node-link diagrams.
				</p>

				<p>
					The below example shows a cluster of connections of the same type (red). The first row in
					the matrix, featuring cells of different types (colors), indicates a highly connected
					node.
				</p>

				<p>
					Node labels are shown for rows and columns. A small overview on the left shows the entire
					matrix and the currently visible part when panning and zooming.
				</p>
			</div>

			<div id="div_dynamicego">
				<h2>Timeline Visualization</h2>

				<p>
					The below visualization shows a timeline running from left to
					right. Rows represent nodes in the network and arcs represent connections between them.
					Adapting the time slider on the top of the visualization adapts the time range visible in
					the visualization.
				</p>

				<p>
					Clicking a node label sets this node the current ego node and removes all nodes from the
					visualization that are not connected to the ego node.
				</p>
			</div>

			<div id="div_map">
				<h2>Map Visualization</h2>

				<p>
					The map visualization shows a dynamic network with nodes having geographic node positions.
					This requires that nodes have geographic coordinates associated with them in the data
					model. Every dot-node on the map represents a position of an actual node in the network.
					In other words, for every geographical position that one node occupies during its
					lifetime, there is one node rendered on the map. Hovering a node on the map, shows all the
					nodes belonging to the same node in the network. For example, if a person in a social
					network moves between three different positions over time, there will be three nodes
					rendered on the map and highlighted if one of them is hovered.
				</p>

				<p>
					All locations that are occupied by some node over time, are rendered as black transparent
					squares. Hovering, reveals the location's name as well as the names of the present nodes.
				</p>

				<p>
					Nodes without any geographic position (free nodes) will be placed as close as possible to
					all their connected neighbors. Free nodes are rendered transparent, which can be adjusted
					using the corresponding slider on the top of the map visualization.
				</p>

				<p>
					One common problem with geographic positions is, that multiple nodes are present at the
					same location. The map visualization allows to specify an offset between these nodes
					(slider on the top of the visualization) that nodes at the same geographical position
					slightly apart.
				</p>

				<p>
					The visual encoding of the network is otherwise the same as for the <a
						href="#div_nodelink">node-link visualization</a
					>.
				</p>
			</div>
		</div>

		<Footer />
	</div>
</main>
