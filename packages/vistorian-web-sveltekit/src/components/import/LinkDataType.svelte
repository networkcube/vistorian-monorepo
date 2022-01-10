<script>
	import { Button, Card, CardBody, CardFooter } from 'sveltestrap';

	export let linkDataType;
	export let stage, previous_stage, next_stage;
</script>

<Card class="mb-3" style="width: 50%">
	<CardBody>
		<h2>How are links or edges represented in your network?</h2>

		<input type="radio" bind:group={linkDataType} value={'linkTable'} />
		I have a file containing one row per <i>link</i>, listing pairs of nodes that are linked (a
		<i>link file</i>)

		<h3>Example</h3>

		<table class="table table-bordered table-hover table-condensed">
			<colgroup>
				<col />
				<col style="background-color: orange" />
				<col />
				<col style="background-color: orange" />
				<col />
			</colgroup>

			<thead>
				<tr>
					<th title="Field #1">Index</th>
					<th title="Field #2">Source Node</th>
					<th title="Field #4">Relation Type</th>
					<th title="Field #5">Target Node</th>
					<th title="Field #7">Date</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td align="right">0</td>
					<td>Bob</td>
					<td>Work</td>
					<td>Sarah</td>
					<td>03/08/1973</td>
				</tr>
				<tr>
					<td align="right">1</td>
					<td>Alex</td>
					<td>Work</td>
					<td>Bob</td>
					<td>06/08/1975</td>
				</tr>
				<tr>
					<td align="right">2</td>
					<td>Alex</td>
					<td>Friendship</td>
					<td>Bob</td>
					<td>06/08/1975</td>
				</tr>
				<tr>
					<td align="right">3</td>
					<td>Alex</td>
					<td>Friendship</td>
					<td>Eve</td>
					<td>15/09/1971</td>
				</tr>
			</tbody>
		</table>

		<br />

		<input type="radio" bind:group={linkDataType} value={'nodeTable'} />
		I have a file containing one row per <i>node</i>, with columns listing the other nodes it is
		linked to (a <i>node file</i>)

		<h3>Example</h3>

		<table>
			<thead>
				<tr>
					<th>Person</th>
					<th>Mother</th>
					<th>Father</th>
					<th>God-Father</th>
					<th>God-Mother</th>
					<th>Place-of-birth</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Bob</td>
					<td>Celine</td>
					<td>Charles</td>
					<td>Dave</td>
					<td>Eve</td>
					<td>Paris</td>
				</tr>
				<tr>
					<td>Ana</td>
					<td>Fannie</td>
					<td>Gerd</td>
					<td>Mike</td>
					<td>Dianne</td>
					<td>London</td>
				</tr>
				<tr>
					<td>Celine</td>
					<td>Maria</td>
					<td>João</td>
					<td>Pedro</td>
					<td>Ana</td>
					<td>Lisbon</td>
				</tr>
			</tbody>
		</table>
	</CardBody>
	<CardFooter>
		<Button style="float: left" on:click={() => (stage = previous_stage())}>Previous</Button>
		<Button style="float: right" on:click={() => (stage = next_stage())} disabled={!linkDataType}
			>Next</Button
		>
	</CardFooter>
</Card>

<style>
	th,
	td {
		text-align: left;
		padding: 5px 10px;
		border-bottom: 1px solid #e5e5e5;
	}
</style>
