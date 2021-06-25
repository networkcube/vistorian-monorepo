
const intro=introJs();

var currentButton="start";

var allSteps= [
            {
                title: "Welcome to The Vistorian Tour Guide",
                intro: "Through this tour we will introudce you to The Vistorian and its new features!",
                step: "0"
            },
            {
                title: "Try Vistorian Lab Now (NEW Feature)! ",
                element: document.querySelector('#consentFormBK'),
                intro: "The Vistorian Lab is your new research assistant! It will help you to analyze your data and capture your findings. Please support our research through allowing us to anonymously track your interactions with the Vistorian. We will not record your network data. Find  more about <a href='https://vistorian.github.io/studyPhase1_activityLogging.html' target='_blank' >here </a>.",
                step: "1"
            }, 
            {
                title: "First-Step: Create a New Network",
                element: document.querySelector('#btn_newNetwork'),
                intro: "Start by clicking here to create a new network.",
                step: "2"
            },
            {
                element: document.querySelector('#lbl_uploadLinkTable'),
                title:"Second-Step: Upload Your Data Table", 
                intro:"Click here to upload your table if it is a LINK table.",
                step: "3"
            },
            {
                element: document.querySelector('#lbl_uploadNodeTable'),
                title:"Second-Step: Upload Your Data Table", 
                intro:"Click here to upload your table if it is a NODE table.",
                step: "4"
            },
            {
                element: document.querySelector('#btn_updateCoordinates'),
                title:"Third-Step: Update Locations Coordinates (Optional)", 
                intro:"Click here after uploading your link/node table and if your data contains locations (ex. cities) in order to update locations' coordinates",
                step: "5"
            },
            {
                element: document.querySelector('#directedNetworkCheckBox'),
                title:"Is your network directed?", 
                intro:"Ensure this box is checked if your network is directed.",
                step: "6"
            },
            {
                //element: document.querySelectorAll('.schemaCell')[1],
                element: document.getElementById('schemaCell_userLinkSchema_1'),
                title:"Specify Column Type", 
                intro:"For each column of your intrest, specify how you describe such the data  of such attribute. If the network is directed then choose types for example: Source Node, Target Node. For undirected networks choose for example: Node 1 and Node 2.  ",
                step: "7"
            },
            {
                element: document.getElementById('schemaCell_userLinkSchema_2'),
                title:"Specify Column Type", 
                intro:"You need to specify at least two columns to create a network: Source Node/Node1 and Target Node/Node 2. You can describe more columns as needed (ex. location, date, ..).",
                step: "8"
            },
            {
                element: document.querySelector('#networkStatus'),
                title:"Network's Readiness for Visualization", 
                intro:"Once your network is ready for visualization, this header will turn into green.",
                step: "9"
            },
            {
                element: document.getElementById('schemaCell_userNodeSchema_1'),
                title:"Specify Column Type", 
                intro:"For each column of your intrest, specify how you describe such the data  of such attribute.",
                step: "10"
            },
            {
                element: document.getElementById('schemaCell_userNodeSchema_2'),
                title:"Specify Column Type", 
                intro:"You need to specify at least two columns to create a network: Node label and relation. You can describe more columns as needed (ex. location, time, ..).",
                step: "11"
            },
            {
                element: document.querySelector('#networkStatus'),
                title:"Network's Readiness for Visualization", 
                intro:"Once your network is ready for visualization, this header will turn into green.",
                step: "12"
            },
            {
                element: document.querySelectorAll('.visLink')[0],
                title:"Nodelink Visualization", 
                intro:"Click here to create a nodelink visualization.",
                step: "13"
            },
            {
                element: document.querySelectorAll('.visLink')[1],
                title:"Matrix Visualization", 
                intro:"Click here to create a matrix visualization.",
                step: "14"
            },
            {
                element: document.querySelectorAll('.visLink')[2],
                title:"Time Arcs Visualization", 
                intro:"Click here to create a time arcs visualization.",
                step: "15"
            },
            {
                element: document.querySelectorAll('.visLink')[3],
                title:"Map Visualization", 
                intro:"Click here to create a map visualization. Ensure you have updated locations coordinates.",
                step: "16"
            },
            {
                element: document.querySelectorAll('.visLink')[4],
                title:"Nodelink and Matrix Visualizations", 
                intro:"Create both nodelink and matrix visualizations. This allows you to compare and analyze your network using both representations.",
                step: "17"
            }

            
        
        ];
  //addStepAfterLKUpload

