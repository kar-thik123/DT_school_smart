const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const secret = 'supersecret_jwt_key_for_dev_only';

async function main() {
  const adminRole = await prisma.role.findFirst({ where: { name: 'SYSTEM_ADMIN' } });
  if (!adminRole) {
    console.log('No SYSTEM_ADMIN role found');
    return;
  }
  const adminUser = await prisma.user.findFirst({ where: { role_id: adminRole.id } });
  if (!adminUser) {
    console.log('No SYSTEM_ADMIN user found');
    return;
  }
  
  const token = jwt.sign({
    user_id: adminUser.id,
    role: 'SYSTEM_ADMIN',
  }, secret, { expiresIn: '1h' });

  console.log('TOKEN:', token);
  
  // Find an organization to update
  const org = await prisma.organization.findFirst();
  console.log('Testing against org:', org.id);

  // Perform GET
  const getRes = await fetch(`http://localhost:5000/organizations/${org.id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('GET STATUS:', getRes.status);
  
  // Perform PATCH
  const patchRes = await fetch(`http://localhost:5000/organizations/${org.id}/settings`, {
    method: 'PATCH',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      school_name: org.school_name,
      admin_email: 'test@example.com'
    })
  });
  console.log('PATCH STATUS:', patchRes.status);
  console.log('PATCH BODY:', await patchRes.text());
}

main().catch(console.error).finally(() => prisma.$disconnect());
