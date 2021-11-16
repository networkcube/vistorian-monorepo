<script lang="ts">
    import {getContext, setContext} from "svelte";
    import {Bookmark, captureControlsValues} from "./bookmark";

    import {getState, addEventListener} from "vistorian-core/src/data/messenger";

    import {
        Button,
        Form, FormGroup,
        Input, Label, FormText,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader
    } from 'sveltestrap';

    import AnalysisType from "./AnalysisType.svelte";
    import {trace} from "../../lib/trace";
    import {getUrlVars} from "$lib/utils";

    export let bookmarks;

    let open = true;
    const toggle = () => (open = !open);

    const viewType = getContext('viewType');

    const uses = [
        {id: "AnalyzeData", label: "Analyze Data"},
        {id: "Learn", label: "Learn"},
        {id: "DemotoOthers", label: "Demo to others"},
        {id: "exploreVis", label: "Test & Explore Vistorian"},
        {id: "DiscussFindings", label: "Discuss Findings"},
        {id: "ReportIssue", label: "Report an Issue"},
        {id: "Other", label: "Other"}
    ];

    let selectedUse = {id: null, label: null};
    let otherExplanation = '';

    let selectedActivityIndexes = [];

    function updateLocalStorage(bookmarksArray) {

        console.log("SAVING:", {bookmarksArray})

        localStorage.setItem("vistorianBookmarks", JSON.stringify(bookmarksArray));
        document.getElementById('lbl_changesState').style.backgroundColor = "snow";
        document.getElementById('lbl_changesState').innerText = "No of Bookmarks: " + bookmarksArray.length + " - Changes saved"; // TODO: set this properly
    }


    const getDate = () => {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        const today = new Date();
        const date = today.getDate() + '-' + monthNames[today.getMonth()] + '-' + today.getFullYear();
        const time = today.getHours() + ':' + today.getMinutes(); // + ":" + today.getSeconds();
        return date + '  ' + time;
    }


    // Calling getState() requests the state to be returned with a STATE_CREATED message
    // We need to listen for this and save the result
    addEventListener("STATE_CREATED", stateCreatedHandler);
    addEventListener("ZOOM_INTERACTION", zoomLoggingHandler);

    function zoomLoggingHandler(m) {
        trace.event('vis_41', m.ineractionType, true, m.visType);
    }

    // Stores the captured state in the array of bookmarks
    function stateCreatedHandler(m) {
       // let bookmarksArray = JSON.parse(localStorage.getItem("vistorianBookmarks") || "[]");

        if (m.isNewBookmark) {
            bookmarks[bookmarks.length - 1].controlsValues.push(m.state);
        } else {
            if (m.state.networkType == bookmarks[m.bookmarkIndex].viewType || m.state.networkType == "nodelink")
                bookmarks[m.bookmarkIndex].controlsValues[0] = m.state;
            else if (m.state.networkType == "matrix") //                        if  (m.viewType=="matrix")

                bookmarks[m.bookmarkIndex].controlsValues[1] = m.state;

            else if (m.state.networkType == "dynamicego")
                bookmarks[m.bookmarkIndex].controlsValues[2] = m.state;

            else if (m.state.networkType == "map")
                bookmarks[m.bookmarkIndex].controlsValues[3] = m.state;

        }

        localStorage.setItem("vistorianBookmarks", JSON.stringify(bookmarks))

        if ((m.typeOfMultiView == "mat-nl" || m.typeOfMultiView == "tileview") && m.state.networkType == "nodelink")
            getState(m.bookmarkIndex, "matrix", m.isNewBookmark, m.typeOfMultiView);
        else if (m.typeOfMultiView == "tileview" && m.state.networkType == "matrix")
            getState(m.bookmarkIndex, "dynamicego", m.isNewBookmark, m.typeOfMultiView);
        else if (m.typeOfMultiView == "tileview" && m.state.networkType == "dynamicego")
            getState(m.bookmarkIndex, "map", m.isNewBookmark, m.typeOfMultiView);
    }


    const addBookmark = () => {
        trace.event('bkm_3', ' bookmark type specified', selectedUse.id, window.parent.location.pathname);

        let parentUrlTxt = window.parent.location.pathname;
        parentUrlTxt = parentUrlTxt.substring(parentUrlTxt.lastIndexOf("/") + 1, parentUrlTxt.indexOf("."));

        let params = getUrlVars();
        let datasetName = params['datasetName'].replace(/___/g, ' ');


        // TODO: fix this
        /*
        let newBookmarkId = 0; // TODO: set
        for (const bookmark of bookmarks) {
            if (+bookmark.id > newBookmarkId) {
                newBookmarkId = bookmark.id;
            }
        }
        newBookmarkId++;
         */

        let newBookmarkId = bookmarks.length + 1;


        let newBookmark = new Bookmark(
            newBookmarkId,
            getDate(),
            bookmarkLabel,
            viewType,
            datasetName,
            [],
            captureControlsValues(viewType),
        );
        newBookmark.updateNote(notesText);
        newBookmark.updateAnalysisOpts(selectedUse.id === "AnalyzeData" ? selectedActivityIndexes : []);
        newBookmark.updateBookmarkType(selectedUse.id === "Other" ? otherExplanation : selectedUse.label);


        // save the updated bookmarks
        bookmarks = [...bookmarks, newBookmark];
        localStorage.setItem('vistorianBookmarks', JSON.stringify(bookmarks));

        // There are also calls to window.vc.messenger.getState; which I think are unnecessary?
        // userBookmarks.push(newBookmark);
        switch (viewType) {
            case "dataview":
                // networkName = window.parent.document.getElementById('networknameInput').value;
                break;
            case "nodelink":
            case "matrix":
            case "dynamicego":
            case "map":
                getState(newBookmarkId, viewType, true, "");
                break;
            case "mat-nl": // location= index of 0(nodelink)//1(matrix) in the visControls
                getState(newBookmarkId, "nodelink", true, "mat-nl");

                // window.vc.messenger.getState(currentCounterValue-1,"matrix",true);
                break;
            case "tileview": // location= index of 0(nodelink)//1(matrix)//2(DynamicEgo)//3(Map) in the visControls
                getState(newBookmarkId, "nodelink", true, "tileview");
            // window.vc.messenger.getState(currentCounterValue-1,"matrix",true);
            // window.vc.messenger.getState(currentCounterValue-1,"dynamicego",true);
            // window.vc.messenger.getState(currentCounterValue-1,"map",true);

        }

        trace.event('bkm_11', ' New Bookmark Created', 'Saved', parentUrlTxt);
    }

    let bookmarkLabel = 'Update bookmark label here...', notesText = "Enter your notes...";
