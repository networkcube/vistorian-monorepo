<script lang="ts">
	import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'sveltestrap';

	import DateFormatPicker from './DateFormatPicker.svelte';

	export let formatString = '';

	let open = false;
	const toggle = () => (open = !open);
</script>

<div>
	<h4>4. Specify a date format:</h4>
	{formatString}
	<Button outline color="secondary" on:click={toggle}>Edit</Button>

	<Modal isOpen={open} {toggle}>
		<ModalHeader {toggle}>Datetime format</ModalHeader>
		<ModalBody>
			<DateFormatPicker bind:formatString />
		</ModalBody>
		<ModalFooter />
	</Modal>
</div>
