<style>
    .feedback {
        position: fixed;
        bottom: 50px;
        right: 50px;
        z-index: 10000;
        background: transparent;
        transition: all 3s;
    }
</style>


<script>
    import {
        Button, Icon,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader,
    } from 'sveltestrap';
    import {trace} from "../lib/trace"

    const uses = [
        {id: "AnalyzeData", label: "Analyze Data"},
        {id: "Learn", label: "Learn"},
        {id: "DemotoOthers", label: "Demo to others"},
        {id: "exploreVis", label: "Test & Explore Vistorian"},
        {id: "DiscussFindings", label: "Discuss Findings"},
        {id: "ReportIssue", label: "Report an Issue"},
    ];

    let values = {};
    for (const use of uses) {
        values[use.id] = false;
    }

    let message = '';

    let status = "initial";

    const logFeedback = () => {
        var urlTxt = window.location.pathname;
        urlTxt = urlTxt.substring(urlTxt.lastIndexOf("/") + 1, urlTxt.indexOf("."));

        // This follows the structure of LoggingGeneralFeedback() in bookmarkLogConsent
        // However, it is probably better to send a single message with both the list of uses and message
        /*
        for (const use of uses){
            if (values[use.id]){
                trace.event('log_14', 'general feedback - bookmark type', use.label, urlTxt);
            }
        }
        trace.event('log_15', 'General feedback', message, urlTxt);
        */

        const selectedUses = uses.filter(u => values[u.id]).map(u => u.id).join(", ");
        trace.event('log_15', 'General feedback', `${selectedUses}\n${message}`, urlTxt);
        status = "submitted";
    }

    const cancelFeedback = () => {
        status = "initial"
    };
</script>

<main>

    <Modal isOpen={status === "editing" || status === "submitted"} toggle={cancelFeedback}>
        <ModalHeader>Give feedback</ModalHeader>
        <ModalBody>

            <div>

                {#if status === "submitted"}
                    <h6>
                        Feedback sent! Thank you for helping us!
                    </h6>
                {:else}
                    <h6>Tell us how you use the vistorian in this moment </h6>

                    {#each uses as use}
                        <Button color={values[use.id] ? 'success' : 'secondary' }
                                style="margin-left: 5px; margin-bottom: 5px"
                                id={use.id}
                                on:click={(ev) => {values[use.id] = !values[use.id]; ev.preventDefault()}}
                                class="menuButtonGadget">
                            {use.label}
                        </Button>
                    {/each}
                    <textarea bind:value={message} cols="30" rows="10" placeholder="Send us your feedback!" autofocus></textarea>
                {/if}

            </div>

        </ModalBody>
        <ModalFooter>
            {#if status === "editing"}
                <Button color="primary" on:click={logFeedback}>Submit!</Button>
            {/if}

            <Button color="secondary" on:click={cancelFeedback}>Close</Button>
        </ModalFooter>
    </Modal>

    {#if status === "initial"}
        <div class="feedback">
            <Button on:click={() => status="editing"}>
                <Icon name="pencil-fill"/>
                Give Feedback
            </Button>
        </div>
    {/if}

</main>