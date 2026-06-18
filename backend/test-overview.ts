import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  const firstEnrollment = await prisma.studentEnrollment.findFirst();
  const student = await prisma.user.findFirst({
    where: { id: firstEnrollment!.student_id }
  });
  const orgId = student!.organization_id;

  const academicYear = await prisma.academicYear.findFirst({
    where: { id: firstEnrollment!.academic_year_id }
  });

  const user = await prisma.user.findFirst({
    where: { 
      id: student!.id,
      organization_id: orgId
    },
    select: {
      name: true,
      roll_number: true,
      user_profile: { select: { profile_image: true } },
      enrollments: {
        where: { 
          organization_id: orgId,
          academic_year_id: academicYear!.id
        },
        select: {
          grade: { select: { name: true } },
          section: { select: { name: true } },
          academic_year: { select: { name: true } }
        },
        take: 1
      }
    }
  });

  console.log("User Query Result:");
  console.log(JSON.stringify(user, null, 2));

  // Check their actual enrollments without filtering by active year just in case
  const allEnrollments = await prisma.studentEnrollment.findMany({
    where: { student_id: student!.id }
  });
  console.log("All Enrollments for student:", allEnrollments);
}

test().catch(console.error).finally(() => prisma.$disconnect());
