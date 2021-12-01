<script>
  import Fa from "svelte-fa";
  import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

      import {
    Button,
    Card,
    CardBody,
    CardFooter,
  } from 'sveltestrap';


  export let fileFormat = "network";
  export let stage, previous_stage, next_stage;
</script>


  <Card class="mb-3"  style="width: 50%">
  <CardBody>

    <h2>
  What file format is the data that defines your network saved in?
</h2>

<input type="radio" bind:group={fileFormat} value={"tabular"} />
I have a file, or several files, in a tabular data format (e.g., a spreadsheet or CSV file)

<br />

<input type="radio" bind:group={fileFormat} value={"network"} />
I have a file in a network format (e.g., GEXF, GraphML, GXL)

    {#if fileFormat === "tabular"}
      <br />
      <div>
        <Fa icon={faInfoCircle} />
        <b>
          If your data is in an Excel spreadsheet, please export it to CSV format (if you have multiple workbooks,
          export
          each as a separate page):
        </b>
          <ul>
            <li>in Microsoft Excel, click <a
              href="https://support.office.com/en-ie/article/import-or-export-text-txt-or-csv-files-5250ac4c-663c-47ce-937b-339e391393ba">File
              &gt; Save As &gt; Select file type ‘CSV’</a></li>
            <li>in Apple Numbers, click File -&gt; Export to -&gt; CSV</li>
            <li>in Google Sheets click File -&gt; Download as -&gt; Comma-separated values</li>
            <li>or you can create <code class="language-plaintext highlighter-rouge">CSV</code> by hand in any text
              editor.
            </li>
          </ul>
      </div>
    {/if}


  </CardBody>
  <CardFooter>
    <Button style="float: left" on:click={() => stage=previous_stage() }>Previous</Button>
    <Button style="float: right" on:click={() => stage=next_stage() }>Next</Button>
  </CardFooter>
</Card>



