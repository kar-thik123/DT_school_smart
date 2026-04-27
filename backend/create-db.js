const { PrismaClient } = require('@prisma/client');

async function createDb() {
  // Connect to the default 'postgres' database which always exists
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:password123@localhost:5432/postgres?schema=public'
      }
    }
  });

  try {
    await prisma.$connect();
    console.log('Connected to default postgres DB.');
    // In PostgreSQL, you cannot CREATE DATABASE inside a transaction block, 
    // so we just execute it raw. Prisma $executeRawUnsafe wraps in transaction by default?
    // Let's use pg directly if Prisma fails, or just execute raw.
    await prisma.$executeRawUnsafe(`CREATE DATABASE school_saas;`);
    console.log('Database school_saas created successfully!');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('Database already exists. Ignoring.');
      process.exit(0);
    }
    console.error('Failed to create DB:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createDb();
