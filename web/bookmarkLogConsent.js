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

const INACTIVE_USER_TIME_THRESHOLD = 300000; //300000 = 5 minutes
// const USER_ACTIVITY_THROTTLER_TIME = 120000 ; // 60000= 1 minute throttler

let userActivityTimeout = null;
// let userActivityThrottlerTimeout = null;
// let isInactive = false;

activateActivityTracker();


//register the interactions' events with the function responsible
function activateActivityTracker() {
 // if (!  (localStorage.getItem("stopFeedbackPopup"))){
    window.addEventListener("mousemove", userActivityTracker);//userActivityThrottler);
    window.addEventListener("mousedown", userActivityTracker);
    window.addEventListener("click", userActivityTracker);
    window.addEventListener("scroll", userActivityTracker);
    window.addEventListener("keypress", userActivityTracker);
    window.addEventListener("resize", userActivityTracker);
    window.addEventListener("beforeunload", inactiveUserAction);
  
 // }
}


function  deactivateActivityTracker() {
  window.removeEventListener("mousemove", userActivityTracker);
  window.removeEventListener("mousedown", userActivityTracker);
  window.removeEventListener("click", userActivityTracker);
  window.removeEventListener("scroll", userActivityTracker);
  window.removeEventListener("keypress", userActivityTracker);
  window.removeEventListener("resize", userActivityTracker);
  window.removeEventListener("beforeunload", inactiveUserAction);
}

function userActivityTracker(){
  clearTimeout(userActivityTimeout);
  userActivityTimeout = setTimeout(checkDispalyOfInactivity, INACTIVE_USER_TIME_THRESHOLD);
}

function checkDispalyOfInactivity(){
  var nowTime=new Date();
  var lastLoggedActvityTime=localStorage.getItem("userInactivityloggedTime");
  if (nowTime-lastLoggedActvityTime>=INACTIVE_USER_TIME_THRESHOLD)
    inactiveUserAction();

}
/* function resetUserActivityTimeout() {
  //When the user interacts with the APP

  clearTimeout(userActivityTimeout);

  userActivityTimeout = setTimeout(() => {
    userActivityThrottler();
    inactiveUserAction();
  }, INACTIVE_USER_TIME_THRESHOLD);
} */

function inactiveUserAction() {
   // isInactive = true;//isActive=false
    var urlTxt=window.location.pathname;
    urlTxt=urlTxt.substring(urlTxt.lastIndexOf("/")+1,urlTxt.indexOf("."));
    if (urlTxt=="logbook" || urlTxt=="dataview" || urlTxt!=localStorage.getItem("currentPageInFocus"))
        return;
    var popupElement;
    if (!window.document.getElementById("popupFeedbackForm"))
      popupElement=window.parent.document.getElementById("popupFeedbackForm");
    else 
      popupElement=window.document.getElementById("popupFeedbackForm");


    popupElement.setAttribute("style","display:block");
    //set timer timestamp to check cross all site webpages
    localStorage.setItem("userInactivityloggedTime",(new Date().getTime()));
    trace.event('log_13', 'no activity detected', 'current web page', window.location.pathname);
}


/* function userActivityThrottler() {
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
} */
//function disablingFeedbackPopup(chk){


