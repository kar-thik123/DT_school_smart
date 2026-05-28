const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '../backend/src');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else {
      if (fullPath.endsWith('.ts')) {
        callback(fullPath);
      }
    }
  });
}

let errors = 0;

walk(backendDir, (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Look for hardcoded role string comparisons like: role === 'STUDENT', role.name === "TEACHER"
  const hardcodedRoleRegex = /(?:role|role\.name)\s*(?:===|!==|==|!=)\s*['"](?:STUDENT|TEACHER|MANAGEMENT|SYSTEM_ADMIN|ADMIN|SUPER_ADMIN)['"]/g;
  
  let match;
  while ((match = hardcodedRoleRegex.exec(content)) !== null) {
    console.error(`\x1b[31m[Governance Error]\x1b[0m Hardcoded role check found in ${filePath}`);
    console.error(`   Found: ${match[0]}`);
    console.error(`   Fix: Use AuthorizationService.hasIdentity() or AuthorizationService.hasPermission()\n`);
    errors++;
  }
});

if (errors > 0) {
  console.error(`\x1b[31mAudit Failed: ${errors} RBAC governance violations found.\x1b[0m`);
  process.exit(1);
} else {
  console.log('\x1b[32mRBAC Audit Passed: No hardcoded role checks found.\x1b[0m');
}
