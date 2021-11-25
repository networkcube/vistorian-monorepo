<script>
  import Fa from "svelte-fa";
  import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";

  import { fileStore } from "./stores.js";

  export let selectedFile;
  export let helpText = "";

  let fields;
  let hasHeaderRow;
  $: hasHeaderRow = $fileStore[selectedFile].hasHeaderRow;

  let firstDataRow;
  $: {
    let firstRow = $fileStore[selectedFile].data[0];

    if (hasHeaderRow) {
      fields = firstRow;
      firstDataRow = $fileStore[selectedFile].data[1];
    } else {
      fields = Object.keys(firstRow);
      firstDataRow = $fileStore[selectedFile].data[0];
    }
  }

  export let label = "";
  export let selectedField = null;
  export let required = false;

  $: {
    console.log($fileStore[selectedFile].data[0]);
  }

  let showHelp = false;

</script>

<style>
    .help {
        margin-left: 2em;
    }
</style>


<label>{label}

  {#if helpText}
    <button on:click={() => {console.log(`showHelp is ${showHelp}`); showHelp = !showHelp}}>
      <Fa icon={faQuestionCircle} />
    </button>
  {/if}

  <select bind:value={selectedField}>
    {#if !required}
      <option value={null}>-</option>
    {/if}
    {#each fields as field, i}
      <option value={i}>{field} (first value is "{firstDataRow[i]}")</option>
    {/each}
  </select>

  {#if showHelp}
    <p class="help">{helpText}</p>
  {/if}
</label>