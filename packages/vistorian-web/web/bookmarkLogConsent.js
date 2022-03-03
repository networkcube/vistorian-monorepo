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
    var urlTxt=window.location.pathname;
    urlTxt=urlTxt.substring(urlTxt.lastIndexOf("/")+1,urlTxt.indexOf("."));

    localStorage.setItem("acceptLogging", "false");
    trace.event('log_10', 'VistorianLab', 'OFF', urlTxt);
    var checkBox = document.getElementById("consentOnoffswitch");
    checkBox.checked=false;
    var bookmarksTool = document.getElementById("mydiv");
    //document.getElementById('myModal').style.display = "none";
    bookmarksTool.style.display = "none";
    var feedbackButton=document.querySelectorAll(".feedback a")[0];
    if (feedbackButton)
        feedbackButton.style.display = "none";
    // To be activaited upon optional logging  
   // deactivateActivityTracker()

}

function turnOnLogging(){
   var urlTxt=window.location.pathname;
    urlTxt=urlTxt.substring(urlTxt.lastIndexOf("/")+1,urlTxt.indexOf("."));
    // To be deactivaited upon optional logging
    //  activateActivityTracker();
    localStorage.setItem("acceptLogging", "true");
    trace.event('log_9', 'VistorianLab', 'ON', urlTxt);
    var bookmarksTool = document.getElementById("mydiv"); 
    if (bookmarksTool)
        bookmarksTool.style.display = "block";
    var feedbackButton=document.querySelectorAll(".feedback a")[0];
    if (feedbackButton)
        feedbackButton.style.display = "block";    
    if (localStorage.getItem("bookmarkMinimized")==="true")
      minimizeBookmarks();
    else
      maxmizeBookmarks();
    //var mdl=document.getElementById('myModal');
    //if (mdl)    
      //mdl.style.display = "none";    
}

function checkLogStatus(){
    if (localStorage.getItem("acceptLogging")==="true"){
        var checkBox = document.getElementById("consentOnoffswitch");
        if (checkBox)
          checkBox.checked=true;
        turnOnLogging();
    }
}

var toolbarMHeight,toolbarMWidth,toolbarTop,toolbarLeft,bookmarkMinimized=false;

