#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');

// Configuration
const ASSETS_DIR = path.join(process.cwd(), 'public', 'assets');
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// Track uploads
let totalFiles = 0;
let uploadedFiles = 0;
let failedFiles = 0;
const uploadResults = [];

// Helper function to get file stats
function getFileStats(filePath) {
  const stats = fs.statSync(filePath);
  return {
    size: stats.size,
    modified: stats.mtime
  };
}

// Helper function to determine content type
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

// Upload a single file to Vercel Blob
async function uploadFileToBlob(filePath, relativePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const contentType = getContentType(filePath);
    
    console.log(`Uploading: ${relativePath} (${(fileBuffer.length / 1024).toFixed(2)} KB)`);
    
    const blob = await put(relativePath, fileBuffer, {
      access: 'public',
      contentType: contentType,
      addRandomSuffix: false,
      allowOverwrite: true
    });
    
    uploadResults.push({
      path: relativePath,
      url: blob.url,
      size: fileBuffer.length,
      success: true
    });
    
    uploadedFiles++;
    console.log(`✅ Success: ${relativePath} -> ${blob.url}`);
    
    return blob.url;
  } catch (error) {
    console.error(`❌ Failed to upload ${relativePath}:`, error.message);
    uploadResults.push({
      path: relativePath,
      error: error.message,
      success: false
    });
    failedFiles++;
    return null;
  }
}

// Recursively scan directory and upload files
async function uploadDirectory(dirPath, relativeDir = '') {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const relativePath = path.join(relativeDir, item);
    
    if (fs.statSync(fullPath).isDirectory()) {
      // Skip .DS_Store and other system directories
      if (item.startsWith('.') || item === 'node_modules') {
        continue;
      }
      
      // Recursively upload subdirectory
      await uploadDirectory(fullPath, relativePath);
    } else {
      // Skip system files
      if (item.startsWith('.') || item === '.DS_Store') {
        continue;
      }
      
      totalFiles++;
      await uploadFileToBlob(fullPath, relativePath);
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

// Generate asset manifest with blob URLs
function generateAssetManifest() {
  const manifest = {
    generated: new Date().toISOString(),
    totalFiles: totalFiles,
    uploadedFiles: uploadedFiles,
    failedFiles: failedFiles,
    assets: uploadResults.filter(r => r.success).map(r => ({
      path: r.path,
      url: r.url,
      size: r.size
    }))
  };
  
  const manifestPath = path.join(process.cwd(), 'src', 'data', 'blob-asset-manifest.json');
  const manifestDir = path.dirname(manifestPath);
  
  if (!fs.existsSync(manifestDir)) {
    fs.mkdirSync(manifestDir, { recursive: true });
  }
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n📋 Asset manifest saved to: ${manifestPath}`);
  
  return manifest;
}

// Main execution
async function main() {
  console.log('🚀 Starting asset upload to Vercel Blob storage...\n');
  
  if (!BLOB_TOKEN) {
    console.log('⚠️  BLOB_READ_WRITE_TOKEN environment variable not set.');
    console.log('   Please add this to your .env.local file:');
    console.log('   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_qW1nh74CmGRGAwOH_ZSk9rvrQG6vORueJWuTrNLoKuJOmca\n');
    return;
  }
  
  try {
    // Start upload process
    await uploadDirectory(ASSETS_DIR);
    
    // Generate manifest
    const manifest = generateAssetManifest();
    
    // Summary
    console.log('\n📊 Upload Summary:');
    console.log(`   Total files found: ${totalFiles}`);
    console.log(`   Successfully uploaded: ${uploadedFiles}`);
    console.log(`   Failed uploads: ${failedFiles}`);
    console.log(`   Success rate: ${((uploadedFiles / totalFiles) * 100).toFixed(1)}%`);
    
    if (failedFiles > 0) {
      console.log('\n❌ Failed uploads:');
      uploadResults.filter(r => !r.success).forEach(r => {
        console.log(`   ${r.path}: ${r.error}`);
      });
    }
    
    console.log('\n🎉 Asset upload complete!');
    console.log('   Next steps:');
    console.log('   1. Update your asset loading code to use blob URLs');
    console.log('   2. Remove the public/assets directory from your build');
    console.log('   3. Test that all assets load correctly from blob storage');
    
  } catch (error) {
    console.error('\n💥 Upload process failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { uploadDirectory, generateAssetManifest };
