"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🚀 Running database column hardening script (version 2)...');
    const queries = [
        // 1. Add created_at and updated_at to academic_years
        `ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();`,
        `ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();`,
        // 2. Add created_at and updated_at to grades
        `ALTER TABLE grades ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();`,
        `ALTER TABLE grades ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();`,
        // 3. Add created_at and updated_at to sections
        `ALTER TABLE sections ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();`,
        `ALTER TABLE sections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();`,
        // 4. Add updated_at to users
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();`,
        // 5. Add updated_at to subject_groups
        `ALTER TABLE subject_groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();`
    ];
    for (const q of queries) {
        try {
            console.log(`Executing: ${q}`);
            await prisma.$executeRawUnsafe(q);
            console.log('  ✅ Success');
        }
        catch (err) {
            console.error(`  ❌ Failed: ${err.message}`);
        }
    }
    console.log('🎉 Database column hardening script (version 2) completed!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
