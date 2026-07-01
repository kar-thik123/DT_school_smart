import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const org_id = '1c9ad3bd-1c01-481e-8276-16ed612f52bc'; // St Michael higher secondary school
  const yearId = '182480cb-b0f9-4eb8-af1d-dc19cea211a4'; // 2026-2027 academic year

  console.log('--- EMULATING /analytics/management/overview ---');

  // 1. Overview Stats (Permission-based RBAC, excluding SUPER_ADMIN)
  const studentRoles = await prisma.role.findMany({
    where: {
      organization_id: org_id,
      permissions: {
        some: {
          permission: { module: 'IDENTITY', action: 'IS_STUDENT' }
        }
      },
      NOT: {
        permissions: {
          some: {
            permission: { module: 'IDENTITY', action: 'IS_SUPER_ADMIN' }
          }
        }
      }
    },
    select: { id: true }
  });
  const studentRoleIds = studentRoles.map((r: any) => r.id);

  const teacherRoles = await prisma.role.findMany({
    where: {
      organization_id: org_id,
      permissions: {
        some: {
          permission: { module: 'IDENTITY', action: 'IS_TEACHER' }
        }
      },
      NOT: {
        permissions: {
          some: {
            permission: { module: 'IDENTITY', action: 'IS_SUPER_ADMIN' }
          }
        }
      }
    },
    select: { id: true }
  });
  const teacherRoleIds = teacherRoles.map((r: any) => r.id);

  if (studentRoleIds.length === 0 || teacherRoleIds.length === 0) {
    console.log('No student or teacher roles found');
    return;
  }

  // BULK LOAD: All practice attempts for this org in one query
  const allAttempts = await prisma.practiceAttempt.findMany({
    where: { organization_id: org_id, academic_year_id: yearId }
  });

  // Overall readiness (Aggregate math logic)
  let totalCorrect = 0;
  let totalQuestions = 0;
  allAttempts.forEach((a: any) => {
    totalCorrect += a.correct_answers;
    totalQuestions += a.total_questions;
  });
  const avgPreparedness = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // Total Students from StudentEnrollment
  const totalStudents = await prisma.studentEnrollment.count({
    where: {
      organization_id: org_id,
      academic_year_id: yearId,
      student: { is_active: true }
    }
  });

  // Total Teachers
  const totalTeachers = await prisma.user.count({
    where: {
      organization_id: org_id,
      role_id: { in: teacherRoleIds },
      is_active: true
    }
  });

  // Active Classes
  const activeClasses = await prisma.section.count({
    where: {
      organization_id: org_id,
      grade: { academic_year_id: yearId }
    }
  });

  // Overall Attendance
  const totalAttendance = await prisma.studentAttendance.count({
    where: { organization_id: org_id, academic_year_id: yearId }
  });

  const excusedAttendance = await prisma.studentAttendance.count({
    where: { organization_id: org_id, academic_year_id: yearId, status: 'EXCUSED' }
  });

  const presentAttendance = await prisma.studentAttendance.count({
    where: {
      organization_id: org_id,
      academic_year_id: yearId,
      status: { in: ['PRESENT', 'LATE'] }
    }
  });

  const attendanceDenominator = totalAttendance - excusedAttendance;
  const overallAttendancePercent = attendanceDenominator > 0
    ? Math.round((presentAttendance / attendanceDenominator) * 100)
    : 0;

  // Pre-index attempts by subject_id and student_id for O(1) lookups
  const attemptsBySubject = new Map<string, any[]>();
  const attemptsByStudent = new Map<string, any[]>();
  for (const attempt of allAttempts) {
    if (!attemptsBySubject.has(attempt.subject_id)) attemptsBySubject.set(attempt.subject_id, []);
    attemptsBySubject.get(attempt.subject_id)!.push(attempt);
    
    if (!attemptsByStudent.has(attempt.student_id)) attemptsByStudent.set(attempt.student_id, []);
    attemptsByStudent.get(attempt.student_id)!.push(attempt);
  }

  // 2. Teacher Performance
  const teachers = await prisma.user.findMany({
    where: { organization_id: org_id, role_id: { in: teacherRoleIds }, is_active: true },
    include: {
      teacher_assignments: {
        include: {
          subject: { select: { name: true } }
        }
      }
    }
  });

  const teacherPerformance = [];
  for (const t of teachers) {
    const subjectIds = (t.teacher_assignments || []).map((a: any) => a.subject_id).filter(Boolean) as string[];
    const tAttempts: any[] = [];
    for (const sid of subjectIds) {
      const subAttempts = attemptsBySubject.get(sid);
      if (subAttempts) tAttempts.push(...subAttempts);
    }

    let tPct = 0;
    tAttempts.forEach((a: any) => tPct += (a.correct_answers / Math.max(a.total_questions, 1)) * 100);
    const tAvg = tAttempts.length > 0 ? Math.round(tPct / tAttempts.length) : 0;

    teacherPerformance.push({
      name: t.name,
      subject: (t.teacher_assignments && t.teacher_assignments[0]?.subject?.name) || 'Multi-Subject',
      performance: tAvg,
      status: tAvg >= 70 ? 'GOOD' : (tAvg >= 40 ? 'AVERAGE' : 'POOR')
    });
  }

  // 3. High Risk Students
  const allStudents = await prisma.user.findMany({
    where: { organization_id: org_id, role_id: { in: studentRoleIds }, is_active: true },
    include: { section: { select: { name: true } } }
  });

  const riskStudents = [];
  for (const s of allStudents) {
    const sAttempts = attemptsByStudent.get(s.id) || [];
    if (sAttempts.length === 0) continue;

    let sPct = 0;
    sAttempts.forEach((a: any) => sPct += (a.correct_answers / Math.max(a.total_questions, 1)) * 100);
    const sAvg = Math.round(sPct / sAttempts.length);

    if (sAvg < 40) {
      riskStudents.push({
        name: s.name,
        section: s.section?.name || 'N/A',
        score: sAvg
      });
    }
  }

  const responseJson = {
    avg_preparedness: avgPreparedness,
    total_students: totalStudents,
    total_teachers: totalTeachers,
    active_classes: activeClasses,
    overall_attendance_percent: overallAttendancePercent,
    active_modules: allAttempts.length,
    critical_alerts: 0,
    teacher_performance: teacherPerformance.sort((a: any, b: any) => b.performance - a.performance),
    risk_students: riskStudents.sort((a: any, b: any) => a.score - b.score).slice(0, 10)
  };

  console.log('RESPONSE PAYLOAD:');
  console.log(JSON.stringify(responseJson, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
