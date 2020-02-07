#!/bin/bash

git fetch --tags

read -p -r 'Which tag would you like to switch to? ' tag

git checkout tags/$tag
npm install
npm run build

supervisorctl restart run-rpi-scoreboard