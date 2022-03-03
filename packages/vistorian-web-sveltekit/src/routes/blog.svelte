<script>

    import {getBookmarks, getSelectedNetwork, loadBookmark} from "../lib/blog"
    import {onMount} from "svelte";
    import {createVisualizationIFrame} from "../lib/createVisIframe";
    import {getUrlVars} from "../lib/utils";


    let bookmarks = [], selectedNetwork;
    let SERVER;
    let params;
    let setState;
    onMount(async () => {

        const module = await import('vistorian-core/src/data/messenger');
        setState = module.setState;


        bookmarks = getBookmarks();
        selectedNetwork = getSelectedNetwork();

        if (window.location.port) {
            SERVER = `${location.protocol}//${window.location.hostname}:${window.location.port}${window.location.pathname}/`;
        } else {
            SERVER = `${location.protocol}//${window.location.hostname}${window.location.pathname}/`;
        }
        SERVER = SERVER.split('/')[0];

        params = getUrlVars();
        params['datasetName'] = params['datasetName'].replace(/___/g, ' ');
    });

    const visUrls = {
        "nodelink": '../node_modules/vistorian-nodelink/web/index.html',
        "matrix": '../node_modules/vistorian-matrix/web/index.html',
        "dynamicego": '../node_modules/vistorian-dynamicego/web/index.html',
        "map": '../node_modules/vistorian-map/web/index.html'
    }

    const loadVisFromBookmark = (bookmarks, index) => {

        createVisualizationIFrame(
            'containerForVis',
            SERVER + visUrls[bookmarks[index].viewType],
            params['session'],
            params['datasetName'],
            window.innerWidth + "px",
            window.innerHeight + "px",
        );

        // this timeout is a hack to give the visualization time to load
        setTimeout(() => loadBookmark(setState, bookmarks, index, 0), 15 * 1000)
    }

</script>


<main>
    <h1>Scaffolding for Vistorina blog</h1>


    <div id="containerForVis"></div>

    <h2>List of bookmarks</h2>
    <ul>
        {#each bookmarks as bookmark, i}
            <li>
                <details>
                    <summary>Click to exand</summary>
                    <pre>{JSON.stringify(bookmark, null, 2)}</pre>
                </details>

                <button on:click={() => loadVisFromBookmark(bookmarks, i)}>Load</button>
            </li>
        {/each}
    </ul>

    <h2>Network state</h2>

    <details>
        <summary>
            Click to expand and view JSON representation of selected network
        </summary>
        <pre>{JSON.stringify(selectedNetwork, null, 2)}</pre>
    </details>

</main>


<style>

    pre {
        background-color: lightgrey;
    }
</style>