</script>

<div>
    <Modal isOpen={open} {toggle}>
        <ModalHeader {toggle}><h5 style="color: orange;">Add New Bookmark & Log your Activity</h5></ModalHeader>
        <ModalBody>

            <Form>
                <FormGroup>
                    <Label for="bookmarkLabel">Bookmark Label:</Label>
                    <Input id="bookmarkLabel" bind:value={bookmarkLabel}/>
                </FormGroup>

                <FormGroup>
                    <Label for="notes">Notes:</Label>
                    <Input id="notes" type="textarea" bind:value={notesText}/>
                </FormGroup>

                <FormGroup>
                    <Label>Characterize your current activity</Label>
                    <div>
                        {#each uses as use}
                            <Button color={use.id === selectedUse.id ? 'success' : 'secondary' }
                                    style="margin-left: 5px; margin-bottom: 5px"
                                    id={use.id}
                                    on:click={(ev) => {selectedUse = use; ev.preventDefault()}}
                                    class="menuButtonGadget">
                                {use.label}
                            </Button>
                        {/each}

                        {#if selectedUse.id === "AnalyzeData"}
                            <AnalysisType bind:selectedActivityIndexes={selectedActivityIndexes}/>
                        {/if}

                        {#if selectedUse.id === 'Other'}
                            <label>
                                Specify other usage:
                                <input bind:value={otherExplanation}/>
                            </label>
                        {/if}


                    </div>
                    <FormText color="muted">
                        Only bookmarks types are shared with VistorianLab.
                    </FormText>
                </FormGroup>
            </Form>

        </ModalBody>
        <ModalFooter>
            <Button color="secondary" on:click={toggle}>Cancel</Button>
            <Button color="primary" on:click={() => {addBookmark(); toggle}}>Add bookmark</Button>
        </ModalFooter>
    </Modal>
</div>