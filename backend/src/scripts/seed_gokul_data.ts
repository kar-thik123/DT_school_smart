import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orgId = '1c9ad3bd-1c01-481e-8276-16ed612f52bc';
  const studentId = '4aa7141e-6887-4f94-ab74-0836ee5de96a';
  const academicYearId = '182480cb-b0f9-4eb8-af1d-dc19cea211a4';
  const gradeId = 'c9c71dd7-fc6e-4349-b7ce-d8c7e27c4bdf';
  const sectionId = '468cacf5-9432-4e85-b995-023d3be941b0';

  console.log('Clearing existing mock dashboard data for Gokul...');
  await prisma.studentDashboardSummary.deleteMany({ where: { student_id: studentId } });
  await prisma.studentDashboardWeeklyTrend.deleteMany({ where: { student_id: studentId } });
  await prisma.skill.deleteMany({ where: { user_id: studentId } });
  await prisma.practiceAttempt.deleteMany({ where: { student_id: studentId } });
  await prisma.completionTracking.deleteMany({ where: { completed_by: studentId } });
  await prisma.studentTopicCompletion.deleteMany({ where: { student_id: studentId } });
  // 1. Create StudentDashboardSummary
  console.log('Seeding StudentDashboardSummary...');
  await prisma.studentDashboardSummary.create({
    data: {
      organization_id: orgId,
      student_id: studentId,
      academic_year_id: academicYearId,
      practice_accuracy: 84.5,
      questions_attempted: 120,
      skills_completion_percentage: 75.0,
      verified_skills: 3,
      pending_skills: 1
    }
  });

  // 2. Create Weekly Trend
  console.log('Seeding Weekly Trends...');
  const baseDate = new Date();
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(baseDate);
    weekStart.setDate(baseDate.getDate() - (4 - i) * 7);
    weekStart.setUTCHours(0, 0, 0, 0);

    const accuracies = [70.0, 75.2, 78.5, 84.5];
    const questions = [20, 30, 35, 35];

    await prisma.studentDashboardWeeklyTrend.create({
      data: {
        organization_id: orgId,
        student_id: studentId,
        academic_year_id: academicYearId,
        week_start_date: weekStart,
        accuracy_percentage: accuracies[i],
        questions_attempted: questions[i]
      }
    });
  }

  // 3. Create Skills
  console.log('Seeding Skills...');
  const skillsData = [
    { skill_name: 'Acrylic Painting', skill_type: 'Art & Craft', status: 'approved' },
    { skill_name: 'School Basketball Team Captain', skill_type: 'Sports & Games', status: 'approved' },
    { skill_name: 'Classical Piano - Grade 5', skill_type: 'Music & Performing Arts', status: 'approved' },
    { skill_name: 'Web Application Development', skill_type: 'Technology & Coding', status: 'pending' }
  ];

  for (const s of skillsData) {
    await prisma.skill.create({
      data: {
        user_id: studentId,
        organization_id: orgId,
        academic_year_id: academicYearId,
        skill_name: s.skill_name,
        skill_type: s.skill_type,
        status: s.status,
        images: ['/uploads/skills/mock_badge.png']
      }
    });
  }

  // 4. Fetch Subjects for Grade 10
  console.log('Fetching Subjects for Grade 10...');
  const subjects = await prisma.subject.findMany({
    where: { grade_id: gradeId, organization_id: orgId },
    include: {
      units: {
        include: {
          topics: true
        }
      }
    }
  });

  if (subjects.length === 0) {
    console.log('No subjects found! Cannot seed practice attempts or curriculum completion.');
    return;
  }

  console.log(`Found ${subjects.length} subjects. Seeding practice attempts and completion tracking...`);

  // We want to simulate practice attempts under these subjects
  for (const sub of subjects) {
    // Get first topic in first unit if it exists
    const topic = sub.units?.[0]?.topics?.[0];
    if (topic) {
      // Create a practice attempt
      await prisma.practiceAttempt.create({
        data: {
          organization_id: orgId,
          student_id: studentId,
          subject_id: sub.id,
          topic_id: topic.id,
          academic_year_id: academicYearId,
          total_questions: 10,
          correct_answers: 8 // 80% accuracy
        }
      });

      // Mark topic as completed
      await prisma.completionTracking.create({
        data: {
          organization_id: orgId,
          academic_year_id: academicYearId,
          grade_id: gradeId,
          section_id: sectionId,
          subject_id: sub.id,
          topic_id: topic.id,
          completion_level: 'TOPIC',
          is_completed: true,
          completed_by: studentId,
          completed_at: new Date()
        }
      });

      // Also create a student_topic_completions entry (which subject-performance raw SQL uses!)
      await prisma.studentTopicCompletion.create({
        data: {
          organization_id: orgId,
          student_id: studentId,
          subject_id: sub.id,
          topic_id: topic.id,
          academic_year_id: academicYearId,
          completed_at: new Date()
        }
      });
    }

    // Mark unit as completed
    const unit = sub.units?.[0];
    if (unit) {
      await prisma.completionTracking.create({
        data: {
          organization_id: orgId,
          academic_year_id: academicYearId,
          grade_id: gradeId,
          section_id: sectionId,
          subject_id: sub.id,
          unit_id: unit.id,
          completion_level: 'UNIT',
          is_completed: true,
          completed_by: studentId,
          completed_at: new Date()
        }
      });
    }
  }

  // 5. Ensure TeacherAssignments exist for this class
  console.log('Verifying Teacher Assignments...');
  const teachersCount = await prisma.teacherAssignment.count({
    where: {
      organization_id: orgId,
      grade_id: gradeId,
      OR: [
        { section_id: sectionId },
        { section_id: null }
      ]
    }
  });

  console.log(`Current teacher assignments count: ${teachersCount}`);
  if (teachersCount === 0) {
    console.log('No teacher assignments found. Seeding a mock teacher assignment...');
    // Find a teacher user
    const teacher = await prisma.user.findFirst({
      where: {
        organization_id: orgId,
        role: { name: { in: ['Teacher', 'TEACHER'] } }
      }
    });

    if (teacher) {
      await prisma.teacherAssignment.create({
        data: {
          organization_id: orgId,
          academic_year_id: academicYearId,
          teacher_id: teacher.id,
          assignment_type: 'SUBJECT_TEACHER',
          grade_id: gradeId,
          section_id: sectionId,
          subject_id: subjects[0].id
        }
      });
      console.log(`Seeded teacher assignment for teacher: ${teacher.name} and subject: ${subjects[0].name}`);
    } else {
      console.log('No user with role TEACHER found.');
    }
  }

  console.log('Seeding completed successfully! 🎉');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
