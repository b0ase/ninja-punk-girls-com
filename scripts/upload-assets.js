require('dotenv').config();
const { put } = require('@vercel/blob');
const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

const ASSETS_SOURCE_DIR = path.join(__dirname, '../assets-source');
const ASSET_MANIFEST_PATH = path.join(__dirname, '../src/data/asset-manifest.json');

async function main() {
  console.log('Starting asset upload...');

  const filePaths = await glob(`${ASSETS_SOURCE_DIR}/**/*.*`);
  const uploadedAssets = [];
  let uploadedCount = 0;
  let failedCount = 0;

  for (const filePath of filePaths) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
      const blob = await put(fileName, fileBuffer, {
        access: 'public',
        allowOverwrite: true,
      });

      uploadedAssets.push({
        path: path.relative(ASSETS_SOURCE_DIR, filePath),
        url: blob.url,
        size: blob.size || 0, // Blob API might not return size directly on put, need to verify
        contentType: blob.contentType || 'application/octet-stream',
      });
      uploadedCount++;
    } catch (error) {
      console.error(`Failed to upload ${filePath}:`, error);
      failedCount++;
    }
  }

  const manifest = {
    generated: new Date().toISOString(),
    totalFiles: filePaths.length,
    uploadedFiles: uploadedCount,
    failedFiles: failedCount,
    assets: uploadedAssets,
  };

  await fs.writeFile(ASSET_MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log('Asset upload complete!');
  console.log(`Asset manifest generated at ${ASSET_MANIFEST_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});