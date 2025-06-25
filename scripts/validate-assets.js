const fs = require('fs');
const path = require('path');

const assetDir = path.join(__dirname, '../public/assets');

console.log('Checking asset filenames for proper formatting...');

// Expected format: layerNum_variant_LayerName_Element_Character_Genes_Color_Rarity_Stats.png
const expectedMinParts = 4; // At minimum, we need layerNum_variant_LayerName_Element

let validCount = 0;
let invalidCount = 0;
let invalidFiles = [];

// Get all asset directories
const assetDirs = fs.readdirSync(assetDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

// Process each directory
assetDirs.forEach(dir => {
  const dirPath = path.join(assetDir, dir);
  
  // Get all PNG files in this directory
  try {
    const files = fs.readdirSync(dirPath)
      .filter(file => file.toLowerCase().endsWith('.png'));
    
    // Check each file
    files.forEach(file => {
      const parts = file.split('_');
      
      // Validate file parts
      if (parts.length < expectedMinParts) {
        invalidCount++;
        invalidFiles.push({
          directory: dir,
          filename: file,
          issue: 'Too few name parts'
        });
        return;
      }
      
      // Validate that first part is numeric (layer number)
      const layerNum = parts[0];
      if (!/^\d+$/.test(layerNum)) {
        invalidCount++;
        invalidFiles.push({
          directory: dir,
          filename: file,
          issue: 'Layer number is not numeric'
        });
        return;
      }
      
      // Validate that second part is numeric (variant)
      const variant = parts[1];
      if (!/^\d+$/.test(variant)) {
        invalidCount++;
        invalidFiles.push({
          directory: dir,
          filename: file,
          issue: 'Variant is not numeric'
        });
        return;
      }
      
      // Check for empty Element name
      if (!parts[3] || parts[3] === '') {
        invalidCount++;
        invalidFiles.push({
          directory: dir,
          filename: file,
          issue: 'Missing Element name'
        });
        return;
      }
      
      // This file passes all checks
      validCount++;
    });
  } catch (err) {
    console.error(`Error processing directory ${dir}:`, err);
  }
});

// Print results
console.log('\nValidation Results:');
console.log(`Total valid files: ${validCount}`);
console.log(`Total invalid files: ${invalidCount}`);

if (invalidCount > 0) {
  console.log('\nInvalid Files:');
  invalidFiles.forEach(file => {
    console.log(`- ${file.directory}/${file.filename}`);
    console.log(`  Issue: ${file.issue}`);
  });
}

console.log('\nDone.'); 