const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ include: { role: true } });
  let fixed = 0;
  for (const user of users) {
    if (user.role.organization_id !== user.organization_id) {
      console.log(`Fixing user ${user.name} (${user.email}). Current role org: ${user.role.organization_id}, User org: ${user.organization_id}`);
      
      // Find the correct role in the user's org
      const correctRole = await prisma.role.findFirst({
        where: { name: user.role.name, is_system: user.role.is_system, organization_id: user.organization_id }
      });
      
      if (correctRole) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role_id: correctRole.id }
        });
        console.log(`Updated user ${user.name} to correct role ID: ${correctRole.id}`);
        fixed++;
      } else {
        console.log(`ERROR: Could not find equivalent role '${user.role.name}' in org ${user.organization_id}`);
      }
    }
  }
  console.log(`Fixed ${fixed} users.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
