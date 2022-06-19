#!/bin/sh
git add .
git commit -am "$*"
git push origin HEAD:main
echo Press Enter...
read