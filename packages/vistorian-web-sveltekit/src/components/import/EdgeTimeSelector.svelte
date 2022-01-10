<script>
	import FieldSelector from './FieldSelector.svelte';

	import DateFormatPickerModal from './time_format/DateFomatPickerModal.svelte';

	export let config = {
		edgeTimeType: null,
		selectedFile: null,

		startTimeField: null,
		endTimeField: null,
		timeField: null,

		formatString: ''
	};
	export let selectedFile = null;
</script>

<h2>Do edges have associated times?</h2>

<input type="radio" bind:group={config.edgeTimeType} value={null} /> No, the edges do not have
associated times or this information is not recorded

<br />

<input type="radio" bind:group={config.edgeTimeType} value={'pointTime'} /> Yes, each edge is
associated with a <i>single time</i> (for example, if edges correspond to letters posted from one
person to another at a particular time)

<br />

<br />

{#if selectedFile}
	{#if config.edgeTimeType === 'pointTime'}
		<FieldSelector
			{selectedFile}
			label={'Time'}
			bind:selectedField={config.timeField}
			required={true}
		/>
	{/if}

	{#if config.edgeTimeType === 'pointTime'}
		<DateFormatPickerModal bind:formatString={config.formatString} />
	{/if}
{/if}
