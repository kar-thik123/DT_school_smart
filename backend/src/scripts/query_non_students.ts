import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orgId = '1c9ad3bd-1c01-481e-8276-16ed612f52bc';
  
  // Find users in org who do not have 'Student' or 'STUDENT' in their role name
  const users = await prisma.user.findMany({
    where: {
      organization_id: orgId,
      NOT: {
        role: {
          name: {
            in: ['Student', 'STUDENT']
          }
        }
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: { select: { name: true } }
    }
  });

  console.log('NON-STUDENT USERS:');
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
