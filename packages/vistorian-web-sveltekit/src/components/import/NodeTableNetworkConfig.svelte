<script>
  import FileSelector from "./FileSelector.svelte";
  import FieldSelector from "./FieldSelector.svelte";

  export let config = {
    selectedFile: null,
    fieldNode: null,
    fieldRelations: []
  }

  $: {console.log("In NodeTableNetworkConfig:", config)}

</script>

<h3>
  What is the structure of this node table?
</h3>

<FileSelector bind:selectedFile={config.selectedFile} />

{#if config.selectedFile}
  <FieldSelector selectedFile={config.selectedFile} label={"Node"} bind:selectedField={config.fieldNode} required={true} />

  <h3>Relations</h3>

  <ul>
    {#each config.fieldRelations as fieldRelation, i}
      <li>
        <label>Relation name/link type: <input bind:value={fieldRelation.relation} /></label>
        <FieldSelector selectedFile={config.selectedFile} label={"Column in CSV file"} bind:selectedField={fieldRelation.field}
                       required={true} />
      </li>
      <button on:click={() => config.fieldRelations = config.fieldRelations.filter((d,i2) => i !== i2)}>
        Delete this relation
      </button>
    {/each}
  </ul>

  <button on:click={() => config.fieldRelations = [...config.fieldRelations, {relation: null, field: null}]}>
    Add relation
  </button>

  {:else}

  <p>No file selected...</p>

{/if}
