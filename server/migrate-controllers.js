/**
 * Migration Script: Update all controllers to use universal database interface
 * This script updates all controller files to use db-universal instead of db
 */

const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'controllers');

// Get all controller files
const controllerFiles = fs.readdirSync(controllersDir)
  .filter(file => file.endsWith('.js'));

console.log(`Found ${controllerFiles.length} controller files to migrate:\n`);

controllerFiles.forEach(file => {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace db import with db-universal
  if (content.includes("require('../config/db')")) {
    content = content.replace(
      /const\s*{\s*pool\s*}\s*=\s*require\(['"]\.\.\/config\/db['"]\);/g,
      "const { query, insertAndGetId } = require('../config/db-universal');"
    );
    modified = true;
    console.log(`✓ ${file}: Updated import statement`);
  }

  // Replace pool.query with query
  if (content.includes('pool.query')) {
    const matches = content.match(/pool\.query/g);
    content = content.replace(/pool\.query/g, 'query');
    modified = true;
    console.log(`✓ ${file}: Replaced ${matches.length} pool.query calls`);
  }

  // Save the file if it was modified
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Saved: ${file}\n`);
  } else {
    console.log(`  No changes needed for ${file}\n`);
  }
});

console.log('\n✓ Migration complete!');
console.log('\nNOTE: You may need to manually update INSERT queries to use insertAndGetId()');
console.log('      where you need the inserted ID (instead of result.insertId)');
