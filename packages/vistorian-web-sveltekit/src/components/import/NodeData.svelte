<script>
	let fileSelected = true;
</script>

<h4>Node data</h4>

{#if !fileSelected}
	<button> I have a file containing data about nodes </button>
{:else}
	Node ID: <select />

	This is the identifier used to refer to nodes in the link table.
{/if}
