git push -u origin main#!/bin/sh
export GIT_REPOSITORY_URL="$GIT_REPOSITORY_URL"

git clone "$GIT_REPOSITORY_URL" /home/app/output



ls /home/app
npx tsc -b 
node /home/app/dist/script.js