// Fix remaining Latvian UI strings
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const additionalTranslations = {
  'Atjaunina...': 'Updating...',
  'Atjaunot': 'Refresh',
  'Atjaunot datus': 'Refresh data',
  'Atjaunot noklusējumu': 'Reset to default',
  'Atjaunot servera info': 'Refresh server info',
  'Atjaunots:': 'Updated:',
  'Integrācijas kļūda': 'Integration error',
  'Aplikācijas kļūda': 'Application error',
  'Dizaina kļūda': 'Design error',
  'Pieslēgšanās problēma': 'Login issue',
  'refresh_data': 'refresh_data',
  'Atjaunot datus': 'Refresh data'
};

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
    
    Object.entries(additionalTranslations).forEach(([latvian, english]) => {
      const regex = new RegExp(latvian.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
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

console.log(`\n🎯 REMAINING LATVIAN CLEANUP:`);
console.log(`📁 Files changed: ${filesChanged}`);
console.log(`🔄 Total replacements: ${totalReplacements}`);
console.log('✅ Final Latvian → English cleanup complete!');