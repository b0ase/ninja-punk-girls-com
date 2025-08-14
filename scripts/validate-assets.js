const fs = require('fs');
const path = require('path');

const assetDir = path.join(__dirname, '../public/assets');

console.log('Validating new JSON-based asset structure...');

let validCount = 0;
let invalidCount = 0;
let invalidFiles = [];
let totalPngFiles = 0;
let totalJsonFiles = 0;
let matchedPairs = 0;

// Get all asset directories
const assetDirs = fs.readdirSync(assetDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

console.log(`Found ${assetDirs.length} asset directories to validate.`);

// Process each directory
assetDirs.forEach(dir => {
  const dirPath = path.join(assetDir, dir);
  
  try {
    const files = fs.readdirSync(dirPath);
    
    // Get PNG and JSON files
    const pngFiles = files.filter(file => file.toLowerCase().endsWith('.png'));
    const jsonFiles = files.filter(file => file.toLowerCase().endsWith('.json'));
    
    totalPngFiles += pngFiles.length;
    totalJsonFiles += jsonFiles.length;
    
    console.log(`\n📁 ${dir}: ${pngFiles.length} PNG files, ${jsonFiles.length} JSON files`);
    
    // Keep track of which PNGs have been matched
    const matchedPngs = new Set();
    
    // Check each JSON file
    jsonFiles.forEach(jsonFile => {
      try {
        const jsonPath = path.join(dirPath, jsonFile);
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        // Validate JSON structure
        const requiredFields = ['folder_number', 'asset_number', 'category', 'item_name', 'stats'];
        const missingFields = requiredFields.filter(field => !jsonData.hasOwnProperty(field));
        
        if (missingFields.length > 0) {
          invalidCount++;
          invalidFiles.push({
            directory: dir,
            filename: jsonFile,
            issue: `Missing required fields: ${missingFields.join(', ')}`
          });
          return;
        }
        
        // Check if corresponding PNG exists using simplified_filename
        const expectedPngName = jsonData.simplified_filename || jsonData.original_filename;
        if (!expectedPngName) {
          invalidCount++;
          invalidFiles.push({
            directory: dir,
            filename: jsonFile,
            issue: 'No PNG filename specified in JSON'
          });
          return;
        }
        
        const pngPath = path.join(dirPath, expectedPngName);
        if (!fs.existsSync(pngPath)) {
          invalidCount++;
          invalidFiles.push({
            directory: dir,
            filename: jsonFile,
            issue: `Corresponding PNG file not found: ${expectedPngName}`
          });
          return;
        }
        
        // Mark this PNG as matched
        matchedPngs.add(expectedPngName);
        
        // Validate folder number matches directory
        const expectedFolderNum = dir.split('-')[0];
        if (jsonData.folder_number !== expectedFolderNum) {
          invalidCount++;
          invalidFiles.push({
            directory: dir,
            filename: jsonFile,
            issue: `Folder number mismatch: ${jsonData.folder_number} vs expected ${expectedFolderNum}`
          });
          return;
        }
        
        // Validate stats structure
        if (!jsonData.stats || typeof jsonData.stats !== 'object') {
          invalidCount++;
          invalidFiles.push({
            directory: dir,
            filename: jsonFile,
            issue: 'Invalid or missing stats object'
          });
          return;
        }
        
        const requiredStats = ['strength', 'speed', 'skill', 'stamina', 'stealth', 'style'];
        const missingStats = requiredStats.filter(stat => 
          !jsonData.stats.hasOwnProperty(stat) || typeof jsonData.stats[stat] !== 'number'
        );
        
        if (missingStats.length > 0) {
          invalidCount++;
          invalidFiles.push({
            directory: dir,
            filename: jsonFile,
            issue: `Invalid stats: ${missingStats.join(', ')}`
          });
          return;
        }
        
        // If we get here, the file is valid
        validCount++;
        matchedPairs++;
        
      } catch (parseError) {
        invalidCount++;
        invalidFiles.push({
          directory: dir,
          filename: jsonFile,
          issue: `JSON parse error: ${parseError.message}`
        });
      }
    });
    
    // Check for orphaned PNG files (PNG without corresponding JSON)
    pngFiles.forEach(pngFile => {
      if (!matchedPngs.has(pngFile)) {
        invalidCount++;
        invalidFiles.push({
          directory: dir,
          filename: pngFile,
          issue: 'Orphaned PNG file - no corresponding JSON points to this PNG'
        });
      }
    });
    
  } catch (readDirError) {
    console.error(`❌ Error reading directory ${dir}:`, readDirError);
  }
});

// Print results
console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION RESULTS');
console.log('='.repeat(60));
console.log(`✅ Valid JSON-PNG pairs: ${validCount}`);  
console.log(`❌ Invalid files: ${invalidCount}`);
console.log(`📄 Total PNG files: ${totalPngFiles}`);
console.log(`📋 Total JSON files: ${totalJsonFiles}`);
console.log(`🔗 Matched pairs: ${matchedPairs}`);

if (invalidFiles.length > 0) {
  console.log('\n❌ ISSUES FOUND:');
  invalidFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file.directory}/${file.filename}`);
    console.log(`   Issue: ${file.issue}`);
  });
} else {
  console.log('\n🎉 All assets validated successfully!');
}

console.log('\n' + '='.repeat(60)); 