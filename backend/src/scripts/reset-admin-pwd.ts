import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  const email = 'micadmin@gmail.com';
  const plainPassword = 'Demo@123';
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  await prisma.user.update({
    where: { email },
    data: { password_hash: passwordHash }
  });

  console.log(`Successfully updated password for ${email} to ${plainPassword}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
