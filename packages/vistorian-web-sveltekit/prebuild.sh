mkdir -p static/node_modules/vistorian-bookmarkbrowser

rsync --delete --copy-links -av --progress --exclude="node_modules" --exclude="docs" ../vistorian-bookmarkbrowser static/node_modules

mkdir -p build/node_modules/vistorian-bookmarkbrowser/node_modules/vistorian-core/lib
cp ../vistorian-core/lib/vistorian-core.js build/node_modules/vistorian-bookmarkbrowser/node_modules/vistorian-core/lib/vistorian-core.js
#cp ../../node_modules/jquery/dist/jquery.js build/node_modules/vistorian-bookmarkbrowser/node_modules/vistorian-nodelink/node_modules/jquery/dist/jquery.js
  # FIXME

rsync --delete --copy-links -av --progress --exclude="node_modules" --exclude="docs" ../vistorian-core static/node_modules
rsync --delete --copy-links -av --progress --exclude="node_modules" --exclude="docs" ../vistorian-dynamicego static/node_modules
rsync --delete --copy-links -av --progress --exclude="node_modules" --exclude="docs" ../vistorian-nodelink static/node_modules
rsync --delete --copy-links -av --progress --exclude="node_modules" --exclude="docs" ../vistorian-map static/node_modules
rsync --delete --copy-links -av --progress --exclude="node_modules" --exclude="docs" ../vistorian-matrix static/node_modules