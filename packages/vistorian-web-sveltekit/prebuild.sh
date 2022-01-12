rsync --delete --copy-links -av --progress --exclude="node_modules" --exclude="docs" node_modules/vistorian-bookmarkbrowser static/node_modules
rsync --delete --copy-links -av --progress --exclude="node_modules" --exclude="docs" node_modules/vistorian-core static/node_modules
rsync --delete --copy-links -av --progress --exclude="node_modules" --exclude="docs" node_modules/vistorian-dynamicego static/node_modules
rsync --delete --copy-links -av --progress --exclude="node_modules" --exclude="docs" node_modules/vistorian-map static/node_modules
rsync --delete --copy-links -av --progress --exclude="node_modules" --exclude="docs" node_modules/vistorian-matrix static/node_modules
rsync --delete --copy-links -av --progress --exclude="node_modules" --exclude="docs" node_modules/vistorian-nodelink static/node_modules