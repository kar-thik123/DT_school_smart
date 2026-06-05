import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allRoles = await prisma.role.findMany({
    orderBy: { created_at: 'asc' }
  });
  
  console.log('Total roles:', allRoles.length);
  
  const superAdmins = allRoles.filter(r => r.name === 'SUPER_ADMIN');
  console.log('\n--- SUPER_ADMIN Roles ---');
  console.table(superAdmins.map(r => ({
    id: r.id,
    name: r.name,
    organization_id: r.organization_id,
    is_system: r.is_system,
    created_at: r.created_at
  })));

  const teachers = allRoles.filter(r => r.name === 'TEACHER');
  console.log('\n--- TEACHER Roles ---');
  console.table(teachers.map(r => ({
    id: r.id,
    name: r.name,
    organization_id: r.organization_id,
    is_system: r.is_system,
    created_at: r.created_at
  })));

  const systemAdmins = allRoles.filter(r => r.name === 'SYSTEM_ADMIN');
  console.log('\n--- SYSTEM_ADMIN Roles ---');
  console.table(systemAdmins.map(r => ({
    id: r.id,
    name: r.name,
    organization_id: r.organization_id,
    is_system: r.is_system,
    created_at: r.created_at
  })));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
