window.onload = (event) => {
  console.log('page is fully loaded');
};
                
function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    /* if present, the header is where you move the DIV from:*/
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    /* otherwise, move the DIV from anywhere inside the DIV:*/
    elmnt.onmousedown = dragMouseDown;
  }

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
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function turnLoggingOff(){
    localStorage.setItem("acceptLogging", 'false');
    trace.event('log_10', 'stop logging', 'webpage', document.location.pathname);
    var checkBox = document.getElementById("consentOnoffswitch");
    checkBox.checked=false;
    var bookmarksTool = document.getElementById("mydiv");
    document.getElementById('myModal').style.display = "none";
    bookmarksTool.style.display = "none";

}

function turnOnLogging(){
    localStorage.setItem("acceptLogging", 'true');
    trace.event('log_9', 'start logging', 'webpage', document.location.pathname);
    var bookmarksTool = document.getElementById("mydiv"); 
    bookmarksTool.style.display = "block";
    document.getElementById('myModal').style.display = "none";
}

function checkLogStatus(){
    if (localStorage.getItem("acceptLogging")){
        var checkBox = document.getElementById("consentOnoffswitch");
        checkBox.checked=true;
        turnOnLogging();
    }
}
var toolbarMHeight,toolbarMWidth,toolbarTop,toolbarLeft,bookmarkMinimized=false;
function minimizeBookmarks(){
  if (!bookmarkMinimized){
    toolbarMHeight=document.getElementById("mydiv").offsetHeight;
    toolbarMWidth=document.getElementById("mydiv").offsetWidth;
    toolbarTop=document.getElementById("mydiv").offsetTop;
    toolbarLeft=document.getElementById("mydiv").offsetLeft;
    document.getElementById("mydiv").style.top="0px";//(parseInt(screen.outerHeight)-parseInt(document.getElementById("mydiv").style.maxHeight)) +"px";
   // document.getElementById("mydiv").style.left=(parseInt(document.getElementById("mydiv").offsetWidth)-parseInt(screenX)) +"px";
    document.getElementById("myFrame").style.display = "none";
    document.getElementById("mydiv").style.maxHeight = document.getElementById("mydivheader").scrollHeight +"px";
    bookmarkMinimized=true;
    trace.event('bkm_8', ' bookmark window ', 'minimized', window.parent.location.pathname);
  }
}
function maxmizeBookmarks(){
  if (bookmarkMinimized){
    document.getElementById("mydiv").style.maxHeight = toolbarMHeight +"px";
    document.getElementById("mydiv").style.maxWidth=toolbarMWidth+"px";
    document.getElementById("mydiv").style.top=toolbarTop+"px";
    document.getElementById("mydiv").style.left=toolbarLeft+"px";
    document.getElementById("myFrame").style.display = "Block";
    bookmarkMinimized=false;
    trace.event('bkm_8', ' bookmark window ', 'maximized', window.parent.location.pathname);

  }



}
function toggleConsntModel(){
  if (document.getElementById('consentOnoffswitch').checked){
    if (document.getElementById('chk_dontShowConsent').checked)
      turnOnLogging();
    else{
        document.getElementById('myModal').style.display = "block";
        trace.event('log_5', ' Consent Form ', 'Displayed', window.parent.location.pathname);

    }
  }
  else
    turnLoggingOff();
}


$(function () {
  $("body").on("click", ".feedback_active", function (e) {
    $(".feedback .thanks").hide();
    $(".feedback .form").hide();
    $(".feedback a").show();
    $(".feedback_active").hide();
    e.preventDefault();
  });
  $(".menuButtonGadget").on("click", function (e) {
    if ($(this).css("background-color") == "rgb(187, 187, 187)")
      $(this).css("background-color", "#FF7F50");
    else $(this).css("background-color", "#bbb");
  });

  $(".feedback a").on("click", function (e) {
    $("body").prepend("<div class='feedback_active'></div>");
    $(".feedback .form").show();
    $(".feedback .form textarea").focus();
    $(".feedback a").hide();
    e.preventDefault();
  });

  $(".form form").on("submit", function (e) {
    $(".feedback .thanks").show();
    $(".menuButtonGadget").css("background-color", "#bbb");
    $(".feedback .form").hide();

    setTimeout(function () {
      $(".feedback textarea").val("");
    }, 100);
    e.preventDefault();
  });
});

// Detecting inactive users and nudging them 
// Credit (with modification): https://css-tricks.com/detecting-inactive-users/ 

