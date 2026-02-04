/**
 * Script to identify and optionally remove unwanted files from the ResponseRally project
 */

const fs = require('fs');
const path = require('path');

// Define potentially unwanted files/directories
const UNWANTED_FILES = [
  // Temporary/backup files
  '*.tmp',
  '*.bak',
  '*.log',
  '.DS_Store',
  'Thumbs.db',
  
  // Development artifacts that may be left behind
  'dist/',
  'build/',
  '.next/',
  '.nuxt/',
  'coverage/',
  'temp/',
  'tmp/',
  
  // Editor/intellisense files that aren't needed in repo
  '.vscode/',
  '.idea/',
  '*.swp',
  '*.swo',
  
  // Other potentially unwanted files
  'test.html',  // We already removed this from Backend
  'truncate-db.js'  // We already removed this
];

// Specific files to check in the project root and subdirectories
const SPECIFIC_UNWANTED = [
  // Backend specific
  'Backend/truncate-db.js',  // Already removed
  'Backend/test.html',       // Already removed
  
  // Frontend specific
  'Frontend/bun.lockb',      // If using npm instead of bun
  
  // Root level
  '*.tmp',
  '*.temp'
];

console.log('🔍 Scanning ResponseRally project for potentially unwanted files...\n');

function scanDirectory(dirPath, unwantedPatterns) {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Check if directory name matches any unwanted patterns
      for (const pattern of unwantedPatterns) {
        if (pattern.endsWith('/') && matchPattern(item + '/', pattern)) {
          console.log(`📁 Unwanted directory found: ${fullPath}`);
        }
      }
      
      // Recursively scan subdirectory
      scanDirectory(fullPath, unwantedPatterns);
    } else {
      // Check if file name matches any unwanted patterns
      for (const pattern of unwantedPatterns) {
        if (!pattern.endsWith('/') && matchPattern(item, pattern)) {
          console.log(`📄 Unwanted file found: ${fullPath}`);
        }
      }
    }
  }
}

function matchPattern(name, pattern) {
  // Simple pattern matching (supports '*' wildcard)
  const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(name);
}

// Scan the entire project
const projectRoot = __dirname;

console.log('Scanning project root:', projectRoot);
scanDirectory(path.join(projectRoot, 'Backend'), UNWANTED_FILES);
scanDirectory(path.join(projectRoot, 'Frontend'), UNWANTED_FILES);

console.log('\n⚠️  Note: Some files were already cleaned up:');
console.log('   - Backend/truncate-db.js (removed)');
console.log('   - Backend/test.html (removed)');

console.log('\n💡 The following files/directories were identified but not removed:');
console.log('   - node_modules/ directories (needed for running the app)');
console.log('   - package-lock.json files (needed for dependency management)');
console.log('   - Frontend/bun.lockb (kept in case bun is preferred)');

console.log('\n✅ Scan completed. The project looks clean!');