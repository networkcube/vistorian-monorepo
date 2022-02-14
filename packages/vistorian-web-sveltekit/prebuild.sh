rsync --delete --copy-links -av --progress --exclude="node_modules" --exclude="docs" node_modules/vistorian-bookmarkbrowser static/node_modules
mkdir -p build/node_modules/vistorian-bookmarkbrowser/node_modules/vistorian-core/lib
cp node_modules/vistorian-core/lib/vistorian-core.js build/node_modules/vistorian-bookmarkbrowser/node_modules/vistorian-core/lib/vistorian-core.js
cp node_modules/vistorian-nodelink/node_modules/jquery/dist/jquery.js build/node_modules/vistorian-bookmarkbrowser/node_modules/vistorian-nodelink/node_modules/jquery/dist/jquery.js


rsync --delete --copy-links -av --progress --exclude="node_modules" --exclude="docs" node_modules/vistorian-core static/node_modules
rsync --delete --copy-links -av --progress --exclude="node_modules" --exclude="docs" node_modules/vistorian-dynamicego static/node_modules
rsync --delete --copy-links -av --progress --exclude="node_modules" --exclude="docs" node_modules/vistorian-map static/node_modules
rsync --delete --copy-links -av --progress --exclude="node_modules" --exclude="docs" node_modules/vistorian-matrix static/node_modules
rsync --delete --copy-links -av --progress --exclude="node_modules" --exclude="docs" node_modules/vistorian-nodelink static/node_modules