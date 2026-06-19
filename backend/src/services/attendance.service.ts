import prisma from '../prisma';
import { AttendanceStatus } from '@prisma/client';

export interface MarkAttendancePayload {
  organization_id: string;
  academic_year_id: string;
  grade_id: string;
  section_id?: string;
  phase_id: string;
  attendance_date: string; // ISO string
  marked_by: string;
  records: Array<{
    student_id: string;
    status: AttendanceStatus;
  }>;
}

export class AttendancePhaseService {
  static async getPhases(organizationId: string) {
    return prisma.attendancePhase.findMany({
      where: { organization_id: organizationId, is_active: true },
      orderBy: { display_order: 'asc' }
    });
  }

  static async createPhase(organizationId: string, payload: { phase_name: string; start_period: number; end_period: number; display_order?: number }) {
    return prisma.attendancePhase.create({
      data: {
        organization_id: organizationId,
        phase_name: payload.phase_name,
        start_period: payload.start_period,
        end_period: payload.end_period,
        display_order: payload.display_order || 0
      }
    });
  }
}

export class StudentAttendanceService {
  static async markAttendance(payload: MarkAttendancePayload) {
    const { organization_id, academic_year_id, grade_id, section_id, phase_id, marked_by, records } = payload;
    const attendance_date = new Date(payload.attendance_date);
    attendance_date.setUTCHours(0, 0, 0, 0);

    let successCount = 0;
    const txOperations: any[] = [];

    for (const record of records) {
      txOperations.push(
        prisma.studentAttendance.upsert({
          where: {
            organization_id_student_id_attendance_date_phase_id: {
              organization_id,
              student_id: record.student_id,
              attendance_date,
              phase_id
            }
          },
          update: {
            status: record.status,
            marked_by,
            grade_id,
            section_id: section_id || null,
            academic_year_id
          },
          create: {
            organization_id,
            student_id: record.student_id,
            attendance_date,
            phase_id,
            status: record.status,
            marked_by,
            grade_id,
            section_id: section_id || null,
            academic_year_id
          }
        })
      );
      successCount++;
    }

    await prisma.$transaction(txOperations);
    return { success: successCount };
  }

  static async getDailyAttendance(organizationId: string, gradeId: string, sectionId: string | undefined, phaseId: string, dateStr: string) {
    const attendance_date = new Date(dateStr);
    attendance_date.setUTCHours(0, 0, 0, 0);

    return prisma.studentAttendance.findMany({
      where: {
        organization_id: organizationId,
        grade_id: gradeId,
        ...(sectionId ? { section_id: sectionId } : {}),
        phase_id: phaseId,
        attendance_date
      },
      include: {
        student: { select: { id: true, name: true, roll_number: true } }
      }
    });
  }

  static async getStudentAttendance(organizationId: string, studentId: string, academicYearId: string) {
    return prisma.studentAttendance.findMany({
      where: {
        organization_id: organizationId,
        student_id: studentId,
        academic_year_id: academicYearId
      },
      orderBy: { attendance_date: 'desc' },
      include: { phase: true }
    });
  }

  static async getRangeAttendance(organizationId: string, gradeId: string, sectionId: string | undefined, startDateStr: string, endDateStr: string) {
    const startDate = new Date(startDateStr);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(endDateStr);
    endDate.setUTCHours(23, 59, 59, 999);

    return prisma.studentAttendance.findMany({
      where: {
        organization_id: organizationId,
        grade_id: gradeId,
        ...(sectionId ? { section_id: sectionId } : {}),
        attendance_date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        student: { 
          select: { 
            id: true, 
            name: true, 
            roll_number: true,
            user_profile: { select: { profile_image: true } }
          } 
        },
        phase: { select: { id: true, phase_name: true } }
      },
      orderBy: {
        attendance_date: 'asc'
      }
    });
  }

  static async getSummaryPercentage(organizationId: string, academicYearId: string, gradeId: string, sectionId?: string) {
    // Determine the total conducted phases by finding distinct (date, phase) pairs for the class
    const conductedPhasesQuery = await prisma.studentAttendance.groupBy({
      by: ['attendance_date', 'phase_id'],
      where: {
        organization_id: organizationId,
        academic_year_id: academicYearId,
        grade_id: gradeId,
        ...(sectionId ? { section_id: sectionId } : {})
      }
    });

    const totalConductedPhases = conductedPhasesQuery.length;

    // Get attendance records for students in this class
    const attendanceRecords = await prisma.studentAttendance.findMany({
      where: {
        organization_id: organizationId,
        academic_year_id: academicYearId,
        grade_id: gradeId,
        ...(sectionId ? { section_id: sectionId } : {})
      },
      select: { student_id: true, status: true }
    });

    const studentStats: Record<string, { present: number; absent: number; late: number; total_marked: number }> = {};

    attendanceRecords.forEach((record: any) => {
      if (!studentStats[record.student_id]) {
        studentStats[record.student_id] = { present: 0, absent: 0, late: 0, total_marked: 0 };
      }
      studentStats[record.student_id].total_marked++;
      if (record.status === 'PRESENT') studentStats[record.student_id].present++;
      else if (record.status === 'ABSENT') studentStats[record.student_id].absent++;
      else if (record.status === 'LATE') studentStats[record.student_id].late++;
    });

    const results = Object.keys(studentStats).map(studentId => {
      const stats = studentStats[studentId];
      // Formula: (Present + Late) / Total Conducted Phases * 100
      // Note: If totalConductedPhases is 0, return 100% or 0%.
      let percentage = 0;
      if (totalConductedPhases > 0) {
        percentage = ((stats.present + stats.late) / totalConductedPhases) * 100;
      }
      return {
        student_id: studentId,
        percentage: Math.round(percentage * 100) / 100, // 2 decimal places
        ...stats,
        total_conducted: totalConductedPhases
      };
    });

    return results;
  }
}
