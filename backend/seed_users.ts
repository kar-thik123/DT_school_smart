import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching First Organization...');
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: {
        school_name: 'Test School',
        subdomain: 'test-school'
      }
    });
    console.log('Created missing organization: Test School');
  } else {
    console.log(`Using organization: ${org.school_name} (${org.id})`);
  }

  const rolesToCreate = ['MANAGEMENT', 'TEACHER', 'STUDENT'];
  const roleMap: Record<string, string> = {};

  for (const roleName of rolesToCreate) {
    let role = await prisma.role.findFirst({
      where: { name: roleName, organization_id: org.id }
    });
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: roleName,
          organization_id: org.id,
          description: `${roleName} role for testing`
        }
      });
      console.log(`Created ${roleName} role.`);
    }
    roleMap[roleName] = role.id;
  }

  const password_hash = await bcrypt.hash('password123', 10);

  const testUsers = [
    {
      name: 'Test Manager',
      email: 'manager@test.com',
      role_id: roleMap['MANAGEMENT'],
      organization_id: org.id,
      password_hash
    },
    {
      name: 'Test Teacher',
      email: 'teacher@test.com',
      role_id: roleMap['TEACHER'],
      organization_id: org.id,
      password_hash
    },
    {
      name: 'Test Student',
      email: 'student@test.com',
      role_id: roleMap['STUDENT'],
      organization_id: org.id,
      password_hash
    }
  ];

  for (const userData of testUsers) {
    const existing = await prisma.user.findFirst({
      where: { email: userData.email, organization_id: org.id }
    });
    if (!existing) {
      await prisma.user.create({ data: userData });
      console.log(`Created user: ${userData.email}`);
    } else {
        // update password if it existed just to be safe
       await prisma.user.update({
          where: { id: existing.id },
          data: { password_hash }
       });
       console.log(`Reset password for existing user: ${userData.email}`);
    }
  }

  console.log('=============================');
  console.log('SUCCESS! Test Users Created/Updated:');
  console.log('URL: http://localhost:4200 (or your configured frontend url)');
  console.log('MANAGEMENT -> Email: manager@test.com | Password: password123');
  console.log('TEACHER    -> Email: teacher@test.com | Password: password123');
  console.log('STUDENT    -> Email: student@test.com | Password: password123');
  console.log('=============================');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
