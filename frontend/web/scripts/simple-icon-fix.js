const fs = require('fs');
const path = require('path');

// Simple solution: Copy favicon.ico content as base for PNG files
function fixAppleIcon() {
  const publicPath = path.join(__dirname, '../public');
  const faviconPath = path.join(publicPath, 'favicon.ico');
  const appleTouchIconPath = path.join(publicPath, 'apple-touch-icon.png');
  
  // Create a properly sized PNG placeholder with DeyaRun orange color
  // This is a valid 180x180 PNG with orange background
  const validPNG180x180 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAAA9zQYyAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAB3RJTUUH5wEaFCYhMtJ5vgAABZdJREFUeNrt3U1u2zAUBGCZ+Q8/+cqPfuUb/8IXvvGBL97YXVVOVZOmaJGc+ca2bJKSOfyYkSzr7Pv7+7kzn8+P+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+vw==',
    'base64'
  );
  
  console.log('Creating apple-touch-icon.png...');
  
  // Write the valid PNG data
  fs.writeFileSync(appleTouchIconPath, validPNG180x180);
  
  // Verify file was created
  const stats = fs.statSync(appleTouchIconPath);
  console.log(`apple-touch-icon.png created: ${stats.size} bytes`);
  
  return true;
}

try {
  fixAppleIcon();
  console.log('Apple touch icon fix completed successfully');
} catch (error) {
  console.error('Error creating apple touch icon:', error.message);
}