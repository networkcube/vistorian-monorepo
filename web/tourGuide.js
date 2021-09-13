
const intro=introJs();

var currentButton="start";

function returnRequiredSteps(){

    var allSteps= [
        {
            title: "Welcome to The Vistorian Tour Guide",
            intro: "Through this tour we will introudce you to The Vistorian and its new features!",
            step: "0"
        }, 
        {
            title: "First-Step: Create a New Network",
            element: document.querySelector('#btn_newNetwork'),
            intro: "Start by clicking here to create a new network.",
            step: "1"
        },
        {
            element: document.querySelector('#lbl_uploadLinkTable'),
            title:"Second-Step: Upload Your Data Table", 
            intro:"Click here to upload your table if it is a LINK table.",
            step: "2"
        },
        {
            element: document.querySelector('#lbl_uploadNodeTable'),
            title:"Second-Step: Upload Your Data Table", 
            intro:"Click here to upload your NODE table if your table is a node table. If your network has only a LINK table, ignore this step.",
            step: "3"
        },
        {
            element: document.querySelector('#directedNetworkCheckBox'),
            title:"Is your network directed?", 
            intro:"Ensure this box is checked if your network is directed.",
            step: "4"
        },
        {
            //element: document.getElementById('linkTableDiv')
            element: document.querySelectorAll('.schemaRow')[0],
            title:"Specify Column Type", 
            intro:"Use these dropdown menus to specify which information is shown in the columns of your table. To visualize a network, you need specify two columns:<ul style='list-style-type:disc;'><li>Source Node (or \'Node 1\' in case your network is undirected)</li><li>Target Node (or \'Node 2\' in case your network is undirected)</li></ul>",
            step: "5"
        },
        {   //document.getElementById('schemaCell_userLinkSchema_2'),
            element: document.querySelectorAll('.schemaRow')[0],
            title:"Specify Column Type", 
            intro:"Now, chose the second field Source Node / Node 1 or Target Node / Node 2. You can specify more information later, such as time, link type, link weight, etc.",
            step: "6"
        },
        {
            element: document.querySelector('#networkStatus'),
            title:"Network's Readiness for Visualization", 
            intro:"Once your network is ready for visualization, this header will turn green.",
            step: "7"
        },
        {   //document.getElementById('schemaCell_userNodeSchema_1'),
            element: document.querySelectorAll('.schemaRow')[0],
            title:"Specify Column Type", 
            intro:"For each column of your intrest, specify how you describe such the data  of such attribute.",
            step: "8"
        },
        {
            element: document.querySelectorAll('.schemaRow')[0],
            title:"Specify Column Type", 
            intro:"You need to specify at least two columns to create a network: Node label and relation. You can describe more columns as needed (ex. location, time, ..).",
            step: "9"
        },
        {
            element: document.querySelector('#networkStatus'),
            title:"Network's Readiness for Visualization", 
            intro:"Once your network is ready for visualization, this header will turn into green.",
            step: "10"
        },
        {
            element: document.querySelectorAll('.visLink')[0],
            title:"Nodelink Visualization", 
            intro:"Click here to create a nodelink visualization.",
            step: "11"
        },
        {
            element: document.querySelectorAll('.visLink')[1],
            title:"Matrix Visualization", 
            intro:"Click here to create a matrix visualization.",
            step: "12"
        },
        {
            element: document.querySelectorAll('.visLink')[2],
            title:"Time Arcs Visualization", 
            intro:"Click here to create a time arcs visualization.",
            step: "13"
        },
        {
            element: document.querySelectorAll('.visLink')[3],
            title:"Map Visualization", 
            intro:"Click here to create a map visualization. Ensure you have updated locations coordinates.",
            step: "14"
        },
        {
            element: document.querySelectorAll('.visLink')[4],
            title:"Nodelink and Matrix Visualizations", 
            intro:"Create both nodelink and matrix visualizations. This allows you to compare and analyze your network using both representations.",
            step: "15"
        },
        {
            element: document.querySelector('#btn_updateCoordinates'),
            title:"Update Locations Coordinates (Optional)", 
            intro:"Click here after uploading your link/node table and if your data contains locations (ex. cities) in order to update locations' coordinates and use the Map Visualization",
            step: "16"
        },
        {
            title: "Try Vistorian Lab Now (NEW Feature)! ",
            element: document.querySelector('#consentFormBK'),
            intro: "The Vistorian Lab is your new research assistant! It will help you to analyze your data and capture your findings. Find  more about it<a href='https://vistorian.github.io/studyPhase1_activityLogging.html' target='_blank' >here </a>.",
            step: "17"
        }

        
    
    ];

    return allSteps;
}
  //addStepAfterLKUpload

function startFromTheBeginning(){
    allSteps=returnRequiredSteps();
    // Start from scratch - Guide to create a network
    intro.setOptions({
        steps:allSteps.slice(0,2)
    });
    intro.start();
}
function guide_afterNetworkCreation(){
    allSteps=returnRequiredSteps();

    //  Guide to upload data after create a network

    var currentReachedStep=parseInt(localStorage.getItem('VistorianTour'));
    if (currentReachedStep<2){
        currentButton="network_cxreation";
        localStorage.setItem('VistorianTour', '2');

        intro.setOptions({
            steps:allSteps.slice(2,5)
        });
        intro.start();
    }
} 
function guide_afterLinkTableUpload(){
    allSteps=returnRequiredSteps();

    var currentReachedStep=parseInt(localStorage.getItem('VistorianTour'));
    if (currentReachedStep<=2 ){

        currentButton="LK_Upload";
        localStorage.setItem('VistorianTour', '3');

        // wait for link/node table to be populated with data and then start the guide.
        tableUpdateTimer = setTimeout(function(){

            intro.setOptions({
                steps:allSteps.slice(5,8)
            });;

            intro.start();
        }, 2000);
    }
}