const INACTIVE_USER_TIME_THRESHOLD = 300000; //300000 = 4 minutes
const USER_ACTIVITY_THROTTLER_TIME = 120000 ; // 60000= 1 minute throttler

let userActivityTimeout = null;
let userActivityThrottlerTimeout = null;
let isInactive = false;

activateActivityTracker();


//register the interactions' events with the function responsible
function activateActivityTracker() {
  if (!  (localStorage.getItem("stopFeedbackPopup"))){
    window.addEventListener("mousemove", userActivityThrottler);
    window.addEventListener("click", userActivityThrottler);
    window.addEventListener("scroll", userActivityThrottler);
    window.addEventListener("keydown", userActivityThrottler);
    window.addEventListener("resize", userActivityThrottler);
    window.addEventListener("beforeunload", inactiveUserAction);
  
  }
}


function  deactivateActivityTracker() {
  window.removeEventListener("mousemove", userActivityThrottler);
  window.removeEventListener("click", userActivityThrottler);
  window.removeEventListener("scroll", userActivityThrottler);
  window.removeEventListener("keydown", userActivityThrottler);
  window.removeEventListener("resize", userActivityThrottler);
  window.removeEventListener("beforeunload", inactiveUserAction);
}

//When the user interacts with the APP
function resetUserActivityTimeout() {
  clearTimeout(userActivityTimeout);

  userActivityTimeout = setTimeout(() => {
    userActivityThrottler();
    inactiveUserAction();
  }, INACTIVE_USER_TIME_THRESHOLD);
}

function inactiveUserAction() {
  isInactive = true;//isActive=false
 document.getElementById('popupFeedbackForm').style.display="block";
 trace.event('log_13', 'no activity detected', 'current web page', window.location.pathname);


}


function userActivityThrottler() {
  if (isInactive) {
    isInactive = false; //isActive=true
    resetUserActivityTimeout();
  }

  if (!userActivityThrottlerTimeout) {
    userActivityThrottlerTimeout = setTimeout(() => {
      resetUserActivityTimeout();
      clearTimeout(userActivityThrottlerTimeout);
    }, USER_ACTIVITY_THROTTLER_TIME);
  }
}

function disablingFeedbackPopup(chk){
  if (chk.checked)
    localStorage.setItem("stopFeedbackPopup", "true");
  

  if (localStorage.getItem("stopFeedbackPopup")){
    clearTimeout(userActivityTimeout);
    clearTimeout(userActivityThrottlerTimeout);
    deactivateActivityTracker();
  }
  else
    userActivityThrottler();

  resetFeedbackForm();
}

function displaySubOptions(clickedButton){
  let btns=document.getElementsByClassName('feedbackMenuButton');
   for (var i=0;i<btns.length;i++){
      if (clickedButton.value==btns[i].value)
          clickedButton.style.backgroundColor= "#FF7F50";                     
      else 
          btns[i].style.backgroundColor= "#bbb"; 
  }
  if (clickedButton.value=="Analyzing Data")
      document.getElementById("checkboxes_group_div").style.display="inline-block";
  else
      document.getElementById("checkboxes_group_div").style.display="none";
  if (clickedButton.value=="Other")
      document.getElementById("OtherType_div").style.display="inline-block";
  else
      document.getElementById("OtherType_div").style.display="none"; 
}


// Logging Feedback from the general feedback gadget
function LoggingGeneralFeedback(){
  let tempLog=false;

  //check if the logging enabled, otherwise turn it temporarlly on for logging feedback
  if (localStorage.getItem("acceptLogging")==false)
      tempLog=true;

  if (tempLog)
    localStorage.setItem("acceptLogging", "true");

    let btns=document.getElementsByClassName('menuButtonGadget');
    for (var i=0;i<btns.length;i++)
      //Set main type of usage
       if (btns[i].style.backgroundColor=="#FF7F50")
        trace.event('log_14', 'general feedback - bookmark type', btns[i].value, window.location.pathname);
        //Set analysis type - if selected-
        
        //add general feedback
        trace.event('log_15', 'General feedback', document.getElementById('feedback_text').value, document.location.pathname);
      



  if (tempLog)
    localStorage.setItem("acceptLogging", "false");

}