function minimizeBookmarks(){
  var parentUrlTxt=window.parent.location.pathname;
  parentUrlTxt=parentUrlTxt.substring(parentUrlTxt.lastIndexOf("/")+1,parentUrlTxt.indexOf("."));

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
   // trace.event('bkm_8', ' bookmark window ', 'minimized', parentUrlTxt);
    localStorage.setItem("bookmarkMinimized","true");
  }
}
function maxmizeBookmarks(){
  var parentUrlTxt=window.parent.location.pathname;
  parentUrlTxt=parentUrlTxt.substring(parentUrlTxt.lastIndexOf("/")+1,parentUrlTxt.indexOf("."));

  if (bookmarkMinimized){
    document.getElementById("mydiv").style.maxHeight = toolbarMHeight +"px";
    document.getElementById("mydiv").style.maxWidth=toolbarMWidth+"px";
    document.getElementById("mydiv").style.top=toolbarTop+"px";
    document.getElementById("mydiv").style.left=toolbarLeft+"px";
    document.getElementById("myFrame").style.display = "Block";
    bookmarkMinimized=false;
    //trace.event('bkm_8', ' bookmark window ', 'maximized', parentUrlTxt);
    localStorage.setItem("bookmarkMinimized","false");


  }



}
function toggleConsntModel(){
  var parentUrlTxt=window.parent.location.pathname;
  parentUrlTxt=parentUrlTxt.substring(parentUrlTxt.lastIndexOf("/")+1,parentUrlTxt.indexOf("."));

  if (document.getElementById('consentOnoffswitch').checked){
    //if (document.getElementById('chk_dontShowConsent').checked)
      turnOnLogging();
      
   // else{
        //document.getElementById('myModal').style.display = "block";
        //trace.event('log_5', ' Consent Form ', 'Displayed', parentUrlTxt);

   // }
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


//turn it on for all users upon arrival
activateActivityTracker();

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
  var nowTime=new Date().getTime();
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
    if (!window.document.getElementById("timeoutPopupForm"))
      popupElement=window.parent.document.getElementById("timeoutPopupForm");
    else 
      popupElement=window.document.getElementById("timeoutPopupForm");


    popupElement.setAttribute("style","display:block");
    //set timer timestamp to check cross all site webpages
    localStorage.setItem("userInactivityloggedTime",(new Date().getTime()));
    trace.event('log_13', 'page', 'No activity detected', urlTxt);
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


  resetFeedbackForm();
}

function displaySubOptions(clickedButton,classNameUsed,chksDiv,OtherDiv){
  let btns=document.getElementsByClassName(classNameUsed);
   for (var i=0;i<btns.length;i++){
      if (clickedButton.value==btns[i].value)
          clickedButton.style.backgroundColor= "#FF7F50";                     
      else 
          btns[i].style.backgroundColor= "#bbb"; 
  }
  if (clickedButton.value=="Analyze Data")
      document.getElementById(chksDiv).style.display="inline-block";
  else
      document.getElementById(chksDiv).style.display="none";
  if (clickedButton.value=="Other")
      document.getElementById(OtherDiv).style.display="inline-block";
  else
      document.getElementById(OtherDiv).style.display="none"; 
}


// Logging Feedback from the general feedback gadget
function LoggingGeneralFeedback(){

  var urlTxt=window.location.pathname;
  urlTxt=urlTxt.substring(urlTxt.lastIndexOf("/")+1,urlTxt.indexOf("."));
    let btns=document.getElementsByClassName('menuButtonGadget');
    for (var i=0;i<btns.length;i++)
      //Set main type of usage
       if (btns[i].style.backgroundColor=="#FF7F50")
        trace.event('log_14', 'general feedback - bookmark type', btns[i].value, urlTxt);
        //Set analysis type - if selected-
        
        //add general feedback
        trace.event('log_15', 'General feedback', document.getElementById('feedback_text').value, urlTxt);

}



// Logging Feedback from the popup questionairre
function LoggingFeedback(){
  var urlTxt=window.location.pathname;
  urlTxt=urlTxt.substring(urlTxt.lastIndexOf("/")+1,urlTxt.indexOf("."));

    let btns=document.getElementsByClassName('feedbackMenuButton');
    for (var i=0;i<btns.length;i++){
      //Set main type of usage
       if (btns[i].style.backgroundColor=="#FF7F50"){
        trace.event('log_14', 'timeout popup feedback - bookmark type', btns[i].value, urlTxt);
        //Set analysis type - if selected-
        if (btns[i].value=="Analyze Data"){
          let chks=document.getElementsByName('chks_timeoutFeebackForm');
          for (var i=0;i<chks.length;i++){
            if (chks[i].checked)
                trace.event('bkm_6', ' bookmark analysis type selected', chks[i].value, urlTxt);
          }
        }
        
        if (btns[i].value=="Other")
          trace.event('bkm_3', ' bookmark type specified', 'Other: ' + document.getElementById('txt_other_timeout').value, urlTxt);
       }
      }

    document.getElementById('timeoutPopupForm').style.display="none";


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

function resetSupportRequestFeedbackForm(msg){

  
  var urlTxt=window.location.pathname;
  urlTxt=urlTxt.substring(urlTxt.lastIndexOf("/")+1,urlTxt.indexOf("."));
  document.getElementById("userEmail").value="";
  document.getElementById("txt_errorDescriptionByUser").value="";
  document.getElementById('errorFeedbackFormModel').style.display="none";
  if (msg=='cancel')
    trace.event('log_18', 'Support Request Form', 'Canceled', urlTxt);
  else
    trace.event('log_17', 'Support Request Form', 'Submiited', urlTxt);

}

function resetTimeOutFeedbackForm(){
  let btns=document.getElementsByClassName('timeoutFeedbackMenuButton');
  for (var i=0;i<btns.length;i++)
    btns[i].style.backgroundColor="#bbb";
  
  let chks=document.getElementsByName('chks_timeoutFeebackForm');
      for (var i=0;i<chks.length;i++)
        chks[i].checked=false;

  document.getElementById("timeoutCheckboxes_group_div").style.display="none";
  document.getElementById("txt_other_timeout").value="";
  document.getElementById("timeoutOtherType_div").style.display="none"; 

  document.getElementById('timeoutPopupForm').style.display="none";
  
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

  var urlTxt=window.location.pathname;
  urlTxt=urlTxt.substring(urlTxt.lastIndexOf("/")+1,urlTxt.indexOf("."));

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
  if (visBookmarks && bkFrame){

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
  trace.event('log_17', 'page', 'focus', urlTxt);
  checkLogStatus();

}

function populateNewBookmark(){

  var urlTxt=window.location.pathname;
  urlTxt=urlTxt.substring(urlTxt.lastIndexOf("/")+1,urlTxt.indexOf("."));

  var parentUrlTxt=window.parent.location.pathname;
  parentUrlTxt=parentUrlTxt.substring(parentUrlTxt.lastIndexOf("/")+1,parentUrlTxt.indexOf("."));

  let btns=window.document.getElementsByClassName('feedbackMenuButton');

  let titleText=document.getElementById("txt_title").value;
  let chosentType="",notesText="";
  let analysisOps=[];
  for (var i=0;i<btns.length;i++){
  //Set main type of usage
  if (btns[i].style.backgroundColor=="rgb(255, 127, 80)"){
      chosentType= btns[i].value;
      trace.event('log_14', 'general feedback - bookmark type', btns[i].value, urlTxt);
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

    
    trace.event('bkm_11', ' New Bookmark Created', 'Saved', parentUrlTxt);
}

window.onblur=(function(){
  var urlTxt=window.location.pathname;
  urlTxt=urlTxt.substring(urlTxt.lastIndexOf("/")+1,urlTxt.indexOf("."));
  trace.event('log_18', 'page', 'blur', urlTxt);

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

const ErrorFormTrigger=3;

window.addEventListener('error', (event) => {
  //log error
  //trace.event('err', event + ' ' + source + lineno, error, document.location.pathname);

  // Get Page Name
  var urlTxt=window.location.pathname;
  urlTxt=urlTxt.substring(urlTxt.lastIndexOf("/")+1,urlTxt.indexOf("."));

  // Store errors list
  var errorsList= JSON.parse((localStorage.getItem("vistorianErrorsList") || "[]"));
  var errorOccured={'event':event.message, 'source':event.filename, 'lineno':event.lineno,'error':event.error, 'page':urlTxt};
  errorsList.push(errorOccured);
  localStorage.setItem("vistorianErrorsList",JSON.stringify(errorsList));

  //Check number of error to show Support Request Form
  var errorCounter= parseInt((localStorage.getItem("vistorianErrorsCounter") || "0"));
  errorCounter++;
  if  (errorCounter<ErrorFormTrigger){
    localStorage.setItem("vistorianErrorsCounter",errorCounter);
  }
  else{
      document.getElementById('txt_sessionID_errorForm').value= (localStorage.getItem('SessionLogId') || "None - [VistorianLab Status (off)]");
      document.getElementById('txt_errorsList').value=(localStorage.getItem('vistorianErrorsList') || "");
      var visLabStatus;
      if (localStorage.getItem("acceptLogging")==="true")
          visLabStatus="On";
      else
          visLabStatus="Off";
    
      document.getElementById('txt_vistorianLabStatus').value= visLabStatus;
      document.getElementById('errorFeedbackFormModel').style.display = "block";
      trace.event('log_17', ' Support Request Form ', 'Displayed', urlTxt);
      localStorage.setItem("vistorianErrorsCounter",0);
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


//Show support request form on error occurance
function sendSupportRequestForm(){
  //
    message="Thank you for submitting support request form. In the meantime, please refresh the current page and try again what you had in mind. We are working on your issue. Apologies and thank you very much for reporting.";
  
    var emailParam= {
      sessionID: document.getElementById('txt_sessionID_errorForm').value,
      vistorianLabStatus: document.getElementById('txt_vistorianLabStatus').value,
      email: document.getElementById('userEmail').value,
      issueDescription: document.getElementById('txt_errorDescriptionByUser').value,
      errorsList: document.getElementById('txt_errorsList').value
    }

    emailjs.send('service_jwbha6x', 'template_j7at6tq', emailParam)
    .then(function(res){
        console.log("Succes ",res.status);

    });
    resetSupportRequestFeedbackForm('confirm');
}