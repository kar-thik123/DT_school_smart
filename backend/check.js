const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const org = await prisma.organization.findUnique({where: {id: 'c99004d4-0307-4155-934e-363ec37a49e2'}});
  console.log('DB LOGO URL:', org.logo_url);
}
main().catch(console.error).finally(() => prisma.$disconnect());
