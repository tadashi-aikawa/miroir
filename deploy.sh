#!/bin/bash
ng build --prod --base-href https://tadashi-aikawa.github.io/miroir/

ngh --repo=https://${GHP_TOKEN}@github.com/tadashi-aikawa/miroir.git \
    --name="tadashi-aikawa" \
    --email="syou.maman@gmail.com"
