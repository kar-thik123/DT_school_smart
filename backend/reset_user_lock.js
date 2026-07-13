const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const userBefore = await prisma.user.findFirst({
    where: { email: 'karthik6112001@gmail.com' }
  });
  console.log("Before reset:", {
    email: userBefore.email,
    failed_login_attempts: userBefore.failed_login_attempts,
    locked_until: userBefore.locked_until
  });

  const updated = await prisma.user.update({
    where: { id: userBefore.id },
    data: { failed_login_attempts: 0, locked_until: null }
  });
  console.log("After reset:", {
    email: updated.email,
    failed_login_attempts: updated.failed_login_attempts,
    locked_until: updated.locked_until
  });
}

run().catch(console.error).finally(() => prisma.$disconnect());
