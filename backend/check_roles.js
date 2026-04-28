const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const roles = await prisma.role.findMany({ include: { _count: { select: { users: true } } } });
  const users = await prisma.user.findMany({ select: { id: true, name: true, role_id: true } });
  console.log('Roles:', JSON.stringify(roles, null, 2));
  console.log('Users:', JSON.stringify(users, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
