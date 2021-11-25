<script>
  import FileSelector from "./FileSelector.svelte";
  import FieldSelector from "./FieldSelector.svelte";

  export let edgeTimeType = null;
  export let selectedFile = null;

  export let startTimeField = null;
  export let endTimeField = null;
  export let timeField = null;

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

<input type="radio" bind:group={edgeTimeType}
       value={null} /> No, the edges do not have associated times or this information is not recorded

<br />

<input type="radio" bind:group={edgeTimeType} value={"pointTime"} /> Yes, each edge is associated with a <i>single
  time</i> (for example, if edges correspond to letters posted from one person to another at a particular time)

<br />

<input type="radio" bind:group={edgeTimeType} value={"timeRange"} /> Yes, each edge is associated with a <i>time
  range</i> (for example, if edge correspond to politcal allegiances that lasted for a period of time)

<br />


{#if selectedFile}
  {#if edgeTimeType == "pointTime"}
    <FieldSelector selectedFile={selectedFile} label={"Time"} bind:selectedField={timeField} required={true} />
  {:else if edgeTimeType == "timeRange"}
    <FieldSelector selectedFile={selectedFile} label={"Start time"} bind:selectedField={startTimeField}
                   required={true} />
    <FieldSelector selectedFile={selectedFile} label={"End time"} bind:selectedField={endTimeField} required={true} />
  {/if}
{/if}
