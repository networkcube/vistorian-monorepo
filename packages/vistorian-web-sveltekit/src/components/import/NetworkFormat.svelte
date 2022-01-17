<script>
	import Fa from 'svelte-fa';
	import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

	import { Button, Card, CardHeader, CardBody, CardFooter } from 'sveltestrap';

	export let fileFormat = 'network';
	export let stage, previous_stage, next_stage;
</script>

<Card class="mb-3" style="width: 100%" title="What is the format of your data?">
	<CardHeader>
		<h4>What is the format of your data?</h4>
	</CardHeader>
	<CardBody>
		<br />

		<h4>Table Format</h4>
		<input type="radio" bind:group={fileFormat} value={'tabular'} />
		I have one or several files in a <b>tabular format</b> (e.g., spreadsheet, CSV, ...)
		<br />

		{#if fileFormat === 'tabular'}
			<div>
				<Fa icon={faInfoCircle} />
				<i>
					If your data is in Excel, export it to CSV. If you have multiple workbooks, export each as
					a separate file:
				</i>
				<ul>
					<li>
						in Microsoft Excel, click <a
							href="https://support.office.com/en-ie/article/import-or-export-text-txt-or-csv-files-5250ac4c-663c-47ce-937b-339e391393ba"
							>File &gt; Save As &gt; Select file type ‘CSV’</a
						>
					</li>
					<li>in Apple Numbers, click File -&gt; Export to -&gt; CSV</li>
					<li>in Google Sheets click File -&gt; Download as -&gt; Comma-separated values</li>
					<li>
						or you can create <code class="language-plaintext highlighter-rouge">CSV</code> by hand in
						any text editor.
					</li>
				</ul>
			</div>
		{/if}
			<br>

		<h4>Other Format</h4>
		<input type="radio" bind:group={fileFormat} value={'network'} />
		2. I have a file in a specific <b>network format</b> (e.g., GEDCOM, PAJEK or GraphML (XML))
	</CardBody>
	<CardFooter>
		<Button style="float: left" on:click={() => (stage = previous_stage())}>Previous</Button>
		<Button style="float: right" on:click={() => (stage = next_stage())}>Next</Button>
	</CardFooter>
</Card>
