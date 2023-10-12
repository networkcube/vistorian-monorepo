# Vistorian mono-repo

This repository combines the various parts of the vistorian project into a single repository.
Previously, they were scattered across multiple repositories (
[vistorian-matrix](https://github.com/networkcube/vistorian-matrix),
[vistorian-core](https://github.com/networkcube/vistorian-core),
[vistorian-web](https://github.com/networkcube/vistorian-web),
[vistorian-bookmarkbrowser](https://github.com/networkcube/vistorian-bookmarkbrowser),
[vistorian-map](https://github.com/networkcube/vistorian-map),
[vistorian-dynamicego](https://github.com/networkcube/vistorian-dynamicego),
[vistorian-nodelink](https://github.com/networkcube/vistorian-nodelink)
).

It uses [Lerna](https://lerna.js.org/) to manage the repository.

For the code documentation for Vistorian, refer to the [wiki of the old repository](https://github.com/networkcube/vistorian/wiki) 

## Git branches

The `master` branch is deployed automatically to [vistorian.net](https://vistorian.net). This branch is now protected: rather than pushing directly to `master`, push to a different branch and then create a pull request.

The `staging` branch is deployed automatically to [testing.vistorian.net](https://testing.vistorian.net).


## Getting started

If you just want to *use* The Vistorian, you can use it at [vistorian.online](http://vistorian.online).

If you want to *develop* The Vistorian by adding features or fixing bugs, you will need to get it running locally on your machine.

Clone this repository:

    git clone git@github.com:networkcube/vistorian-monorepo.git

Install lerna on your machine (if it is not already installed):
  
    npm install -g lerna

Change directory into the working-directory of this repo and bootstrap:

    cd vistorian-monorepo/
    npm install

This will install the dependencies for each package by downloading them from NPM and saving them into their corresponding `node_modules`.
Where the dependency is another package in this repo, it will instead create a symbolic link from the `node_modules/` to the appropriate directory.

This means that if you make changes to code in `packages/vistorian_core` and run `npm build`, the contents of `packages/vistorian_matrix/node_modules/vistorian_core` will be updated.

To view the vistorian web site:

    cd packages/vistorian-web-sveltekit
    npm run build
    npm run dev

Then open the URL printed in the console.

The `npm run build` command is only needed once, and can be ommitted on subsequent occassions.

You can apply an `npm run` command to all packages using `lerna run` (e.g., `lerna run build`)


### Using windows

If you are using windows, then you may encounter problems with both the prebuild/postbuild script in and sveltkit itself when trying to run the website.
The recommended solution is to install the [Windows Subsystem for Linux (WSL)](https://docs.microsoft.com/en-us/windows/wsl/about).


