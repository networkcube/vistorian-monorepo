
For the moment, symlinking the vistorian dependencies into static/node_modules

Currently big re-builds fail due to these symlinks, so have to delete them, rebuild and re-add them.
Minor rebuilds don't seem to be a problem.



the sutff in lib/ is quite heavily mofieid from the original sources:

* trace.ts - exctracted contents of an IIFE, and added an `export` statement to make it a module
* createVisIframe is a copy of the function in vistorian-core/src/data/main, re-written to not use iFrame
* storage.ts is re-written to use localStorage rather than the jQuery $.jStorage API
* utils.ts contains `getUrlVars()`, copied from ?
* vistorian.ts contains only the few functions that are actually needed


removed the onoffswitch (and therefore checkLogStatus)


## dynamicego
removed onfocus: refreshBookmarks
removed dragElement(document.getElementById('mydiv')); 

instead of setHeader, we now have a LogoFrame component



Removed page footer "Page and visualizations built with" jQuey and D3
mke index page logo not a link, as it was a link to the same page



VEry hard to trace where functions are imported from, or where they are used.



////
    <body id="capture" onload="initializeJSON();"  onfocus="refreshBookmarks();"> 



                var parentDoc = window.parent.document;
                // Add New Bookmark
                Mousetrap(parentDoc).bind('ctrl+shift+a', function() {
                    if (viewType!="dataview")
                        document.getElementById('addNewBookmark').click();
                });
                Mousetrap.bind('ctrl+shift+a', function() {
                    if (viewType!="dataview")
                        document.getElementById('addNewBookmark').click();
                });
                //Clear Bookmarks
                Mousetrap(parentDoc).bind('ctrl+shift+c', function() {
                    document.getElementById('btn_clearBookmarks').click();
                });
                Mousetrap.bind('ctrl+shift+c', function() {
                    document.getElementById('btn_clearBookmarks').click();
                });
                // Import Bookmarks
                Mousetrap(parentDoc).bind('ctrl+shift+i', function() {
                    document.getElementById('btn_importBookmarks').click();
                });
                Mousetrap.bind('ctrl+shift+i', function() {
                    document.getElementById('btn_importBookmarks').click();
                });
                // Export Bookmarks
                Mousetrap(parentDoc).bind('ctrl+shift+x', function() {
                    document.getElementById('btn_exportBookmarks').click();
                });
                Mousetrap.bind('ctrl+shift+x', function() {
                    document.getElementById('btn_exportBookmarks').click();
                
                });
                // Email us
                Mousetrap(parentDoc).bind('ctrl+shift+e', function() {
                    document.getElementById('btn_contactUs').click();
                });
                Mousetrap.bind('ctrl+shift+e', function() {
                    document.getElementById('btn_contactUs').click();
                });
                // Report an Issue
                Mousetrap(parentDoc).bind('ctrl+shift+u', function() {
                    document.getElementById('btn_reportIssue').click();
                });
                Mousetrap.bind('ctrl+shift+u', function() {
                    document.getElementById('btn_reportIssue').click();
                });
                // Show/Hide Session ID
                Mousetrap(parentDoc).bind('ctrl+shift+h', function() {
                    document.getElementById('btn_showHideSessionID').click();
                });
                Mousetrap.bind('ctrl+shift+h', function() {
                    document.getElementById('btn_showHideSessionID').click();
                });



