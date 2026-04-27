const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateSystemRoles() {
  const rolesToUpdate = ['SUPER_ADMIN', 'TEACHER', 'STUDENT', 'MANAGEMENT'];
  
  for (const role of rolesToUpdate) {
    const updated = await prisma.role.updateMany({
      where: { name: role },
      data: { is_system: true }
    });
    console.log(`Updated ${role} to is_system=true. Count: ${updated.count}`);
  }
  
  await prisma.$disconnect();
}
updateSystemRoles().catch(console.error);
