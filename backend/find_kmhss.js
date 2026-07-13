const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const orgs = await prisma.organization.findMany();
  console.log("ORGANIZATIONS:");
  orgs.forEach(o => {
    console.log(`ID: ${o.id} | Name: ${o.school_name} | Logo: ${o.logo_url}`);
  });
  
  const users = await prisma.user.findMany({
    include: {
      organization: true,
      role: true
    }
  });
  console.log("\nUSERS:");
  users.forEach(u => {
    console.log(`Email: ${u.email} | Name: ${u.name} | Role: ${u.role?.name} | Org: ${u.organization?.school_name}`);
  });
}
run().catch(console.error).finally(() => prisma.$disconnect());
