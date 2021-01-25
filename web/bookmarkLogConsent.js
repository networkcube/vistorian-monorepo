
                
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
  }



}
function toggleConsntModel(){
  if (document.getElementById('consentOnoffswitch').checked){
    if (document.getElementById('chk_dontShowConsent').checked)
      turnOnLogging();
    else
        document.getElementById('myModal').style.display = "block";
  }
  else
    turnLoggingOff();
}

