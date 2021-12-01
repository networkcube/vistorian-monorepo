<script>
	import { Button, Card, CardBody, CardFooter, CardText } from 'sveltestrap';

	export let fileFormat = 'network';
	export let stage, previous_stage, next_stage;
</script>

<Card class="mb-3" style="width: 50%">
	<CardBody>
		<CardText>Import of network file formats is not yet implemented.</CardText>
	</CardBody>
	<CardFooter>
		<Button style="float: left" on:click={() => (stage = previous_stage())}>Previous</Button>
		<Button style="float: right" on:click={() => (stage = next_stage)}>Next</Button>
	</CardFooter>
</Card>
