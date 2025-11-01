#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Production Debug Code Cleanup Script
 * Replaces all console.* statements with structured production logging
 */

// Console statement patterns and their replacements
const REPLACEMENTS = [
  // Basic console.log replacements
  {
    pattern: /console\.log\(['"`]([^'"`]+)['"`]\s*,?\s*([^)]*)\)/g,
    replacement: (match, message, params) => {
      const cleanParams = params.trim();
      if (cleanParams && cleanParams !== '') {
        return `logger.info('COMPONENT', '${message}', { ${cleanParams} })`;
      }
      return `logger.info('COMPONENT', '${message}')`;
    }
  },
  
  // console.log with template literals
  {
    pattern: /console\.log\(`([^`]+)`\)/g,
    replacement: (match, template) => {
      // Simple template literal conversion
      const message = template.replace(/\$\{([^}]+)\}/g, '${$1}');
      return `logger.info('COMPONENT', \`${message}\`)`;
    }
  },
  
  // console.error replacements
  {
    pattern: /console\.error\(['"`]([^'"`]+)['"`]\s*,?\s*([^)]*)\)/g,
    replacement: (match, message, params) => {
      const cleanParams = params.trim();
      if (cleanParams && cleanParams !== '') {
        return `logger.error('ERROR', '${message}', { error: ${cleanParams} })`;
      }
      return `logger.error('ERROR', '${message}')`;
    }
  },
  
  // console.warn replacements
  {
    pattern: /console\.warn\(['"`]([^'"`]+)['"`]\s*,?\s*([^)]*)\)/g,
    replacement: (match, message, params) => {
      const cleanParams = params.trim();
      if (cleanParams && cleanParams !== '') {
        return `logger.warn('WARNING', '${message}', { ${cleanParams} })`;
      }
      return `logger.warn('WARNING', '${message}')`;
    }
  },
  
  // console.info replacements
  {
    pattern: /console\.info\(['"`]([^'"`]+)['"`]\s*,?\s*([^)]*)\)/g,
    replacement: (match, message, params) => {
      const cleanParams = params.trim();
      if (cleanParams && cleanParams !== '') {
        return `logger.info('INFO', '${message}', { ${cleanParams} })`;
      }
      return `logger.info('INFO', '${message}')`;
    }
  },
  
  // console.debug replacements  
  {
    pattern: /console\.debug\(['"`]([^'"`]+)['"`]\s*,?\s*([^)]*)\)/g,
    replacement: (match, message, params) => {
      const cleanParams = params.trim();
      if (cleanParams && cleanParams !== '') {
        return `logger.debug('DEBUG', '${message}', { ${cleanParams} })`;
      }
      return `logger.debug('DEBUG', '${message}')`;
    }
  }
];

// Simple console statements with variable parameters
const SIMPLE_REPLACEMENTS = [
  { pattern: /console\.log\(/g, replacement: 'logger.log(' },
  { pattern: /console\.error\(/g, replacement: 'logger.error(\'ERROR\', ' },
  { pattern: /console\.warn\(/g, replacement: 'logger.warn(\'WARNING\', ' },
  { pattern: /console\.info\(/g, replacement: 'logger.info(\'INFO\', ' },
  { pattern: /console\.debug\(/g, replacement: 'logger.debug(\'DEBUG\', ' }
];

// Import statements to add
const LOGGER_IMPORT = "import { logger } from '../lib/productionLogger'";
const LOGGER_IMPORT_RELATIVE = "import { logger } from './lib/productionLogger'";

function addLoggerImport(content, filePath) {
  // Check if logger import already exists
  if (content.includes('productionLogger')) {
    return content;
  }
  
  // Don't add import if no console statements were found
  if (!content.includes('logger.')) {
    return content;
  }
  
  const lines = content.split('\n');
  let insertIndex = 0;
  
  // Find the best place to insert the import
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('import ') || line.startsWith('const ') || line.startsWith('type ')) {
      insertIndex = i + 1;
    } else if (line === '' || line.startsWith('//') || line.startsWith('/*')) {
      continue;
    } else {
      break;
    }
  }
  
  // Determine correct import path based on file location
  const relativePath = path.relative(process.cwd(), filePath);
  const depth = relativePath.split(path.sep).length - 3; // Adjust for web folder depth
  const importPath = depth <= 1 ? LOGGER_IMPORT_RELATIVE : LOGGER_IMPORT;
  
  lines.splice(insertIndex, 0, importPath);
  return lines.join('\n');
}

function replaceConsoleStatements(content) {
  let modifiedContent = content;
  let replacementCount = 0;
  
  // Apply complex pattern replacements first
  REPLACEMENTS.forEach(({ pattern, replacement }) => {
    modifiedContent = modifiedContent.replace(pattern, (match, ...groups) => {
      replacementCount++;
      if (typeof replacement === 'function') {
        return replacement(match, ...groups);
      }
      return replacement;
    });
  });
  
  // Apply simple replacements for remaining console statements
  SIMPLE_REPLACEMENTS.forEach(({ pattern, replacement }) => {
    const matches = modifiedContent.match(pattern);
    if (matches) {
      replacementCount += matches.length;
      modifiedContent = modifiedContent.replace(pattern, replacement);
    }
  });
  
  return { content: modifiedContent, replacementCount };
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const originalConsoleCount = (content.match(/console\./g) || []).length;
  
  if (originalConsoleCount === 0) {
    return { processed: false, replacements: 0 };
  }
  
  const { content: modifiedContent, replacementCount } = replaceConsoleStatements(content);
  const contentWithImport = addLoggerImport(modifiedContent, filePath);
  
  // Write back to file
  fs.writeFileSync(filePath, contentWithImport, 'utf8');
  
  const remainingConsoleCount = (contentWithImport.match(/console\./g) || []).length;
  
  console.log(`✅ ${filePath}: ${originalConsoleCount} console statements → ${remainingConsoleCount} remaining (${replacementCount} replaced)`);
  
  return { 
    processed: true, 
    replacements: replacementCount,
    originalCount: originalConsoleCount,
    remainingCount: remainingConsoleCount
  };
}

// Main execution
async function main() {
  console.log('🔧 Starting console statement replacement...\n');
  
  const webPath = path.resolve(__dirname, '..');
  const pattern = '**/*.{ts,tsx}';
  
  console.log(`🔍 Scanning in directory: ${webPath}`);
  console.log(`🔍 Pattern: ${pattern}`);
  
  const files = glob.sync(pattern, { 
    cwd: webPath,
    ignore: [
      '**/node_modules/**',
      '**/scripts/**',
      '**/*.d.ts',
      '**/lib/productionLogger.ts' // Don't modify the logger itself
    ]
  }).map(file => path.join(webPath, file));
  
  let totalFiles = 0;
  let processedFiles = 0;
  let totalReplacements = 0;
  let totalOriginalConsole = 0;
  let totalRemainingConsole = 0;
  
  for (const file of files) {
    totalFiles++;
    const result = processFile(file);
    
    if (result.processed) {
      processedFiles++;
      totalReplacements += result.replacements;
      totalOriginalConsole += result.originalCount;
      totalRemainingConsole += result.remainingCount;
    }
  }
  
  console.log('\n📊 REPLACEMENT SUMMARY:');
  console.log(`📁 Total files scanned: ${totalFiles}`);
  console.log(`🔄 Files processed: ${processedFiles}`);
  console.log(`🔍 Original console statements: ${totalOriginalConsole}`);
  console.log(`✅ Console statements replaced: ${totalReplacements}`);
  console.log(`⚠️  Console statements remaining: ${totalRemainingConsole}`);
  console.log(`🎯 Replacement efficiency: ${totalOriginalConsole > 0 ? Math.round((totalReplacements / totalOriginalConsole) * 100) : 0}%`);
  
  if (totalRemainingConsole > 0) {
    console.log('\n⚠️  Some console statements could not be automatically replaced.');
    console.log('   Manual review needed for complex patterns.');
  } else {
    console.log('\n🎉 All console statements successfully replaced!');
  }
}

// Handle script execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { replaceConsoleStatements, processFile };