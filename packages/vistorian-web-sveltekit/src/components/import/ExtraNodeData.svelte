<script>

  import {
    Button,
    Card,
    CardBody,
    CardFooter
  } from "sveltestrap";

  import NodeMetadataConfig from "./NodeMetadataConfig.svelte";
  import NodeLocationConfig from "./NodeLocationConfig.svelte";


  export let settings, stage, previous_stage, next_stage;
</script>


<Card class="mb-3" style="width: 50%">
  <CardBody>

    {#if settings.linkTableConfig.fieldLocationSource || settings.linkTableConfig.fieldLocationTarget}
      <p>Node locations are being extracted from the link table. </p>
    {:else}
      <NodeLocationConfig bind:config={settings.nodeLocationConfig} />
    {/if}

    <NodeMetadataConfig bind:config={settings.nodeMetadataConfig} />


  </CardBody>
  <CardFooter>
    <Button style="float: left" on:click={() => stage=previous_stage() }>Previous</Button>
    <Button style="float: right" on:click={() => stage=next_stage() }>Next</Button>
  </CardFooter>
</Card>
