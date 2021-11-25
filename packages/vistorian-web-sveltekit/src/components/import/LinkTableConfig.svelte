<script>
  import FileSelector from "./FileSelector.svelte";
  import FieldSelector from "./FieldSelector.svelte";
  import EdgeTimeSelector from "./EdgeTimeSelector.svelte";

  let selectedFile;

  let config = {
    edgesAreDirected: null,

    fieldLinkId: null,
    fieldSourceId: null,
    fieldTargetId: null,

    fieldLocationSource: null,
    fieldLocationTarget: null,
    fieldWeight: null,
    fieldTime: null,
    fieldTimeStart: null,
    fieldTimeEnd: null,
    fieldLinkType: null,
    fieldLinkIsDirected: null
  };

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

<FileSelector bind:selectedFile={selectedFile} />

{#if selectedFile}

  <h4>
    Required fields
  </h4>

  <FieldSelector selectedFile={selectedFile} label={"Source node id"} bind:selectedField={config.fieldSourceId}
                 required={true} />

  <FieldSelector selectedFile={selectedFile} label={"Target node id"} bind:selectedField={config.fieldTargetId}
                 required={true} />

  <h4>
    Optional fields
  </h4>

  <FieldSelector selectedFile={selectedFile} label={"Link id"} bind:selectedField={config.fieldLinkId}
                 required={true} />

  <FieldSelector selectedFile={selectedFile} label={"Location of source node"}
                 bind:selectedField={config.fieldLocationSource} />

  <FieldSelector selectedFile={selectedFile} label={"Location of target id"}
                 bind:selectedField={config.fieldLocationTarget} />

  <FieldSelector selectedFile={selectedFile} label={"Weight of link"}
                 helpText={"A numerical measure of the strength of conection between nodes (e.g., the travel time between two locations, the value of a cash transfer.)"}
                 bind:selectedField={config.fieldWeight} />

  <FieldSelector selectedFile={selectedFile} label={"Link type"} bind:selectedField={config.fieldLinkType} />

  <FieldSelector selectedFile={selectedFile} label={"Whether link is directed"}
                 bind:selectedField={config.fieldLinkIsDirected} />

  <EdgeTimeSelector selectedFile={selectedFile} bind:timeField={config.fieldTime}
                    bind:startTimeField={config.fieldTimeStart} bind:endTimeField={config.fieldTimeEnd} />

{/if}
