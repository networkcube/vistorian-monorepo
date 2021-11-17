<script>
	import { trace } from '../lib/trace';

	export let params;
</script>

<main>
	<div id="logoFrame">
		<a href="/"><img src="../logos/logo-networkcube.png" width="100%" /></a>
		<p style="margin:5px;background-color:#eeeeee;border-radius:2px;padding-left:10px;padding:5px;">
			<b>Data:</b>
			{params && params['datasetName']}
		</p>
		<a
			href={params &&
				`../dataview?session=${params['session']}&datasetName=${params['datasetName']}`}
			style="margin:5px;padding-left:5px;"
			on:click={() =>
				trace.event('log_4', document.location.pathname, 'Return to Data View Button', 'Clicked')}
			target="_blank">Return to Dataview</a
		>
		<br /><br />
	</div>
</main>
