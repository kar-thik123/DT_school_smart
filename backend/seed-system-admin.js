const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function run() {
  const password_hash = await bcrypt.hash('System@123', 10);
  
  // 1. Ensure Organization exists
  let org = await prisma.organization.findFirst({ where: { subdomain: 'sys' } });
  if(!org) {
     org = await prisma.organization.create({ 
       data: { 
         school_name: 'Platform Core', 
         subdomain: 'sys',
         status: 'ACTIVE'
       } 
     });
     console.log('Created Platform Core Organization');
  }

  // 2. Ensure SYSTEM_ADMIN role exists
  let sysRole = await prisma.role.findFirst({ where: { name: 'SYSTEM_ADMIN' } });
  if (!sysRole) {
    sysRole = await prisma.role.create({
      data: { 
        name: 'SYSTEM_ADMIN', 
        description: 'Platform IT Setup', 
        is_system: true, 
        organization_id: org.id 
      }
    });
    console.log('Created SYSTEM_ADMIN Role');
  }

  // 2.5 Ensure SUPER_ADMIN role exists (needed for provisioning schools)
  let superRole = await prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
  if (!superRole) {
    superRole = await prisma.role.create({
      data: { 
        name: 'SUPER_ADMIN', 
        description: 'School Owner', 
        is_system: true, 
        organization_id: org.id 
      }
    });
    console.log('Created SUPER_ADMIN Role');
  }

  // 3. Upsert System Admin User
  const user = await prisma.user.upsert({
    where: { email: 'sysadmin@platform.com' },
    update: {
      password_hash: password_hash,
      role_id: sysRole.id,
      organization_id: org.id,
      is_active: true
    },
    create: {
      name: 'Platform Developer',
      email: 'sysadmin@platform.com',
      password_hash,
      role_id: sysRole.id,
      organization_id: org.id,
      is_active: true
    }
  });

  console.log('System Admin ready:', user.email);
  console.log('Password set to: System@123');
}

run()
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
