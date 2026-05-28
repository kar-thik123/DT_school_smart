const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'sysadmin@platform.com';
  const password = 'System@123';

  const user = await prisma.user.findFirst({
    where: { email }
  });

  if (!user) {
    console.log('User not found');
    return;
  }
  console.log('User is_active:', user.is_active);

  const isMatch = await bcrypt.compare(password, user.password_hash);
  console.log('Password match:', isMatch);
}

main().finally(() => prisma.$disconnect());
