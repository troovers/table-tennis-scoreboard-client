#!/bin/bash

git fetch --tags
git tag

read -r -p 'Which tag would you like to switch to? ' tag

git reset --hard origin/master
git checkout tags/$tag
npm install
npm run build

supervisorctl restart run-rpi-scoreboard