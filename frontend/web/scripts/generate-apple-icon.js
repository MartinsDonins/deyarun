const fs = require('fs');
const path = require('path');

// Simple PNG creation for apple-touch-icon
// This creates a minimal PNG file with DeyaRun branding

function createAppleTouchIcon() {
  // Read the SVG content as template
  const svgPath = path.join(__dirname, '../public/logo.svg');
  
  if (!fs.existsSync(svgPath)) {
    console.error('logo.svg not found');
    return;
  }

  console.log('Creating apple-touch-icon.png...');
  
  // For now, copy the existing favicon-32x32.png as apple-touch-icon.png
  // This is a temporary solution until we can properly convert SVG to PNG
  const sourcePath = path.join(__dirname, '../public/favicon-32x32.png');
  const targetPath = path.join(__dirname, '../public/apple-touch-icon.png');
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log('apple-touch-icon.png created successfully (copied from favicon-32x32.png)');
  } else {
    console.error('Source favicon not found');
  }
}

createAppleTouchIcon();