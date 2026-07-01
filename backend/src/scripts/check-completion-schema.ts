import * as fs from 'fs';
import * as path from 'path';

function main() {
  const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  const lines = schema.split('\n');
  let inModel = false;
  const modelLines: string[] = [];

  for (const line of lines) {
    if (line.includes('model CompletionTracking')) {
      inModel = true;
    }
    if (inModel) {
      modelLines.push(line);
      if (line.includes('}') && !line.includes('{')) {
        inModel = false;
      }
    }
  }

  console.log('--- CompletionTracking Model in Schema ---');
  console.log(modelLines.join('\n'));
}

main();