function startFromTheBeginning(){
    // Start from scratch - Guide to create a network
    intro.setOptions({
        steps:allSteps.slice(0,3)
    });
    intro.start();
}
function guide_afterNetworkCreation(){
    //  Guide to upload data after create a network
    currentButton="network_creation";
    localStorage.setItem('VistorianTour', '2');

    intro.setOptions({
        steps:allSteps.slice(3,7)
    });
    intro.start();
} 
function guide_afterLinkTableUpload(){
    currentButton="LK_Upload";
    localStorage.setItem('VistorianTour', '3');

    // wait for link/node table to be populated with data and then start the guide.
    tableUpdateTimer = setTimeout(function(){

        intro.setOptions({
            steps:[{
                element: document.getElementById('schemaCell_userLinkSchema_1'),
                title:"Specify Column Type", 
                intro:"For each column of your intrest, specify how you describe such the data  of such attribute. If the network is directed then choose types for example: Source Node, Target Node. For undirected networks choose for example: Node 1 and Node 2.  ",
                step: "7"
            },
            {
                element: document.getElementById('schemaCell_userLinkSchema_2'),
                title:"Specify Column Type", 
                intro:"You need to specify at least two columns to create a network: Source Node/Node1 and Target Node/Node 2. You can describe more columns as needed (ex. location, date, ..).",
                step: "8"
            },
            {
                element: document.querySelector('#networkStatus'),
                title:"Network's Readiness for Visualization", 
                intro:"Once your network is ready for visualization, this header will turn into green.",
                step: "9"
            }
            ]
        });

        intro.start();
    }, 5000);
    
}

function guide_afterNodeTableUpload(){
    currentButton="NT_Upload";
    localStorage.setItem('VistorianTour', '4');

    // wait for link/node table to be populated with data and then start the guide.
    tableUpdateTimer = setTimeout(function(){

        intro.setOptions({
            steps:[{
                element: document.getElementById('schemaCell_userNodeSchema_1'),
                title:"Specify Column Type", 
                intro:"For each column of your intrest, specify how you describe such the data  of such attribute.",
                step: "10"
            },
            {
                element: document.getElementById('schemaCell_userNodeSchema_2'),
                title:"Specify Column Type", 
                intro:"You need to specify at least two columns to create a network: Node label and relation. You can describe more columns as needed (ex. location, time, ..).",
                step: "11"
            },
            {
                element: document.querySelector('#networkStatus'),
                title:"Network's Readiness for Visualization", 
                intro:"Once your network is ready for visualization, this header will turn into green.",
                step: "12"
            }
            ]
        });

        intro.start();
    }, 5000);
    
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
    // restart the whole tour based on the step the user has reached.
    var stepReached = parseInt(localStorage.getItem('VistorianTour'));
    var selectedSteps=[];
    switch(stepReached){
        case 1:
            selectedSteps=allSteps.slice(0,3);
            break;
        case 2:
            selectedSteps=allSteps.slice(0,7);
            break;
        case 3:
            selectedSteps=allSteps.slice(0,10);
            break;
        case 4:
            selectedSteps=allSteps.slice(0,7);
            selectedSteps.push(allSteps.slice(10,13));
            break;
        case 6:
            selectedSteps=allSteps.slice(0,10);
            selectedSteps.push(allSteps.slice(13,18));
            break;
        case 7:
            selectedSteps=allSteps.slice(0,7);
            selectedSteps.push(allSteps.slice(10,18));
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
    if (networkStatus){
        
        
        if (parseInt(localStorage.getItem('VistorianTour'))==3){
            currentButton="link_network_ready";
            localStorage.setItem('VistorianTour', '6');
        }
        else  if (parseInt(localStorage.getItem('VistorianTour'))==4){
            currentButton="node_network_ready";
            localStorage.setItem('VistorianTour', '7');
        }
        else
            return;
        
        intro.setOptions({
            steps:allSteps.slice(13,18)
        });
        intro.start();
    }

}