const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function run() {
  const sql = fs.readFileSync('temp_migration.sql', 'utf-8');
  // Split the file by semicolon and execute each statement
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  
  for (let statement of statements) {
    if (statement.startsWith('--')) {
      // It might have comments, let's keep them if executeRawUnsafe handles it, or strip them
      statement = statement.split('\n').filter(line => !line.trim().startsWith('--')).join('\n').trim();
    }
    if (statement) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log('Success');
      } catch (err) {
        console.error('Error executing statement:', err.message);
      }
    }
  }
}
run().finally(() => prisma.$disconnect());
