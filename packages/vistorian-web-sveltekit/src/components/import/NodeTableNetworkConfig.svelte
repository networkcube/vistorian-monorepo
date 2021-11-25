<script>
  import FileSelector from "./FileSelector.svelte";
  import FieldSelector from "./FieldSelector.svelte";

  let selectedFile, fields;

  let fieldNode = null;

  let fieldRelations = [];

  $: console.log(fieldRelations);

</script>

<h3>
  What is the structure of this node table?
</h3>

<FileSelector bind:selectedFile={selectedFile} />

{#if selectedFile}
  <FieldSelector selectedFile={selectedFile} label={"Node"} bind:selectedField={fieldNode} required={true} />

  <h3>Relations</h3>

  <ul>
    {#each fieldRelations as fieldRelation, i}
      <li>
        <label>Relation name/link type: <input bind:value={fieldRelation.relation} /></label>
        <FieldSelector selectedFile={selectedFile} label={"Column in CSV file"} bind:selectedField={fieldRelation.field}
                       required={true} />
      </li>
      <button on:click={() => fieldRelations = fieldRelations.filter((d,i2) => i !== i2)}>
        Delete this relation
      </button>
    {/each}
  </ul>

  <button on:click={() => fieldRelations = [...fieldRelations, {relation: null, field: null}]}>
    Add relation column
  </button>

{/if}
