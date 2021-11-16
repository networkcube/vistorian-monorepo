<script>
    const activities = [
        {id: "review", label: "Review Data Quality"},
        {id: "hypothesis", label: "Test a particular hypothesis"},
        {id: "compare", label: "Compare different visualizations"},
        {id: "retrieve", label: "Retrieve specific details"},
        {id: "repeat", label: "Repeat analysis with new data"}
    ];

    export let selectedActivities = {};
    for (const activity of activities) {
        selectedActivities[activity.id] = false;
    }

    export let selectedActivityIndexes;
    $: selectedActivityIndexes = activities.map( (a, i) => ({...a, i}) ).filter(a => selectedActivities[a.id]).map(a => a.i);
</script>

<main>
    <h6>What kind of analysis are you performing?</h6>


    <div style="text-align: left; width: fit-content; margin-left: auto; margin-right: auto">
        {#each activities as activity}
            <label>
                <input type=checkbox bind:checked={selectedActivities[activity.id]}>
                {activity.label}
            </label>
            <br/>
        {/each}
    </div>

</main>

