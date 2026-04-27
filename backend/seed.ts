import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create an initial Organization
  const org = await prisma.organization.create({
    data: {
      school_name: 'Test Organization',
      subdomain: 'testorg'
    }
  });

  // Create System Admin Role
  const role = await prisma.role.create({
    data: {
      name: 'SUPER_ADMIN',
      description: 'Super Administrator',
      is_system: true,
      organization_id: org.id
    }
  });

  // Hash password
  const password_hash = await bcrypt.hash('Admin@123', 10);

  // Create User
  const user = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@test.com',
      password_hash,
      role_id: role.id,
      organization_id: org.id
    }
  });

  console.log('Seed completed successfully!');
  console.log('User created:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
