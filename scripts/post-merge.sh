#!/bin/bash
set -e

# Install root dependencies
npm install --legacy-peer-deps

# Install shipping panel dependencies
cd shipping && npm install && cd ..

# Push database schema (idempotent — safe to run on every merge)
npm run db:push
