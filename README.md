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

## Getting started

If you just want to *use* The Vistorian, you can use it at [vistorian.online](http://vistorian.online).

If you want to *develop* The Vistorian by adding features or fixing bugs, you will need to get it running locally on your machine.

Clone this repository:

    git clone git@github.com:networkcube/vistorian-monorepo.git

Install lerna on your machine (if it is not already installed):
  
    npm install -g lerna

Change directory into the working-directory of this repo and bootstrap:

    cd vistorian-monorepo/
    lerna bootstrap

This will install the dependencies for each package by downloading them from NPM and saving them into their corresponding `node_modules`.
Where the dependency is another package in this repo, it will instead create a symbolic link from the `node_modules/` to the appropriate directory.

This means that if you make changes to code in `packages/vistorian_core` and run `npm build`, the contents of `packages/vistorian_matrix/node_modules/vistorian_core` will be updated.

To view the vistorian web site:

    cd packages/vistorian_web
    http-server

Then open the URL printed in the console.

(instead of http-server, you can use an alternative from this [Big list of http static server one-liners ](https://gist.github.com/willurd/5720255)))


You can apply an `npm run` command to all packages using `lerna run` (e.g., `lerna run build`)
