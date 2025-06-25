#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}Ninja Punk Girls NFT Vercel Deployment${NC}"
echo -e "${BLUE}=======================================${NC}"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not found, attempting to install it...${NC}"
    npm install -g vercel
fi

# Create necessary directories
mkdir -p output
mkdir -p output/assets
mkdir -p public
mkdir -p public/assets

# Make sure build script is executable
chmod +x vercel-build.sh

# Run the build script locally first
echo -e "${YELLOW}Running build script locally to test...${NC}"
./vercel-build.sh

# Check if build was successful
if [ ! -f "output/nft_studio.html" ]; then
    echo -e "${RED}Error: Build failed, nft_studio.html not found!${NC}"
    exit 1
fi

# Create public symlinks and copies
echo -e "${YELLOW}Creating public directory files...${NC}"
cp output/nft_studio.html public/index.html

# If assets exists, copy them to public
if [ -d "assets" ]; then
    echo -e "${YELLOW}Copying assets to public directory...${NC}"
    cp -r assets/* public/assets/
fi

echo -e "${GREEN}Build completed successfully!${NC}"
echo -e "${YELLOW}Deploying to Vercel...${NC}"

# Deploy to Vercel
vercel --prod

echo -e "${GREEN}Deployment process completed!${NC}" 