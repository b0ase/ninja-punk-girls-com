#!/bin/bash

# Kill any existing Python HTTP servers
echo "Killing any existing Python HTTP servers..."
pkill -f "python3 -m http.server" 2>/dev/null || true

# Find a free port starting from 8000
PORT=8000
while lsof -i:$PORT >/dev/null 2>&1; do
  echo "Port $PORT is in use, trying next port..."
  PORT=$((PORT+1))
done

echo "Starting server on port $PORT..."
echo "You can access the NFT Studio at: http://localhost:$PORT/output/nft_studio.html"
python3 -m http.server $PORT 