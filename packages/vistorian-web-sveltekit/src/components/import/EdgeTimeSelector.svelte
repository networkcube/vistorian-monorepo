<script>
	import FieldSelector from './FieldSelector.svelte';

	import DateFormatPickerModal from './time_format/DateFomatPickerModal.svelte';
	import {trace} from '../../lib/trace';

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

<h4>3. Are links associated with time?</h4>

<input type="radio" bind:group={config.edgeTimeType} value={null} on:click="{()=>{trace.event('dat_11', 'Column Type Specified', 'Time', 'No');}}" />
<b>No</b>, my links do not have associated times or this information is not recorded.
<br />

<input type="radio" bind:group={config.edgeTimeType} value={'pointTime'} on:click="{()=>{trace.event('dat_11', 'Column Type Specified', 'Time', 'Yes');}}"/>
<b>Yes</b>, each link is associated with a <i>single time</i> (for example, if edges correspond to
letters posted from one person to another at a particular time)

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
