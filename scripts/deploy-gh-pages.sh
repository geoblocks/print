#!/bin/bash -e

npm run build-ghpages -- --base /print/
cp -R ghpages /tmp/
cp -R public/* /tmp/ghpages/
git fetch
git checkout gh-pages
cp -R ghpages/* .
git add -A index.html assets tiles fonts beach.svg
git commit -m 'Update gh-pages'
git push origin gh-pages -f
git checkout -
