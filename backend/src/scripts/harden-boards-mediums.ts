import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🏁 Starting Additional Database Integrity Scan for Boards, Mediums, and OrganizationTypes...');

  const extraTables = [
    { name: 'Board', table: 'boards' },
    { name: 'Medium', table: 'mediums' },
    { name: 'OrganizationType', table: 'organization_types' }
  ];

  for (const item of extraTables) {
    try {
      console.log(`\n🔍 Scanning Table '${item.table}'...`);

      // Check existing columns
      const cols: any = await prisma.$queryRawUnsafe(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${item.table}'
      `);
      
      const existingCols = new Set(cols.map((c: any) => c.column_name.toLowerCase()));

      if (existingCols.size === 0) {
        console.log(`⚠️  Table '${item.table}' does not exist or has no columns.`);
        continue;
      }

      const standardAuditing = [
        { name: 'created_at', type: 'TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()' },
        { name: 'updated_at', type: 'TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()' }
      ];

      for (const col of standardAuditing) {
        if (!existingCols.has(col.name)) {
          console.log(`  ➕ Column '${col.name}' is missing in '${item.table}'!`);
          const alterQuery = `ALTER TABLE ${item.table} ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`;
          console.log(`  Executing: ${alterQuery}`);
          await prisma.$executeRawUnsafe(alterQuery);
          console.log('    ✅ Success');
        }
      }
    } catch (err: any) {
      console.error(`  ❌ Error processing model ${item.name}:`, err.message);
    }
  }

  console.log('\n🎉 Additional Database Integrity Recovery Complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
