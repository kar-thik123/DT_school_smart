const fs = require('fs');
const path = require('path');

const permissionsJsonPath = path.join(__dirname, '../permissions.json');
const backendDest = path.join(__dirname, '../backend/src/utils/permissions.ts');
const frontendDest = path.join(__dirname, '../frontend_smart/source/main/src/app/core/constants/permission-registry.ts');

const data = JSON.parse(fs.readFileSync(permissionsJsonPath, 'utf8'));

let tsContent = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Update permissions.json in the project root and run 'node scripts/generate-permissions.js'

export const PERMISSIONS_REGISTRY = ${JSON.stringify(data.modules, null, 2)} as const;

export type PermissionModule = keyof typeof PERMISSIONS_REGISTRY;
export type PermissionAction<M extends PermissionModule> = (typeof PERMISSIONS_REGISTRY)[M]['actions'][number];
`;

// Write to backend
fs.mkdirSync(path.dirname(backendDest), { recursive: true });
fs.writeFileSync(backendDest, tsContent);
console.log(`Generated backend registry at ${backendDest}`);

// Write to frontend
fs.mkdirSync(path.dirname(frontendDest), { recursive: true });
fs.writeFileSync(frontendDest, tsContent);
console.log(`Generated frontend registry at ${frontendDest}`);
