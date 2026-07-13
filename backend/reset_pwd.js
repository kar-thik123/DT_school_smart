const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function run() {
  const hash = await bcrypt.hash('System@123', 10);
  const updated = await prisma.user.update({
    where: { id: 'b2a31de2-43ac-4ce6-81b8-19634e773b65' },
    data: { password_hash: hash }
  });
  console.log("Updated user password:", updated.email);
}

run().catch(console.error).finally(() => prisma.$disconnect());
