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
  const manifest = {};

  for (const filePath of filePaths) {
    const fileBuffer = await fs.readFile(filePath);
    const fileName = path.basename(filePath);
    const blob = await put(fileName, fileBuffer, {
      access: 'public',
      allowOverwrite: true,
    });

    const relativePath = path.relative(ASSETS_SOURCE_DIR, filePath);
    manifest[relativePath] = blob.url;
  }

  await fs.writeFile(ASSET_MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log('Asset upload complete!');
  console.log(`Asset manifest generated at ${ASSET_MANIFEST_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
