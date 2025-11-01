// Script to replace common Latvian strings with English equivalents
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Latvian to English translation mapping
const translations = {
  'Kļūda': 'Error',
  'Nav pieejams': 'Not available',
  'Pieejams': 'Available',
  'Savienoties': 'Connect',
  'Izveidots': 'Created',
  'Atjaunināts': 'Updated',
  'Pēdējā pārbaude': 'Last check',
  'Nekonstatēta': 'Not detected',
  'Kļūda ielādējot': 'Error loading',
  'Kļūda saglabājot': 'Error saving',
  'Kļūda atjauninot': 'Error updating',
  'Kļūda dzēšot': 'Error deleting',
  'Kļūda izveidojot': 'Error creating',
  'Kļūda mainot': 'Error changing',
  'Kļūda sākot': 'Error starting',
  'Kļūda lejupielādējot': 'Error downloading',
  'Kļūda sazināties': 'Error contacting',
  'Izvēlētais datums': 'Selected date',
  'Latviešu': 'Latvian'
};

// Find all TypeScript/TSX files
const files = glob.sync('**/*.{ts,tsx}', {
  ignore: ['node_modules/**', '.next/**', 'scripts/**']
});

let totalReplacements = 0;
let filesChanged = 0;

files.forEach(filePath => {
  const fullPath = filePath;
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    let fileReplacements = 0;
    
    // Apply translations
    Object.entries(translations).forEach(([latvian, english]) => {
      const regex = new RegExp(latvian, 'g');
      const matches = (content.match(regex) || []).length;
      if (matches > 0) {
        content = content.replace(regex, english);
        fileReplacements += matches;
        totalReplacements += matches;
      }
    });
    
    if (content !== originalContent) {
      console.log(`✅ ${filePath}: ${fileReplacements} replacements`);
      filesChanged++;
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
});

console.log(`\n🎯 SUMMARY:`);
console.log(`📁 Files changed: ${filesChanged}`);
console.log(`🔄 Total replacements: ${totalReplacements}`);
console.log('✅ Latvian → English string replacement complete!');