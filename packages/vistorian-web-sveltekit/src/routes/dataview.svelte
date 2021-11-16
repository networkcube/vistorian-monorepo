<svelte:head>
    <title>Data view</title>
</svelte:head>


<script>
    import {onMount} from 'svelte';

    import {trace} from "../lib/trace"

    import Bookmarks from "../components/Bookmarks.svelte";
    import Feedback from "../components/Feedback.svelte";
    import Footer from "../components/Footer.svelte";

    // TODO: implement the scripts from the body tag

    // This replaces a jQuery $(document).ready()
    let params;
    onMount(async () => {
        trace.event('log_2', 'load', 'webpage', document.location.pathname)
    })

</script>

<svelte:body
        on:error={(event, source, lineno, colno, error) => trace.event('err', event + ' ' + source + ' '+lineno, error, document.location.pathname)}
        on:beforeunload={() => trace.event('log_12', 'page', 'close', document.location.pathname)}
/>


<main>
    <table id="main">
        <tr id="firstRow">
            <td id="menu">
                <a href="../index.html"><img width="100%" src="../logos/logo-networkcube.png"/></a>
                <p id="intro">
                    This is your data view. Below you find a list of visualizations and the
                    networks currently in your browser.
                </p>
            </td>
            <td>
                <div id="visualizationListDiv">
                    <ul id="visualizationList" class="nointent"></ul>
                </div>
            </td>
        </tr>
        <tr>
            <td id="lists">

                <div>
                    <input id="startTourAgain" type="button" class="menuButton hastooltip" value="Start my tour"
                           style="background-color: #FF7F50;"
                           title="This will start the tour to explore The Vistorian's interface"
                           onclick="trace.event('log_','Start Tour Button','clicked','dataview'); ;restartTour()"/>
                </div>
                <p></p>

                <div id="networkListDiv">
                    <h2>Your Networks</h2>
                    <ul id="networkList" class="nointent"></ul>
                    <input id="btn_newNetwork" type="button" class="menuButton hastooltip" value="New Network"
                           onclick="window.exports.networkcube.dataview.createNetwork();trace.event('dat_1', 'data view', 'new network', 'created');guide_afterNetworkCreation();"
                           title="Create new network from one or more tables."/>
                </div>
                <br/>
                <div id="tableListDiv">
                    <h2>Your Tables</h2>
                    <p>Placeholder...</p>
                </div>

                <div>
                    <input id="clearCacheButton" type="button" class=" hastooltip" value="Empty browser cache"
                           title="This will remove ALL your networks and tables from your browser cache. FOREVER. Use this function if your browser is not repsponding anymore. "
                           onclick="window.exports.networkcube.dataview.clearCache();trace.event('dat_5','data view','browser cache','cleared')"/>
                </div>
                <br/>
                <div class="helpSidebar">
                    <h2><span> Quick Help:</span></h2>
                    <ul style="list-style-type:disc;">
                        <li><a href="https://vistorian.github.io/gettingstarted.html"
                               onclick="trace.event('hlp_8', 'dataview', 'tutorials', 'click')" target="_blank">How to
                            get started?</a></li>
                        <li><a href="https://vistorian.github.io/tutorial/bookmarks.html"
                               onclick="trace.event('hlp_8', 'dataview', 'tutorials', 'click')" target="_blank">A
                            Step-by-Step Guide to Create your first visualization</a></li>
                        <li><a href="https://youtu.be/eXIDFK2vJ6Y"
                               onclick="trace.event('hlp_8', 'dataview', 'tutorials', 'click')" target="_blank">Watch
                            our video on how to format your data!</a></li>
                    </ul>
                </div>
            </td>


            <td id="center">
                <p> This page will be replaced when the new importer is added...</p>
            </td>
        </tr>
    </table>


    <Footer/>

    <Bookmarks/>

    <Feedback/>
</main>