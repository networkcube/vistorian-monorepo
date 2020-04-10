# Vistorian-web

This repository contains html and styling files for the main Vistorian application.

The latest stable version can be installed into an npm project with `npm install vistorian-web`.


Alternatively, for development of only this Vistorian application do the following.
* `git clone https://github.com/networkcube/vistorian-web`
* `cd vistorian-web`
* `npm install`


## Dev Preperation 
Get the latest vesion of typescript. At the time of writing, this is 3.5.1

* `sudo npm install -g typescript`

Get the latest version of node/npm

* `brew install node`



## Local development with all vistorian components

__1) Clone files__

Make a directory e.g `vistorian` somewhere on your HD.

Inside this directory clone all 7 repositories that the Vistorian requires:

* `git clone https://github.com/networkcube/vistorian-core`
* `git clone https://github.com/networkcube/vistorian-web`
* `git clone https://github.com/networkcube/vistorian-bookmarkbrowser`
* `git clone https://github.com/networkcube/vistorian-dynamicego`
* `git clone https://github.com/networkcube/vistorian-map`
* `git clone https://github.com/networkcube/vistorian-matrix`
* `git clone https://github.com/networkcube/vistorian-nodelink`
and, of course
* `git clone https://github.com/networkcube/vistorian-web`

Do not change the local names. Leave them in the form `vistorian-xxx`.

There is also one repository which contains a set of helper bash-scripts, meant to facilitate some laborious tasks.

* `git clone https://github.com/networkcube/bashscripts`. 

For example, you can use the `gitpull` bashscript in `bashscripts` to run through all local vistorian repositories and pull the latest versions. 

* `cd bashscript`
* `./gitpull`

__2) Install dependencies__

Each of the above repositories (execpt `bashscripts`) is a Node project, through there is no real server logic. 

For each of these project, install node dependencies:

* `npm install`

Alternatively, use the `npminstall` bashscript in `bashscripts`. This will run through all the local vistorian repositories and run `npm install`. 

* `cd bashscript`
* `./npminstall`


__3) Show Vistorian in your browser__

Start a local server and run Vistorian from the `vistorian-web` project.

* `cd vistorian-web`
* `npm start`

This should bring up a browser window with the landing page of Vistorian.


__4) Setup local development__

Any view (`vistorian-matrix`, `vistorian-nodepmlink`, `vistorian-map`, `vistorian-egonetwork` , `vistorian-bookmarkbrowser`) and `vistorian-core` are dependencies for `vistorian-web`. So far, `npm install` installs these dependencies from the central npm repository as all the projects have been deployed there. 

However, when coding locally, deploying a project each time is pain. 

To instead use the local copies of the `vistorian-xxx` packages you need to change the locations where your local projects get their dependencies from, i.e., locally instead of from the local npm repo. 

Each `vistorian-xxx` project has a file called `package.json`. This file has a field called `dependencies` which indicates where node dependencies are loaded from. In order to enable local development, you need to change each dependency in `vistorian-xxx`'s `package.json` pointing to the local copy of the repository: in the `package.json` you need to replace any occurrence of 

`"vistorian-xxx": "latest"` with  `"vistorian-xxx": "file:../vistorian-xxx"`.

E.g., 

`"vistorian-matrix": "latest"` becomes `"vistorian-matrix": "file:../vistorian-matrix"`.

Obviously, do only need link to the local copies if you're actually aiming to make changes to the respective package. Otherwise, just use the npm packages. 

Since changing these things manually, the project `bashscripts` has two scripts that do all to work for you: 
* `./local`: sets all links to local development (`file:../vistorian-xxx`)
* `./global`: sets all links to the latest npm version (`latest`)


__5) Pushing changes to git__

If you are done with your local development and you want to push your changes to git, you need o go through the following steps: 

* make sure all package.json files are linking to the npm versions. This is done best by the `bashscripts/global` script.

* push to the respective github reposiories. The `bashscripts/gitpush -m 'my git message'` will execute the following scripts for each local repository. 
   * `git add --all`
   * `git commit -m 'my git message'`
   * `git push` 

The script does not execute `bashscipts/global`! You need to do this manually.


## Publish packages to npm 
* Ensure you are a collaborator, follow this link https://docs.npmjs.com/adding-collaborators-to-private-packages-owned-by-a-user-account to add collaborators.
* Update the version number in  `package.json` of the repository you wish to publish
* Run `npm login`, to login
* Run `npm publish`
