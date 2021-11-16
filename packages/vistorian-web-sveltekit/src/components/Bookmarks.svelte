<style>
    #mydiv {
        position: fixed;
        top: 0px;
        right: 120px;
        align-self: flex-start;
        background-color: #f1f1f1;
        text-align: center;
        border: 1px solid #d3d3d3;
        /*display :none;*/
        width: 500px;
        height: calc(85%);
        cursor: move;
        box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.25);
        min-width: 20%;
        resize: both;
        overflow-x: scroll;
        overflow-y: hidden;
        direction: rtl;
    }

    #mydivheader {
        padding: 10px;
        cursor: move;
        background-color: #FF7F50;
        color: #fff;
    }

</style>

<script>
    import {onMount} from 'svelte';
    import {Button} from 'sveltestrap';

    import {trace} from "../lib/trace"
    import Logbook from "./bookmarks/Logbook.svelte"

    let isExpanded = true;

    let toolbarMHeight, toolbarMWidth;

    let parentUrlTxt;


    onMount(async () => {
        parentUrlTxt = window.parent.location.pathname;
        parentUrlTxt = parentUrlTxt.substring(parentUrlTxt.lastIndexOf("/") + 1, parentUrlTxt.indexOf("."));
    });

    const minimizeBookmarks = () => {
        isExpanded = false;

        trace.event('bkm_8', ' bookmark window ', 'minimized', parentUrlTxt);
        localStorage.setItem("bookmarkMinimized", "true");


        // save for maximized
        toolbarMHeight = document.getElementById("mydiv").offsetHeight;
        toolbarMWidth = document.getElementById("mydiv").offsetWidth;

        document.getElementById("mydiv").style.maxHeight = document.getElementById("mydivheader").scrollHeight + "px";
    }

    const maximizeBookmarks = () => {
        isExpanded = true;

        document.getElementById("mydiv").style.maxHeight = toolbarMHeight + "px";
        document.getElementById("mydiv").style.maxWidth = toolbarMWidth + "px";

        trace.event('bkm_8', ' bookmark window ', 'maximized', parentUrlTxt);
        localStorage.setItem("bookmarkMinimized", "false");
    }


    /* drag and drop */
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let top = 0, left = 0;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;

        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        // set the element's new position:
        const elmnt = document.getElementById('mydiv')
        top = (elmnt.offsetTop - pos2) + "px";
        left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
    }


</script>

<main>
    <div id="mydiv" style={`top: ${top}; left: ${left}`}>
        <div id="mydivheader" on:mousedown={dragMouseDown}>
            <strong> Bookmarks</strong> (Drag header to move)

            {#if isExpanded}
                <Button class="close" on:click={minimizeBookmarks}>Collapse</Button>

            {:else}
                <Button class="close" on:click={maximizeBookmarks}>Expand</Button>

            {/if}
        </div>

        {#if isExpanded}
            <Logbook/>
        {/if}
    </div>
</main>