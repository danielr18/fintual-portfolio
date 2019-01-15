#!/usr/bin/env bash
set -ex
npm run build
cd ./example_app
yarn
npm run deploy
