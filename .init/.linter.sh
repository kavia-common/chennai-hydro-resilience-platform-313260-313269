#!/bin/bash
cd /home/kavia/workspace/code-generation/chennai-hydro-resilience-platform-313260-313269/chris_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

