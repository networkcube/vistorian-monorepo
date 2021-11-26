<script>
  import FileSelector from "./FileSelector.svelte";
  import FieldSelector from "./FieldSelector.svelte";
  import EdgeTimeSelector from "./EdgeTimeSelector.svelte";

  export let config;

  $: console.log(config);
</script>

<h2>
  Do edges have a direction (i.e., does it matter which node is the source, and which is the target)?
</h2>

<input type="radio" bind:group={config.edgesAreDirected} value={true} /> Yes

<br />

<input type="radio" bind:group={config.edgesAreDirected} value={false} /> No

<br />


<h2>
  What is the structure of this link table?
</h2>

<FileSelector bind:selectedFile={config.selectedFile} />

{#if config.selectedFile}

  <h4>
    Required fields
  </h4>

  <FieldSelector selectedFile={config.selectedFile} label={"Source node label"} bind:selectedField={config.fieldSourceId}
                 required={true} />

  <br />
  <FieldSelector selectedFile={config.selectedFile} label={"Target node label"} bind:selectedField={config.fieldTargetId}
                 required={true} />

  <h4>
    Optional fields
  </h4>

  <FieldSelector selectedFile={config.selectedFile} label={"Link id"} bind:selectedField={config.fieldLinkId}
                 required={true} />
  <br />

  <FieldSelector selectedFile={config.selectedFile} label={"Location of source node"}
                 bind:selectedField={config.fieldLocationSource} />
  <br />

  <FieldSelector selectedFile={config.selectedFile} label={"Location of target id"}
                 bind:selectedField={config.fieldLocationTarget} />
  <br />

  <FieldSelector selectedFile={config.selectedFile} label={"Weight of link"}
                 helpText={"A numerical measure of the strength of conection between nodes (e.g., the travel time between two locations, the value of a cash transfer.)"}
                 bind:selectedField={config.fieldWeight} />
  <br />

  <FieldSelector selectedFile={config.selectedFile} label={"Link type"} bind:selectedField={config.fieldLinkType} />
  <br />

  {#if config.edgesAreDirected}
    <FieldSelector selectedFile={config.selectedFile} label={"Whether link is directed"}
                   bind:selectedField={config.fieldLinkIsDirected} />
    <br />
  {/if}

  <EdgeTimeSelector selectedFile={config.selectedFile} bind:config={config.timeConfig}  />

{/if}
