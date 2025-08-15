const fs = require('fs');
const path = require('path');

// Function to rename JSON files to match PNG names
function renameJsonFiles() {
  const assetsDir = path.join(process.cwd(), 'public', 'assets');
  
  if (!fs.existsSync(assetsDir)) {
    console.error('Assets directory not found:', assetsDir);
    return;
  }

  console.log('Starting JSON file renaming process...');
  
  // Get all subdirectories
  const folders = fs.readdirSync(assetsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log(`Found ${folders.length} asset folders:`, folders);

  let totalRenamed = 0;
  let totalErrors = 0;

  folders.forEach(folderName => {
    const folderPath = path.join(assetsDir, folderName);
    console.log(`\nProcessing folder: ${folderName}`);
    
    try {
      // Get all files in the folder
      const files = fs.readdirSync(folderPath);
      
      // Find JSON and PNG files
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      const pngFiles = files.filter(file => file.endsWith('.png'));
      
      console.log(`  Found ${jsonFiles.length} JSON files and ${pngFiles.length} PNG files`);
      
      // Process each JSON file
      jsonFiles.forEach(jsonFile => {
        try {
          // Read the JSON file to get the simplified_filename
          const jsonPath = path.join(folderPath, jsonFile);
          const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          
          const simplifiedFilename = jsonContent.simplified_filename;
          if (!simplifiedFilename) {
            console.warn(`    Warning: No simplified_filename found in ${jsonFile}`);
            return;
          }
          
          // Create new JSON filename by replacing .png with .json
          const newJsonName = simplifiedFilename.replace('.png', '.json');
          const newJsonPath = path.join(folderPath, newJsonName);
          
          // Check if target file already exists
          if (fs.existsSync(newJsonPath) && jsonFile !== newJsonName) {
            console.warn(`    Warning: Target file already exists: ${newJsonName}`);
            return;
          }
          
          // Rename the file
          if (jsonFile !== newJsonName) {
            fs.renameSync(jsonPath, newJsonPath);
            console.log(`    ✓ Renamed: ${jsonFile} → ${newJsonName}`);
            totalRenamed++;
          } else {
            console.log(`    - Already correct: ${jsonFile}`);
          }
          
        } catch (error) {
          console.error(`    ✗ Error processing ${jsonFile}:`, error.message);
          totalErrors++;
        }
      });
      
    } catch (error) {
      console.error(`  ✗ Error reading folder ${folderName}:`, error.message);
      totalErrors++;
    }
  });

  console.log(`\n=== RENAMING COMPLETE ===`);
  console.log(`Total files renamed: ${totalRenamed}`);
  console.log(`Total errors: ${totalErrors}`);
  
  if (totalErrors === 0) {
    console.log('✅ All JSON files successfully renamed!');
  } else {
    console.log('⚠️  Some files had errors during renaming.');
  }
}

// Run the script
if (require.main === module) {
  renameJsonFiles();
}

module.exports = { renameJsonFiles };
