#!/bin/bash
ng build --prod --base-href https://tadashi-aikawa.github.io/jumeaux-viewer/

ngh --repo=https://${GHP_TOKEN}@github.com/tadashi-aikawa/jumeaux-viewer.git \
    --name="tadashi-aikawa" \
    --email="syou.maman@gmail.com"
