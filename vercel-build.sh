#!/bin/bash
set -e

echo "Starting Vercel build process..."
echo "Current directory: $(pwd)"

# Find the Python command that works (Vercel may have python3 instead of python)
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    echo "Using python3 command"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    echo "Using python command"
else
    echo "ERROR: No Python interpreter found!"
    ls -la /usr/bin/ | grep python
    echo "Trying to install Python..."
    apt-get update && apt-get install -y python3 || true
    
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
        echo "Successfully installed python3"
    else
        echo "Failed to find or install Python. Exiting."
        exit 1
    fi
fi

echo "Python version: $($PYTHON_CMD --version 2>&1)"
echo "Environment variables: VERCEL=${VERCEL}, VERCEL_ENV=${VERCEL_ENV}"
echo "Directory contents: $(ls -la)"

# Install dependencies directly (no virtual env on Vercel)
echo "Installing dependencies..."
pip3 install -r requirements.txt --no-cache-dir || pip install -r requirements.txt --no-cache-dir

# Create necessary directories for output
mkdir -p output

# Copy assets directory to output
echo "Copying assets directory to output..."
if [ -d "assets" ]; then
    echo "Assets directory exists, copying to output..."
    mkdir -p output/assets
    cp -r assets/* output/assets/ || true
    echo "Assets copying complete. Output assets contents:"
    ls -la output/assets/ | head -n 20
else
    echo "WARNING: Assets directory not found!"
fi

# Generate the NFT Studio HTML
echo "Generating NFT Studio HTML..."
$PYTHON_CMD build.py

# Update HTML paths to ensure assets are found
echo "Updating HTML paths..."
if [ -f "output/nft_studio.html" ]; then
    # Make sure all asset paths are correct
    sed -i 's|\.\.\/assets\/|\/assets\/|g' output/nft_studio.html || true
    sed -i 's|assets\/|\/assets\/|g' output/nft_studio.html || true
    echo "Path updates complete."
else
    echo "WARNING: nft_studio.html not generated!"
fi

# Create a simple favicon.ico in the output directory
echo "Creating favicon.ico..."
touch output/favicon.ico

# List the output directory contents
echo "Output directory contents:"
ls -la output/

# Ensure the output directory has all required files
if [ ! -f output/nft_studio.html ]; then
    echo "Error: Failed to generate output/nft_studio.html"
    exit 1
fi

# Create a copy at the root for direct access
echo "Creating root copy of nft_studio.html..."
cp output/nft_studio.html ./nft_studio.html

# Check if assets directory exists in output
if [ ! -d "output/assets" ] && [ -d "assets" ]; then
    echo "Creating assets symlink or directory in output..."
    ln -sf $(pwd)/assets output/assets || mkdir -p output/assets
    cp -r assets/* output/assets/ || true
fi

# Create a basic public directory structure
echo "Creating public directory structure..."
mkdir -p public/assets
cp -r assets/* public/assets/ || true
cp output/nft_studio.html public/index.html || true

echo "Final directory structures:"
echo "Output directory:"
ls -la output/
echo "Public directory:"
ls -la public/

echo "Build completed successfully!" 