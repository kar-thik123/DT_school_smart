const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function main() {
  const secret = process.env.JWT_SECRET || 'supersecret_jwt_key_for_dev_only';
  const org = await prisma.organization.findFirst();
  if (!org) return console.log('No org found');

  const adminUser = await prisma.user.findFirst({ where: { organization_id: org.id } });
  if (!adminUser) return console.log('No user found');

  const token = jwt.sign({
    user_id: adminUser.id,
    role: 'SYSTEM_ADMIN',
    organization_id: org.id
  }, secret, { expiresIn: '1h' });

  console.log('Sending PATCH request...');
  const res = await fetch(`http://localhost:5000/api/organizations/${org.id}/settings`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Origin': 'https://school.dtacticsit.com'
    },
    body: JSON.stringify({
      school_name: 'Updated School Name'
    })
  });

  console.log('STATUS:', res.status);
  console.log('BODY:', await res.text());
}
main().catch(console.error).finally(() => prisma.$disconnect());
