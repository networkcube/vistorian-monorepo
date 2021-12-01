<script>

  export let data;
  export let hasHeaderRow;

  let cols, rowsToShow;
  $: {
    if (hasHeaderRow) {
      cols = data[0];
      rowsToShow = data.slice(1, 6);
    } else {
      cols = Object.keys(data[0]);
      rowsToShow = data.slice(0, 5);
    }
  }

</script>

<table class="table table-bordered table-hover table-condensed">
  <thead>
  {#each cols as col}
    <th>{col}</th>
  {/each}
  </thead>
  {#each rowsToShow as row}
    <tr>
      {#each cols as col, i}
        <td>{row[i]}</td>
      {/each}
    </tr>
  {/each}
</table>