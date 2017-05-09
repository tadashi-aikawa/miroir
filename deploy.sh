#!/bin/bash
ng build --prod --base-href https://tadashi-aikawa.github.io/jumeaux-viewer/

git config --global user.email "syou.maman@gmail.com"
git config --global user.name "tadashi-aikawa"

ngh --no-silent --repo=https://${GHP_TOKEN}@github.com/tadashi-aikawa/jumeaux-viewer.git