function disablingFeedbackPopup(){
  /* if (chk.checked)
    localStorage.setItem("stopFeedbackPopup", "true");
   

  if (localStorage.getItem("stopFeedbackPopup")){
    clearTimeout(userActivityTimeout);
    clearTimeout(userActivityThrottlerTimeout);
    deactivateActivityTracker();
  }
  else*/
 // userActivityThrottler();

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
  if (clickedButton.value=="Analyze Data")
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
  document.getElementById("txt_other").value="";
  document.getElementById("txt_title").value="";
  document.getElementById("feedback_text_popup").value="";
  document.getElementById("OtherType_div").style.display="none"; 

  document.getElementById('popupFeedbackForm').style.display="none";
  
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
var generalPBtns=["Analyze Data","Learn","Demo to others","Test & Explore Vistorian","Discuss Findings","Report an Issue"];

function refreshBookmarks(){

  var bkFrame=document.getElementById("myFrame");
  var bkFrameDoc;
  if (bkFrame)
      bkFrameDoc=(bkFrame.contentDocument || bkFrame.contentWindow.document);
  else
      bkFrameDoc=document;

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
              }

              var frmChk=bkFrameDoc.getElementById("frmcheck_"+id);
              if (visBookmarksArray[i].type=="Analyze Data"){
                  frmChk.style.display="block";
                  for (var cntr=0;cntr<visBookmarksArray[i].analysisOpts.length;cntr++)
                      bkFrameDoc.getElementsByName("chkGroup_"+id)[cntr].checked=checkOptionExistance(cntr,visBookmarksArray[i].analysisOpts);
                }
              else
                  frmChk.style.display="none";
                    
              
                for (var m=0;m<generalPBtns.length;m++){
                  if (visBookmarksArray[i].type== generalPBtns[m]){
                    checkOtherType=false;
                    break;
                  }
                
                }
                var txt_OtherTypeCont=bkFrameDoc.getElementById("txt_otherType_"+id);
                if (checkOtherType){
                  txt_OtherTypeCont.setAttribute("style","display:block;visibility: visible;");
                    //bkFrameDoc.getElementsByName("menuButton_"+id)[divBtns.length-1].style.backgroundColor= "#FF7F50"; 
                }
                else
                  txt_OtherTypeCont.style.display="none";

          }
        }
      if (bkFrameDoc!=document)
        document.getElementById('myFrame').src=document.getElementById('myFrame').src;
        
  bkFrame=document.getElementById("myFrame");

  if (bkFrame)
    bkFrame=bkFrame.contentWindow;
  else 
    bkFrame=window;

  localStorage.setItem("currentPageInFocus",bkFrame.viewType);
  trace.event('log_17', 'page', 'focus', document.location.pathname);

}

function populateNewBookmark(){
  let btns=window.document.getElementsByClassName('feedbackMenuButton');

  let titleText=document.getElementById("txt_title").value;
  let chosentType="",notesText="";
  let analysisOps=[];
  for (var i=0;i<btns.length;i++){
  //Set main type of usage
  if (btns[i].style.backgroundColor=="rgb(255, 127, 80)"){
      chosentType= btns[i].value;
      trace.event('log_14', 'general feedback - bookmark type', btns[i].value, window.location.pathname);
      //Set analysis type - if selected-
      if (btns[i].value=="Analyze Data"){
          let chks=document.getElementsByName('chks_feebackForm');
          for (var j=0;j<chks.length;j++){
              if (chks[j].checked)
                  analysisOps.push( chks[j].value);
              }
      }
      
      //check if type was other
      if (btns[i].value=="Other"){
          chosentType= window.document.getElementById('txt_other').value;
      }
  }
}
  if (chosentType.length==0){
    alert("You did not specify the type of your bookmark!");
    return;
  }
  //add general feedback
  notesText= window.document.getElementById('feedback_text_popup').value;

  var bkFrame=document.getElementById("myFrame").contentWindow;

  bkFrame.AddNewLog(0,'',titleText,notesText,chosentType,analysisOps,bkFrame.viewType,bkFrame.networkName);

    resetFeedbackForm();
    
    trace.event('bkm_11', ' New Bookmark Created', 'Saved', window.parent.location.pathname);
}

window.onblur=(function(){
  trace.event('log_18', 'page', 'blur', document.location.pathname);

});

window.addEventListener('beforeunload', (event) => {

  var bkFrame=document.getElementById("myFrame");
  var bkFrameDoc;
  if (bkFrame)
      bkFrameDoc=(bkFrame.contentDocument || bkFrame.contentWindow.document);
  else
      bkFrameDoc=document;
  var statusText=  bkFrameDoc.getElementById('lbl_changesState').innerText;

  if (statusText=="Changes have not been saved yet. Click Save button"){
    event.returnValue = "Are you sure you want to leave?";
  }
});

function deleteCurrentNetworkBookmarks(){
  if (confirm('Do you want to delete all bookmarks related to the deleted network? ')){
    var visBookmarks = localStorage.getItem("vistorianBookmarks");
    var  visBookmarksArray = JSON.parse(visBookmarks);
    var bkFrame=document.getElementById("myFrame");
    let networkName;
    if (bkFrame)
      networkName=document.getElementById('networknameInput').value;
    else
      networkName=window.parent.document.getElementById('networknameInput').value;
  
    var i;
    if (visBookmarks){  
      for ( i=0;i<visBookmarksArray.length;i++)
        if ( visBookmarksArray[i].networkDataset==networkName)
            visBookmarksArray.splice(i,1); 
          
      localStorage.setItem("vistorianBookmarks", JSON.stringify(bookmarksArray))
      refreshBookmarks();
    }
  
  }
}