<script>
  import FieldSelector from "./FieldSelector.svelte";

  import DateFormatPickerModal from "./time_format/DateFomatPickerModal.svelte";

  export let config = {
    edgeTimeType: null,
    selectedFile: null,

    startTimeField: null,
    endTimeField: null,
    timeField: null,

    formatString: ""
  };
  export let selectedFile = null;

</script>


<h2>
  Do edges have associated times?
</h2>

<details>
  <summary>Help</summary>
  Node locations are required for some visualization types, such as the map.
  If your dataset contains location names, these will be converted to lattitude and longitude locations using an online
  geocoding service.
</details>

<input type="radio" bind:group={config.edgeTimeType}
       value={null} /> No, the edges do not have associated times or this information is not recorded

<br />

<input type="radio" bind:group={config.edgeTimeType} value={"pointTime"} /> Yes, each edge is associated with a <i>single
  time</i> (for example, if edges correspond to letters posted from one person to another at a particular time)

<br />

<input type="radio" bind:group={config.edgeTimeType} value={"timeRange"} disabled /> Yes, each edge is associated with a <i>time
  range</i> (for example, if edge correspond to politcal allegiances that lasted for a period of time)

<br />


{#if selectedFile}
  {#if config.edgeTimeType === "pointTime"}
    <FieldSelector selectedFile={selectedFile} label={"Time"} bind:selectedField={config.timeField} required={true} />
  {:else if config.edgeTimeType === "timeRange"}
    <FieldSelector selectedFile={selectedFile} label={"Start time"} bind:selectedField={config.startTimeField}
                   required={true} />
    <FieldSelector selectedFile={selectedFile} label={"End time"} bind:selectedField={config.endTimeField} required={true} />
  {/if}

  {#if config.edgeTimeType === "pointTime"}
    <DateFormatPickerModal bind:formatString={config.formatString} />
  {/if}
{/if}