function guide_afterNodeTableUpload(){
    allSteps=returnRequiredSteps();

    var currentReachedStep=parseInt(localStorage.getItem('VistorianTour'));
    if (currentReachedStep<=2){

        currentButton="NT_Upload";
        localStorage.setItem('VistorianTour', '4');

        // wait for link/node table to be populated with data and then start the guide.
        tableUpdateTimer = setTimeout(function(){

            intro.setOptions({
                steps:allSteps.slice(8,11)
            });

            intro.start();
        }, 2000);
    }
}

/* 
$('.linkTableDiv .schemaRow').bind('DOMSubtreeModified', function(){
    console.log("inside dom modification");
     if (document.querySelectorAll('.schemaSelection').length!=0){
      
         guide_afterLinkTableUpload();
     }
     
        
});  */
/* document.querySelector('#linkTableDiv').addEventListener('change', function(){
       if (document.querySelectorAll('#linkTableDiv .schemaRow').length!=0){
        console.log("inside  ready doc");
        guide_afterLinkTableUpload();
    }
});   */      

 /* var targetNode = document.querySelector('#linkTableDiv');

// Options for the observer (which mutations to observe)
var config = { attributes: true, childList: true, subtree:true };

// Callback function to execute when mutations are observed
var callback = function(mutationsList) {
    mutationsList.forEach(function (mutation){
        console.log(mutation);
        if (document.querySelectorAll('#linkTableDiv .schemaRow').length!=0)
            guide_afterLinkTableUpload();
    })
    
};

// Create an observer instance linked to the callback function
var observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
observer.observe(targetNode, config);
  */
// Later, you can stop observing
//observer.disconnect();
 

function restartTour(){
    allSteps=returnRequiredSteps();

    // restart the whole tour based on the step the user has reached.
    var stepReached = parseInt(localStorage.getItem('VistorianTour'));
    var selectedSteps=[];
    
    switch(stepReached){
        case 1:
            selectedSteps=allSteps.slice(0,2);
            break;
        case 2:
            selectedSteps=allSteps.slice(0,5);
            break;
        case 3:
            selectedSteps=allSteps.slice(0,8);
            break;
        case 4:
            selectedSteps=allSteps.slice(0,5);
            allSteps.slice(8,11).forEach(step => selectedSteps.push(step));
            break;
        case 6:
            selectedSteps=allSteps.slice(0,8);
            allSteps.slice(11,18).forEach(step => selectedSteps.push(step));

            break;
        case 7:
            selectedSteps=allSteps.slice(0,5);
            allSteps.slice(8,18).forEach(step =>selectedSteps.push(step));
            break;
        
        
    }
    intro.setOptions({
        steps:selectedSteps
    });
    intro.start();
}




window.addEventListener('load', function () {
    // Check if this is the first time the user lands on the page ==>start the tour.
    var doneTour = (parseInt(localStorage.getItem('VistorianTour')) >= 1);
    if (doneTour) {
        return;
    }
    else {
        startFromTheBeginning();
        //intro.start()

        intro.oncomplete(function () {
            if (currentButton=="start")
                localStorage.setItem('VistorianTour', '1');
            else if (currentButton=="network_creation")
                localStorage.setItem('VistorianTour', '2');
            else if (currentButton=="LK_Upload")
                localStorage.setItem('VistorianTour', '3');
            else if (currentButton=="NT_Upload")
                localStorage.setItem('VistorianTour', '4');
            else if (currentButton=="link_network_ready")
                localStorage.setItem('VistorianTour', '6');
            else if (currentButton=="node_network_ready")
                localStorage.setItem('VistorianTour', '7');
        });

        intro.onexit(function () {
            if (currentButton=="start")
                localStorage.setItem('VistorianTour', '1');
            else if (currentButton=="network_creation")
                localStorage.setItem('VistorianTour', '2');
            else if (currentButton=="LK_Upload")
                localStorage.setItem('VistorianTour', '3');
            else if (currentButton=="NT_Upload")
                localStorage.setItem('VistorianTour', '4');  
            else if (currentButton=="link_network_ready")
                localStorage.setItem('VistorianTour', '6');
            else if (currentButton=="node_network_ready")
                localStorage.setItem('VistorianTour', '7');      
            });
    }
});

function startVisGuide(networkStatus){
    allSteps=returnRequiredSteps();

    
    if (networkStatus){
        var tourStep=parseInt(localStorage.getItem('VistorianTour'));
        
        if (tourStep<3 || tourStep>4)
            return;
        else if (tourStep==3){
            currentButton="link_network_ready";
            localStorage.setItem('VistorianTour', '6');
            
        }
        else  if (tourStep==4){
            currentButton="node_network_ready";
            localStorage.setItem('VistorianTour', '7');
        }
        
            
        
        intro.setOptions({
            steps:allSteps.slice(11,18)
        });
        intro.start();
    }

}