// Logging Feedback from the popup questionairre
function LoggingFeedback(){
  let tempLog=false;

  //check if the logging enabled, otherwise turn it temporarlly on for logging feedback
  if (localStorage.getItem("acceptLogging")==false)
      tempLog=true;

  if (tempLog)
    localStorage.setItem("acceptLogging", "true");

    let btns=document.getElementsByClassName('feedbackMenuButton');
    for (var i=0;i<btns.length;i++){
      //Set main type of usage
       if (btns[i].style.backgroundColor=="#FF7F50"){
        trace.event('log_14', 'popup feedback - bookmark type', btns[i].value, window.location.pathname);
        //Set analysis type - if selected-
        if (btns[i].value=="Analyzing Data"){
          let chks=document.getElementsByName('chks_feebackForm');
          for (var i=0;i<chks.length;i++){
            if (chks[i].checked)
                trace.event('bkm_6', ' bookmark analysis type selected', chks[i].value, window.location.pathname);
          }
        }
        
        //check if type was other
        if (btns[i].value=="Other")
          trace.event('bkm_3', ' bookmark type specified', 'Other: ' + document.getElementById('txt_other').value, window.location.pathname);
       }
        //add general feedback
        trace.event('log_15', 'feedback_popup', document.getElementById('feedback_text_popup').value, document.location.pathname);
      }



  if (tempLog)
    localStorage.setItem("acceptLogging", "false");

}

function resetFeedbackForm(){
  let btns=document.getElementsByClassName('feedbackMenuButton');
    for (var i=0;i<btns.length;i++)
      btns[i].style.backgroundColor="#bbb";
  
  let chks=document.getElementsByName('chks_feebackForm');
      for (var i=0;i<chks.length;i++)
        chks[i].checked=false;
  document.getElementById("checkboxes_group_div").style.display="none";


    document.getElementById('txt_other').value="";
    document.getElementById('feedback_text_popup').value="";
    document.getElementById("OtherType_div").style.display="none"; 

    document.getElementById('popupFeedbackForm').style.display='none';
  
}

function refreshBookmarkToolbar(){
  document.getElementById('myFrame').src=document.getElementById('myFrame').src;
  
}

function checkOptionExistance(noFetched,opts){

  for (var i=0; i<opts.length ; i++)
      if (parseInt(noFetched)===parseInt(opts[i]))
          return true;
  return false;
      
}
var generalPBtns=["Analyze Data","Learn","Demo to others","Test & Explore Vistorian","Report an Issue"];

function refreshBookmarks(){
  var bkFrame=document.getElementById("myFrame");
  var bkFrameDoc = bkFrame.contentDocument;
 // var bksContainer=bkFrameDoc.getElementById("logs");
  var visBookmarks = localStorage.getItem("vistorianBookmarks");
  var  visBookmarksArray = JSON.parse(visBookmarks);
  var i,id;
  if (visBookmarks){

 // if (typeof visBookmarksArray !== "undefined" && visBookmarksArray!==null && visBookmarksArray.length!=0){
          for ( i=0;i<visBookmarksArray.length;i++){
              id=visBookmarksArray[i].id;
              bkFrameDoc.getElementById("btn_dateTime"+id).innerHTML=visBookmarksArray[i].createdOn;
              bkFrameDoc.getElementById("btn_title_"+id).innerHTML=visBookmarksArray[i].title;
              bkFrameDoc.getElementById("lbl_type_"+id).innerHTML=visBookmarksArray[i].type;
              bkFrameDoc.getElementById("txt_note_"+id).innerText=visBookmarksArray[i].note;

              var divBtns=bkFrameDoc.getElementsByName("menuButton_"+id);
              var checkOtherType=true;
              for(var j=0;j<divBtns.length;j++){
                  if(divBtns[j].value == visBookmarksArray[i].type)
                      divBtns[j].style.backgroundColor= "#FF7F50"; 
                  else 
                      divBtns[j].style.backgroundColor= "#bbb"; 

                  var frmChk=bkFrameDoc.getElementById("frmcheck_"+id);
                  if (visBookmarksArray[i].type=="Analyze Data"){
                      frmChk.style.display="block";
                      for (var cntr=0;cntr<visBookmarksArray[i].analysisOpts.length;cntr++)
                          bkFrameDoc.getElementsByName("chkGroup_"+id)[cntr].checked=checkOptionExistance(cntr,visBookmarksArray[i].analysisOpts);
                    }
                  else
                      frmChk.style.display="none";
                    
              }
              for (var m=0;m<generalPBtns.length;m++)
                if (visBookmarksArray[i].type== generalPBtns[m]){
                  checkOtherType=false;
                  break;
                }
                
              if (checkOtherType)
                  bkFrameDoc.getElementById("txt_otherType_"+id).style.display="inline-block";
              else
                bkFrameDoc.getElementById("txt_otherType_"+id).style.display="none";

          }
        }
        document.getElementById('myFrame').src=document.getElementById('myFrame').src;

}
