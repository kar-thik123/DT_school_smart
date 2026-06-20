import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('--- Audit 1 - Student Identity Verification ---');
  const gokuls = await prisma.user.findMany({ where: { name: 'Gokul Sharma' }, include: { enrollments: true } });
  const haris = await prisma.user.findMany({ where: { name: 'Hari Reddy' }, include: { enrollments: true } });

  const gokul = gokuls.find(u => u.enrollments.length > 0) || gokuls[0];
  const hari = haris.find(u => u.enrollments.length > 0) || haris[0];

  const students = [
    { name: 'Gokul Sharma', user: gokul },
    { name: 'Hari Reddy', user: hari }
  ];

  for (const s of students) {
    if (s.user) {
      console.log(`Student Name: ${s.name}`);
      console.log(`Student ID: ${s.user.id}`);
      console.log(`Organization ID: ${s.user.organization_id}`);
      if (s.user.enrollments && s.user.enrollments.length > 0) {
        console.log(`Academic Year ID: ${s.user.enrollments[0].academic_year_id}`);
        console.log(`Current Enrollment Status: Active`);
      } else {
        console.log(`Academic Year ID: None`);
        console.log(`Current Enrollment Status: Not Enrolled`);
      }
      console.log('---');
    }
  }

  console.log('\n--- Audit 2 & 4 - Attendance Ownership Scan ---');
  const totalAttendance = await prisma.studentAttendance.count();
  console.log(`Total Attendance Records: ${totalAttendance}`);

  for (const s of students) {
    if (s.user) {
      const records = await prisma.studentAttendance.findMany({
        where: { student_id: s.user.id }
      });
      console.log(`Records Belonging To ${s.name}: ${records.length}`);
      
      let present = 0, absent = 0, late = 0, excused = 0;
      records.forEach((r: any) => {
        if (r.status === 'PRESENT' || r.status === 'HALF_DAY') present++;
        else if (r.status === 'ABSENT') absent++;
        else if (r.status === 'LATE') late++;
        else if (r.status === 'EXCUSED') excused++;
      });
      console.log(`  Present Count: ${present}`);
      console.log(`  Absent Count: ${absent}`);
      console.log(`  Late Count: ${late}`);
      console.log(`  Excused Count: ${excused}`);
    }
  }
  
  if (gokul && hari) {
    const others = await prisma.studentAttendance.count({
      where: {
        student_id: { notIn: [gokul.id, hari.id] }
      }
    });
    console.log(`Records Belonging To Other Students: ${others}`);
  }

  console.log('\n--- Audit 3 - Attendance Filter Validation ---');
  // I need to see an example record from the database to see its organization_id and student_id
  const sampleAtt = await prisma.studentAttendance.findFirst();
  if (sampleAtt) {
    console.log(`Sample Attendance Record Student ID: ${sampleAtt.student_id}`);
    console.log(`Sample Attendance Record Org ID: ${sampleAtt.organization_id}`);
    // Check if Gokul's org matches
    if (gokul) {
       console.log(`Gokul's Org ID: ${gokul.organization_id}`);
       console.log(`Filter Match (Org ID): ${gokul.organization_id === sampleAtt.organization_id ? 'Yes' : 'No'}`);
    }
  }

  console.log('\n--- Audit 5 - Assessment Attempt Ownership Scan ---');
  for (const s of students) {
    if (s.user) {
      const studentAssessmentAttempts = await prisma.studentAssessmentAttempt.count({ where: { student_id: s.user.id } });
      const practiceAttempts = await prisma.practiceAttempt.count({ where: { student_id: s.user.id } });
      
      let completedNodes = 0;
      if (s.user.enrollments && s.user.enrollments.length > 0) {
        completedNodes = await prisma.completionTracking.count({
          where: { 
            grade_id: s.user.enrollments[0].grade_id,
            is_completed: true,
            OR: [
              { section_id: s.user.enrollments[0].section_id },
              { section_id: null }
            ]
          }
        });
      }

      console.log(`Student Name: ${s.name}`);
      console.log(`Assessment Attempts: ${studentAssessmentAttempts}`);
      console.log(`Completed Nodes (Class-wide): ${completedNodes}`);
      console.log(`Practice Attempts: ${practiceAttempts}`);
      console.log('---');
    }
  }

  console.log('\n--- Audit 7 - Weekly Trend Ownership Verification ---');
  const trends = await prisma.studentDashboardWeeklyTrend.findMany();
  console.log(`Total Trend Records: ${trends.length}`);
  
  const gokulTrends = gokul ? trends.filter(t => t.student_id === gokul.id) : [];
  const hariTrends = hari ? trends.filter(t => t.student_id === hari.id) : [];
  
  console.log(`Records linked to Gokul Sharma: ${gokulTrends.length}`);
  console.log(`Records linked to Hari Reddy: ${hariTrends.length}`);
  
  if (trends.length > 0) {
    const randomTrend = trends.find(t => t.student_id !== gokul?.id && t.student_id !== hari?.id) || trends[0];
    console.log(`Sample Trend Record belongs to student_id: ${randomTrend.student_id}`);
  }
}

run().catch(console.error).finally(() => process.exit(0));
