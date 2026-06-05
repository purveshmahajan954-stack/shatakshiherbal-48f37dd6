#!/bin/bash
set -e

# Install root dependencies
npm install --legacy-peer-deps

# Install shipping panel dependencies
cd shipping && npm install && cd ..
