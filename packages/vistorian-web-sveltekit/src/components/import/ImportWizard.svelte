<script>
  // Refer to the documentation at https://vistorian.github.io/formattingdata.html

  // TODO:
  // - allow CSV upload, and identify column names
  // - CSV files without headers
  // - save the result of the selection
  // - allow NodeMetadataConfig to load data from multiple tables
  // consistent use of table vs file
  // - metadata fields to pass through
  // - indication of when config is complete

  // some kind of table preview

  // warn if same field selected for multiple things
  // input of parsing-strings for datetimes


  import NetworkFormat from "./NetworkFormat.svelte";
  import LinkDataType from "./LinkDataType.svelte";
  import LinkTableConfig from "./LinkTableConfig.svelte";
  import NodeMetadataConfig from "./NodeMetadataConfig.svelte";
  import NodeTableNetworkConfig from "./NodeTableNetworkConfig.svelte";
  import NodeLocationConfig from "./NodeLocationConfig.svelte";

  let name = "New Network";
  let nameChanged = false;

  let fileFormat = "tabular";
  let linkDataType = null;
</script>

<style>
    .node-config, .link-config {
        border: 1px solid lightgrey;
        border-radius: 5px;
        margin-top: 1em;
        padding-left: 1em;
    }
</style>

<h1>Network data import wizard</h1>


<h2>What is the name of this network?</h2>
<label>
  Name:
  <input bind:value={name} on:blur={() => nameChanged = true}/>
</label>

{#if nameChanged}
  <NetworkFormat bind:fileFormat={fileFormat} />

  {#if fileFormat === "network"}
    <p>
      <b>Import of network file formats is not yet implemented.</b>
    </p>
  {/if}

  {#if fileFormat === "tabular"}
    <LinkDataType bind:linkDataType={linkDataType} />

    {#if linkDataType === "linkTable"}
      <div class="link-config">
        <h1>Links</h1>
        <LinkTableConfig />
      </div>
      <div class="node-config">
        <h1>Nodes</h1>
        <NodeLocationConfig />
        <NodeMetadataConfig />
      </div>
    {:else if linkDataType === "nodeTable"}
      <div class="link-config">
        <h1>Links</h1>
        <NodeTableNetworkConfig />
      </div>
      <div class="node-config">
        <h1>Nodes</h1>
        <NodeLocationConfig />
        <NodeMetadataConfig />
      </div>
    {/if}
  {/if}
{/if}