import * as fs from 'fs';
import * as path from 'path';

function main() {
  const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  const lines = schema.split('\n');
  
  const printModel = (modelName: string) => {
    let inModel = false;
    const modelLines: string[] = [];
    for (const line of lines) {
      if (line.includes(`model ${modelName}`)) {
        inModel = true;
      }
      if (inModel) {
        modelLines.push(line);
        if (line.includes('}') && !line.includes('{')) {
          inModel = false;
        }
      }
    }
    console.log(`\n--- MODEL ${modelName} ---`);
    console.log(modelLines.join('\n'));
  };

  printModel('Examination');
  printModel('StudentExamResult');
  printModel('StudentExamSubjectResult');
}

main();
