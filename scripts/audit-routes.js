const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '../frontend_smart/source/main/src/app');

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else {
      if (fullPath.endsWith('.routes.ts') || fullPath.endsWith('registry.ts')) {
        callback(fullPath);
      }
    }
  });
}

let errors = 0;

walk(frontendDir, (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Look for deprecated permissions like READ or EDIT
  const deprecatedRegex = /['"](?:[A-Z_]+):(READ|EDIT)['"]/g;
  
  let match;
  while ((match = deprecatedRegex.exec(content)) !== null) {
    console.error(`\x1b[31m[Governance Error]\x1b[0m Deprecated permission found in ${filePath}`);
    console.error(`   Found: ${match[0]}`);
    console.error(`   Fix: Update 'READ' to 'VIEW' and 'EDIT' to 'UPDATE'\n`);
    errors++;
  }
});

if (errors > 0) {
  console.error(`\x1b[31mAudit Failed: ${errors} route metadata governance violations found.\x1b[0m`);
  process.exit(1);
} else {
  console.log('\x1b[32mRoute Metadata Audit Passed: No deprecated permissions found.\x1b[0m');
}
