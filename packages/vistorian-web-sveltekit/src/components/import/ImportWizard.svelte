<script>
  // Refer to the documentation at https://vistorian.github.io/formattingdata.html

  import { fileStore } from './stores.js';

  import NetworkFormat from "./NetworkFormat.svelte";
  import LinkDataType from "./LinkDataType.svelte";
  import LinkTableConfig from "./LinkTableConfig.svelte";
  import NodeMetadataConfig from "./NodeMetadataConfig.svelte";
  import NodeTableNetworkConfig from "./NodeTableNetworkConfig.svelte";
  import NodeLocationConfig from "./NodeLocationConfig.svelte";

  import importNetwork from "./import_network";

  export let reloadNetworks;

  let nameChanged = false;

  let settings = {
    name: "New Network",
    fileFormat: "tabular",
    linkDataType: null,

    nodeTableConfig: {
      selectedFile: null,
      fieldNode: null,
      fieldRelations: []
    },

    linkTableConfig: {
      edgesAreDirected: null,

      selectedFile: null,

      fieldLinkId: null,
      fieldSourceId: null,
      fieldTargetId: null,

      fieldLocationSource: null,
      fieldLocationTarget: null,
      fieldWeight: null,
      fieldLinkType: null,
      fieldLinkIsDirected: null,

      timeConfig: {
        edgeTimeType: null,
        selectedFile: null,

        startTimeField: null,
        endTimeField: null,
        timeField: null,

        formatString: ""
      }
    },

    nodeLocationConfig: {
      locationFormat: "",
      fieldPlaceName: null,
      fieldLat: null,
      fieldLon: null,
      fieldX: null,
      fieldY: null
    },

    nodeMetadataConfig: {
      fieldLabel: null,
      fieldLocation: null,
      fieldColor: null
    }
  };

  $: {
    console.log(settings);
  }


  const setName = () => {
    settings.name = settings.name.replace(/ /g, "_").replace(/[\W]+/g, "");
    nameChanged = true;
  }

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
  <input bind:value={settings.name} on:blur={setName} />
</label>

{#if nameChanged}
  <NetworkFormat bind:fileFormat={settings.fileFormat} />

  {#if settings.fileFormat === "network"}
    <p>
      <b>Import of network file formats is not yet implemented.</b>
    </p>
  {/if}

  {#if settings.fileFormat === "tabular"}
    <LinkDataType bind:linkDataType={settings.linkDataType} />

    {#if settings.linkDataType === "linkTable"}
      <div class="link-config">
        <h1>Links</h1>
        <LinkTableConfig bind:config={settings.linkTableConfig} />
      </div>
      <div class="node-config">
        <h1>Nodes</h1>

        {#if settings.linkTableConfig.fieldLocationSource || settings.linkTableConfig.fieldLocationTarget}
          <p>Node locations are being extracted from the link table. </p>
        {:else}
          <NodeLocationConfig bind:config={settings.nodeLocationConfig} />
        {/if}

        <NodeMetadataConfig bind:config={settings.nodeMetadataConfig} />
      </div>
    {:else if settings.linkDataType === "nodeTable"}
      <div class="link-config">
        <h1>Links</h1>
        <NodeTableNetworkConfig bind:config={settings.nodeTableConfig} />
      </div>
      <div class="node-config">
        <h1>Nodes</h1>

        {#if settings.linkTableConfig.fieldLocationSource || settings.linkTableConfig.fieldLocationTarget}
          <p>Node locations are being extracted from the link table. </p>
        {:else}
          <NodeLocationConfig bind:config={settings.nodeLocationConfig} />
        {/if}

        <NodeMetadataConfig bind:config={settings.nodeMetadataConfig} />
      </div>
    {/if}
  {/if}
{/if}

<button on:click={() => importNetwork(settings, $fileStore, reloadNetworks)}>Import network</button>