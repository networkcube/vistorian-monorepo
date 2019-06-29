# Vistorian-web

This repository contains html and styling files. 

The latest stable version can be installed into an npm project with `npm install vistorian-web`.

Alternatively, for development:
* `git clone https://github.com/networkcube/vistorian-web`
* `cd vistorian-web`
* `npm install`


## Preperation 
* Get the latest vesion of typescript. At the time of writing, this is 3.5.1

`sudo npm install -g typescript`

* Get the latest version of node/npm

`brew install node`

## Local development with all components
* Make a directory e.g "vistorian"
* Inside this directory clone all the repositories that the vistorian requires

`git lone https://github.com/networkcube/vistorian-core`

`git clone https://github.com/networkcube/vistorian-webgit`

`git clone https://github.com/networkcube/vistorian-bookmarkbrowser`

`git clone https://github.com/networkcube/vistorian-dynamicego`

`git clone https://github.com/networkcube/vistorian-map`

`git clone https://github.com/networkcube/vistorian-matrix`

`git clone https://github.com/networkcube/vistorian-nodelink`

* For each of these new repositories run 

`npm install`

* If you have have the 'vistorian' folder placed inside your /localhost, you should now be able to run the vistorian by visiting the following URL in your browser: 

`http://localhost/vistorian`

* If you have no local host / local server running, you can a server that comes with node in the "vistorian-web" repo. Inside the "vistorian-web" folder run 

`npm start`
