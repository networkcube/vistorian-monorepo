#!/bin/bash

while getopts m: flag
do
    case "${flag}" in
        m) msg=${OPTARG};;
    esac
done

git add *
git commit -m $msg
git push

# npm version patch -m $msg
# npm publish