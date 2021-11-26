<script>
  import FileSelector from "./FileSelector.svelte";
  import FieldSelector from "./FieldSelector.svelte";

  let selectedFile;
  let hasMetadata;


  export let config;

</script>

<h2>
  Do you have a file containing other additional information about nodes?
</h2>

<details>
  <summary>Example</summary>
  <table class="table table-bordered table-hover table-condensed">
    <thead>
    <tr>
      <th title="Field #1">Node ID</th>
      <th title="Field #2">Sex</th>
      <th title="Field #4">Age</th>
      <th title="Field #5">Nationality</th>
    </tr>
    </thead>
    <tbody>
    <tr>
      <td align="right">0</td>
      <td>Male</td>
      <td>32</td>
      <td>English</td>
    </tr>
    <tr>
      <td align="right">1</td>
      <td>Male</td>
      <td>44</td>
      <td>French</td>
    </tr>
    <tr>
      <td align="right">2</td>
      <td>Female</td>
      <td>39</td>
      <td>German</td>
    </tr>
    <tr>
      <td align="right">3</td>
      <td>Female</td>
      <td>50</td>
      <td>American</td>
    </tr>
    </tbody>
  </table>

</details>
<br />

<input type="radio" bind:group={hasMetadata} value={true} /> Yes

<br />

<input type="radio" bind:group={hasMetadata} value={false} /> No

<br />

{#if hasMetadata}

  <FileSelector bind:selectedFile={selectedFile} />

  {#if selectedFile}

    <h4>
      Optional fields
    </h4>
    <br />
    <FieldSelector selectedFile={selectedFile} label={"Label of node"} bind:selectedField={config.fieldLabel} />
    <br />
    <FieldSelector selectedFile={selectedFile} label={"Color of node"} bind:selectedField={config.fieldColor} />
  {/if}

{/if}