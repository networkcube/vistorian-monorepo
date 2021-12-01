<script>
	import { timeFormat } from 'd3-time-format';
	import { tick } from 'svelte';
	import DirectiveGroup from './DirectiveGroup.svelte';
	import { directives } from './directives';

	export let formatString = '';
	export let formatter, formattedDate;
	$: formatter = timeFormat(formatString);
	$: formatedDate = formatter(new Date());

	let filter = '';
	let componentsToShow;

	const addDirective = async (directiveCode) => {
		const pos = document.getElementById('date-form-input').selectionStart;
		formatString = formatString.slice(0, pos) + directiveCode + formatString.slice(pos);

		await tick(); // wait for Svelte to update the DOM
		document.getElementById('date-form-input').focus();
		console.log('Setting selection range to:', pos + directiveCode.length);
		document
			.getElementById('date-form-input')
			.setSelectionRange(pos + directiveCode.length, pos + directiveCode.length);
	};
</script>

<h2>Datetime format string</h2>

<p>
	<b
		>Type in the input box to edit the format string, or click on a button to append the
		corresponding directive. You can manually enter character such as colons, hyphens, spaces, or
		parentheses.</b
	>
</p>

<label>
	Date format:
	<input bind:value={formatString} id="date-form-input" />
</label>

In this format, the current datetime is <b>{formatedDate}</b>.

<h2>Possible directives</h2>

<label>
	Filter:
	<input bind:value={filter} />
</label>

{#each Object.keys(directives) as t}
	<DirectiveGroup directives={directives[t]} groupTitle={t} {filter} {addDirective} />
{/each}
