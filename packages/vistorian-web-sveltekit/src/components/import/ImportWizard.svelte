<script>
  // Refer to the documentation at https://vistorian.github.io/formattingdata.html

  import {
    Button,
    Card,
    CardBody,
    CardFooter,
  } from "sveltestrap";

  import End from "./End.svelte";
  import NetworkFormat from "./NetworkFormat.svelte";
  import NetworkFileImport from "./NetworkFileImport.svelte";
  import LinkDataType from "./LinkDataType.svelte";
  import LinkTableConfig from "./LinkTableConfig.svelte";
  import NodeTableNetworkConfig from "./NodeTableNetworkConfig.svelte";
  import ExtraNodeDate from "./ExtraNodeData.svelte";

  export let reloadNetworks;

  let settings = {
    name: "",
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
      hasMetadata: false,
      fieldLabel: null,
      fieldLocation: null,
      fieldColor: null
    }
  };

  $: {
    console.log(settings);
  }


  const setName = () => {
    settings.name = settings.name.trim().replace(/ /g, "_").replace(/[\W]+/g, "");
  };

  let stage = "name";

</script>


<h1>Network data import wizard</h1>


{#if stage === "name"}

  <Card class="mb-3" style="width: 50%">
    <CardBody>
      <h3>What is the name of this network?</h3>

      <label>
        Name:
        <input bind:value={settings.name} on:blur={setName} />
      </label>
    </CardBody>

    <CardFooter>
      <Button style="float: right" disabled={!settings.name} on:click={() => stage="network_format" }>Next</Button>
    </CardFooter>
  </Card>

{:else if stage === "network_format"}

  <NetworkFormat bind:stage={stage}
                 next_stage={() => settings.fileFormat}
                 previous_stage={() => "name"}
                 bind:fileFormat={settings.fileFormat}
  />

{:else if stage === "network"}

  <NetworkFileImport
    bind:stage={stage}
    previous_stage={() => "network_format"}
    next_stage={() => "name"} />

{:else if stage === "tabular"}

  <LinkDataType
    bind:linkDataType={settings.linkDataType}
    bind:stage={stage}
    previous_stage={() => "network_format"}
    next_stage={() => settings.linkDataType}
  />

{:else if stage === "linkTable"}

  <LinkTableConfig
    bind:config={settings.linkTableConfig}
    bind:stage={stage}
    previous_stage={() => "tabular"}
    next_stage={() => "nodes"}
  />

{:else if stage === "nodeTable"}

  <NodeTableNetworkConfig
    bind:config={settings.nodeTableConfig}
    bind:stage={stage}
    previous_stage={() => "tabular"}
    next_stage={() => "nodes"}
  />

{:else if stage === "nodes"}

  <ExtraNodeDate
    bind:settings={settings}
    bind:stage={stage}
    previous_stage={() => settings.linkDataType}
    next_stage={() => "end"}
  />

  {:else if stage === "end" }

  <End
    bind:settings={settings}
      bind:stage={stage}
    previous_stage={() => "nodes" }
    next_stage={() => null}
    reloadNetworks={reloadNetworks}
  />

{/if}
