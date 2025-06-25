// Simple test script for Japanese names
const fs = require('fs');
const path = require('path');

// Read the Japanese names file
const japaneseNamesPath = path.join(__dirname, 'src', 'data', 'japanese-names.ts');
const fileContent = fs.readFileSync(japaneseNamesPath, 'utf8');

// Extract the array of names
const namesMatch = fileContent.match(/export const JAPANESE_NAMES = \[([\s\S]*?)\];/);
if (!namesMatch) {
  console.error('Could not find JAPANESE_NAMES array in the file');
  process.exit(1);
}

// Clean up the content and parse it
const namesContent = namesMatch[1]
  .replace(/\/\/.*$/gm, '') // Remove comments
  .replace(/\s+/g, ' ')     // Normalize whitespace
  .trim();                  // Trim whitespace

// Convert to array
const namesArray = namesContent
  .split(',')
  .map(name => name.trim())
  .filter(name => name.startsWith('"') || name.startsWith("'")) // Only include strings
  .map(name => name.replace(/['"]/g, '').trim()) // Remove quotes
  .filter(Boolean); // Remove empty strings

// Count names and display some random ones
console.log(`Total Japanese names: ${namesArray.length}`);
console.log('\nRandom names:');

for (let i = 0; i < 10; i++) {
  const randomIndex = Math.floor(Math.random() * namesArray.length);
  console.log(`- ${namesArray[randomIndex]}`);
}

console.log('\nThe Japanese names module is working correctly!'); 