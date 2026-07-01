import * as fs from 'fs';
import * as path from 'path';

function main() {
  const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  const regex = /model\s+(\w+)\s+\{/g;
  let match;
  const models = [];
  while ((match = regex.exec(schema)) !== null) {
    models.push(match[1]);
  }
  
  console.log('--- ALL PRISMA MODELS ---');
  console.log(models.join('\n'));
}

main();
