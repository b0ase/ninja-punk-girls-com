# Vercel Blob Storage Implementation Guide

## Overview

This guide will help you migrate your Ninja Punk Girls project from local asset storage to Vercel Blob storage, eliminating build issues and enabling 3D functionality restoration.

## Prerequisites

1. **Vercel Account**: You need a Vercel account with a project
2. **Blob Store**: A Vercel Blob store must be created
3. **Environment Variables**: Proper configuration for blob access

## Step 1: Get Your Blob Store ID

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** → **Blob**
4. Note your **Store ID** (you'll need this for the environment variable)

## Step 2: Set Environment Variables

1. Create a `.env.local` file in your project root
2. Add the following variables:

```bash
# Copy from env-template.txt and fill in your actual values
BLOB_STORE_ID=your-actual-blob-store-id
BLOB_READ_WRITE_TOKEN=your-blob-token-if-needed
```

## Step 3: Upload Assets to Blob Storage

Run the upload script to migrate all your assets:

```bash
npm run upload-assets
```

This script will:
- Scan your `public/assets` directory
- Upload each file to Vercel Blob storage
- Generate a manifest file with all blob URLs
- Show progress and results

## Step 4: Test Blob Asset Loading

The system includes:
- **Blob Asset Loader** (`src/lib/blobAssetLoader.ts`)
- **API Route** (`/api/blob-assets/manifest`)
- **Asset Manifest** (`src/data/blob-asset-manifest.json`)

Test that assets load correctly:
```typescript
import { getBlobAssetUrl, listBlobAssets } from '@/lib/blobAssetLoader';

// Get a specific asset URL
const assetUrl = await getBlobAssetUrl('01-Logo/logo.png');

// List all assets
const allAssets = await listBlobAssets();
```

## Step 5: Update Your Components

Replace local asset references with blob URLs:

```typescript
// Before (local assets)
const imageUrl = `/assets/${layer}/${filename}`;

// After (blob assets)
import { getBlobAssetUrl } from '@/lib/blobAssetLoader';
const imageUrl = await getBlobAssetUrl(`${layer}/${filename}`);
```

## Step 6: Remove Local Assets from Build

Once everything is working with blob storage:

1. **Remove from .vercelignore**: Remove `public/assets` from `.vercelignore`
2. **Delete local assets**: Remove the `public/assets` directory
3. **Update .gitignore**: Add `public/assets` to `.gitignore`

## Step 7: Restore 3D Dependencies

Now you can safely restore 3D functionality:

```bash
npm install @react-three/drei @react-three/fiber three three-stdlib
```

## Benefits of This Approach

✅ **No More Build Crashes**: Assets aren't processed during build
✅ **Faster Builds**: Smaller bundle size and faster compilation
✅ **Global CDN**: Assets served from Vercel's global network
✅ **Scalability**: Handle thousands of assets without build impact
✅ **3D Restoration**: Safely restore 3D functionality
✅ **Cost Effective**: Vercel Blob storage is very affordable

## Troubleshooting

### Upload Script Fails
- Check your `BLOB_STORE_ID` environment variable
- Ensure you have proper Vercel permissions
- Check network connectivity

### Assets Don't Load
- Verify the manifest was generated correctly
- Check blob URLs in the browser console
- Ensure the API route is working

### Build Still Fails
- Make sure `public/assets` is removed from the build
- Check that all asset references use blob URLs
- Verify no local asset imports remain

## File Structure After Migration

```
src/
├── lib/
│   ├── blobAssetLoader.ts     # New blob asset loader
│   └── simpleAssetLoader.ts   # Keep for fallback
├── data/
│   └── blob-asset-manifest.json  # Generated manifest
└── app/
    └── api/
        └── blob-assets/
            └── manifest/
                └── route.ts   # Manifest API endpoint

scripts/
└── upload-assets-to-blob.js   # Asset upload script

public/
└── assets/                    # Remove this directory
```

## Next Steps

1. **Test thoroughly** with blob storage
2. **Restore 3D components** safely
3. **Optimize asset loading** with lazy loading
4. **Monitor performance** and costs
5. **Set up CI/CD** for asset updates

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify environment variables are set correctly
3. Test the blob manifest API endpoint
4. Check Vercel dashboard for blob storage status

---

**Note**: This migration is a one-time process. Once complete, your build process will be much faster and more reliable, and you'll have full 3D functionality back.
