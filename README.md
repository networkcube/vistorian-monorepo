# Vistorian-web

This repository contains html and styling files. 

The latest stable version can be installed into an npm project with `npm install vistorian-web`.

Alternatively, for development:
* `git clone https://github.com/networkcube/vistorian-web`
* `cd vistorian-web`
* `npm install`


## Preperation 
Get the latest vesion of typescript. At the time of writing, this is 3.5.1

* `sudo npm install -g typescript`

Get the latest version of node/npm

* `brew install node`

## Local development with all components
Make a directory e.g "vistorian"

Inside this directory clone all 7 repositories that the vistorian requires

* `git clone https://github.com/networkcube/vistorian-core`

* `git clone https://github.com/networkcube/vistorian-web`

* `git clone https://github.com/networkcube/vistorian-bookmarkbrowser`

* `git clone https://github.com/networkcube/vistorian-dynamicego`

* `git clone https://github.com/networkcube/vistorian-map`

* `git clone https://github.com/networkcube/vistorian-matrix`

* `git clone https://github.com/networkcube/vistorian-nodelink`

For each of these new repositories run 

* `npm install`

If you have have the 'vistorian' folder placed inside your /localhost, you should now be able to run the vistorian by visiting the following URL in your browser: 

* `http://localhost/vistorian`

If you have no local host / local server running, you can a server that comes with node in the "vistorian-web" repo. Inside the "vistorian-web" folder run 

* `npm start`


## Local development

Using the above method, will install the npm packages from the online sources in the global npm repository.

To instead use the local copies of these dependencies to enable local development for work across repositories, you need to change the locations where the vistorian packages are loaded from. 

Each vistorian repository / folder (e.g., vistorian-nodelink) has a filed calle `package.json`. This file has a field called `dependencies` which states where its dependencies are loaded from. In order to enable local development, you need to replace each vistorian package as follows, pointing to the local copy of the repository. 

`"vistorian-xxx": "latest"` with  `"vistorian-xxx": "file:../vistorian-xxx"`.

E.g., 

`"vistorian-matrix": "latest"` becomes `"vistorian-matrix": "file:../vistorian-mattrix"`.

Obviously, do only need link to the local copies if you're actually aiming to make changes to the respective package. Otherwise, just use the npm packages. 

## Pushing changes to git
<pending>
