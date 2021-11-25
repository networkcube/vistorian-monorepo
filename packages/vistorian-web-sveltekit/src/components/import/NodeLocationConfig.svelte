<script>
  import FileSelector from "./FileSelector.svelte";
  import FieldSelector from "./FieldSelector.svelte";

  export let locationFormat = null;

  let selectedFile;

  let config = {
    fieldPlaceName: null,
    fieldLat: null,
    fieldLon: null,
    fieldX: null,
    fieldY: null
  };

</script>


<h2>
  Do you have a file recording the location of nodes?
</h2>

<details>
  <summary>Help</summary>
  Node locations are required for some visualization types, such as the map.
  If your dataset contains location names, these will be converted to lattitude and longitude locations using an online
  geocoding service.
</details>

<input type="radio" bind:group={locationFormat}
       value={null} /> No, the nodes do not have locations or this information is not recorded

<br />

<input type="radio" bind:group={locationFormat} value={"placeNames"} /> Yes, I have a file that records a <i>place
  name</i> for each node

<br />

<input type="radio" bind:group={locationFormat} value={"latLong"} /> Yes, I have a file that records a <i>latitude and
  longitude</i> for each node

<br />

<input type="radio" bind:group={locationFormat} value={"pixelPositions"} /> Yes, I have a file that records an <i>x and
  y coordinate</i> at which each node should be drawn

<br />

{#if locationFormat }
  <FileSelector bind:selectedFile={selectedFile} />
{/if}

{#if selectedFile}
  {#if locationFormat == "placeNames"}
    <FieldSelector selectedFile={selectedFile} label={"Place name"} bind:selectedField={config.fieldPlaceName}
                   required={true} />
  {:else if locationFormat == "latLong"}
    <FieldSelector selectedFile={selectedFile} label={"Latitude"} bind:selectedField={config.fieldLat}
                   required={true} />
    <FieldSelector selectedFile={selectedFile} label={"Longitude"} bind:selectedField={config.fieldLon}
                   required={true} />
  {:else if locationFormat == "pixelPositions"}
    <FieldSelector selectedFile={selectedFile} label={"X position"} bind:selectedField={config.fieldX}
                   required={true} />
    <FieldSelector selectedFile={selectedFile} label={"Y position"} bind:selectedField={config.fieldY}
                   required={true} />
  {/if}
{/if}
