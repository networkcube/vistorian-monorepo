<script>
	import { Button, Icon, Modal, ModalBody, ModalFooter, ModalHeader } from 'sveltestrap';

	import { onMount, tick } from 'svelte';

	import { trace } from '../lib/trace';

	let showConsentModal = false;

	onMount(async () => {
		const hasPreviouslyConsented = parseInt(localStorage.getItem('VistorianTour')) == 0;

		// this tick is necessary, or else the change in showConsentModal won't be reflected in the modal's visibilit
		// I think this might be a problem if the change occurs whilst the modal is animating a fade in/out
		await tick();
		showConsentModal = !hasPreviouslyConsented;
	});

	const toggle = () => (showConsentModal = !showConsentModal);

	const acceptConsent = () => {
		showConsentModal = false;

		localStorage.setItem('acceptLogging', 'true');

		if (document.getElementById('chk_dontShowLandingConsent').checked) {
			console.log('Saving skip pref');
			localStorage.setItem('VistorianTour', '0');
		}
	};
</script>

<main>
	<Modal isOpen={showConsentModal}>
		<ModalHeader>
			<h3 class="modal-title" style="color:#FF7F50;">
				Anonymous Activity Logging for Research Purposes
			</h3>
		</ModalHeader>
		<ModalBody style="text-align: justify;font-size: 18px;">
			<p>
				<span
					>The Vistorian is a research prototype to build better visualizations for multivariate
					networks.</span
				>
			</p>
			<p>
				<span
					>By using The Vistorian, you agree that your interactions with the tool are being
					anonymously logged for research purposes at the University of Edinburgh. We will not log
					any information related to your data or browser settings. No cookies or third party
					software will be installed. For more information, please see <a
						href="https://vistorian.github.io/studyPhase1_activityLogging.html"
						target="_blank">here</a
					>.
				</span>
			</p>

			<p>
				<a href="/static/logging_consent/Vistorian Tracing Consent form .pdf" download>
					<Button
						on:click={() =>
							trace.event('log_7', 'consent', 'downloaded', document.location.pathname)}
					>
						<Icon name="download" />
						Download this Consent Form for your records
					</Button>
				</a>
			</p>
		</ModalBody>
		<ModalFooter>
			<label for="chk_dontShowLandingConsent">
				<input type="checkbox" id="chk_dontShowLandingConsent" />
				Don't show consent form again.
			</label>

			<Button color="danger" style="align-items:center;width:200px;" on:click={acceptConsent}
				>OK
			</Button>
		</ModalFooter>
	</Modal>
</main>
