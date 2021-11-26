<script>
  import FileSelector from "./FileSelector.svelte";
  import FieldSelector from "./FieldSelector.svelte";

  let selectedFile;
  export let config;
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

<input type="radio" bind:group={config.locationFormat}
       value={null} /> No, the nodes do not have locations or this information is not recorded

<br />

<input type="radio" bind:group={config.locationFormat} value={"placeNames"} /> Yes, I have a file that records a <i>place
  name</i> for each node

<br />

<input type="radio" bind:group={config.locationFormat} value={"latLong"} /> Yes, I have a file that records a <i>latitude and
  longitude</i> for each node

<br />

<input type="radio" bind:group={config.locationFormat} value={"pixelPositions"} disabled /> Yes, I have a file that records an <i>x and
  y coordinate</i> at which each node should be drawn

<br />

{#if config.locationFormat }
  <FileSelector bind:selectedFile={selectedFile} />
{/if}

{#if selectedFile}
  {#if config.locationFormat === "placeNames"}
    <FieldSelector selectedFile={selectedFile} label={"Place name"} bind:selectedField={config.fieldPlaceName}
                   required={true} />
  {:else if config.locationFormat === "latLong"}
    <FieldSelector selectedFile={selectedFile} label={"Latitude"} bind:selectedField={config.fieldLat}
                   required={true} />
    <FieldSelector selectedFile={selectedFile} label={"Longitude"} bind:selectedField={config.fieldLon}
                   required={true} />
  {:else if config.locationFormat === "pixelPositions"}
    <FieldSelector selectedFile={selectedFile} label={"X position"} bind:selectedField={config.fieldX}
                   required={true} />
    <FieldSelector selectedFile={selectedFile} label={"Y position"} bind:selectedField={config.fieldY}
                   required={true} />
  {/if}
{/if}
