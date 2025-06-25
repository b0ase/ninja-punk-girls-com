const fs = require('fs');
const path = require('path');

// Source and destination directories
const sourceDir = path.join(__dirname, '..', '0000 full elements set');
const destDir = path.join(__dirname, '..', 'public', 'assets_new');

// Ensure destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log(`Created directory: ${destDir}`);
}

// Function to copy files
function copyFiles() {
  try {
    // Read all files from source directory
    const files = fs.readdirSync(sourceDir);
    
    console.log(`Found ${files.length} files in source directory`);
    
    // Copy each file to destination
    files.forEach(file => {
      const srcFile = path.join(sourceDir, file);
      const destFile = path.join(destDir, file);
      
      // Check if it's a file (not a directory)
      if (fs.statSync(srcFile).isFile()) {
        // Copy the file
        fs.copyFileSync(srcFile, destFile);
        console.log(`Copied: ${file}`);
      }
    });
    
    console.log('All files copied successfully!');
  } catch (error) {
    console.error('Error copying files:', error);
  }
}

// Run the copy function
copyFiles(); 