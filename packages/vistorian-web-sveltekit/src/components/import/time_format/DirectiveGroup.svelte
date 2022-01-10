<script>
	import { timeFormat } from 'd3-time-format';

	export let groupTitle;
	export let directives;
	export let filter;
	export let addDirective;

	let filteredDirectives;
	$: filteredDirectives = directives.filter(
		(f1) => f1.definition.includes(filter) || f1.code.includes(filter)
	);
</script>

{#if filteredDirectives.length > 0}
	<div class="directiveGroup">
		<h3>
			{groupTitle}
		</h3>

		<table>
			{#each filteredDirectives as f}
				<tr>
					<td>
						<button
							on:click={() => {
								addDirective(f.code);
							}}
						>
							+ {f.code}
						</button>
					</td>
					<td>{f.definition} (currently <b>{timeFormat(f.code)(new Date())}</b>)</td>
				</tr>
			{/each}
		</table>
	</div>
{/if}

<style>
	:root {
		--background-color: #fff;
		--text-color: 53, 53, 53;
		--text-background: #f9f9f9;
		--link-color: 255, 13, 134;
	}

	.directiveGroup {
		border: 1px solid lightgrey;
		border-radius: 15px;
		padding-left: 1em;
		margin-bottom: 1em;
	}

	table {
		margin: 0 -1rem;
	}

	td {
		padding: 0.5rem 1rem;
		text-align: left;
		vertical-align: top;
	}

	tr:nth-child(even) {
		background-color: var(--text-background);
	}

	table tr td:nth-child(1) {
		/* first column */
		text-align: right;
	}
</style>
