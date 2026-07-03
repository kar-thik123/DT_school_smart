import prisma from '../prisma';
import { AttendanceStatus } from '@prisma/client';

export interface MarkStaffAttendancePayload {
  organization_id: string;
  academic_year_id: string;
  phase_id: string;
  attendance_date: string; // ISO string
  marked_by: string;
  records: Array<{
    staff_id: string;
    status: AttendanceStatus;
  }>;
}

export class StaffAttendanceService {
  static async markAttendance(payload: MarkStaffAttendancePayload) {
    const { organization_id, academic_year_id, phase_id, marked_by, records } = payload;
    const attendance_date = new Date(payload.attendance_date);
    attendance_date.setUTCHours(0, 0, 0, 0);

    let successCount = 0;
    const txOperations: any[] = [];

    for (const record of records) {
      txOperations.push(
        (prisma as any).staffAttendance.upsert({
          where: {
            organization_id_staff_id_attendance_date_phase_id: {
              organization_id,
              staff_id: record.staff_id,
              attendance_date,
              phase_id
            }
          },
          update: {
            status: record.status,
            marked_by
          },
          create: {
            organization_id,
            academic_year_id,
            staff_id: record.staff_id,
            phase_id,
            attendance_date,
            status: record.status,
            marked_by
          }
        })
      );
      successCount++;
    }

    if (txOperations.length > 0) {
      await prisma.$transaction(txOperations);
    }

    return { updated: successCount };
  }

  static async getDailyAttendance(organization_id: string, phase_id: string, date: string) {
    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    return (prisma as any).staffAttendance.findMany({
      where: {
        organization_id,
        phase_id,
        attendance_date: targetDate
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            user_profile: {
              select: {
                profile_image: true,
                phone: true
              }
            }
          }
        }
      }
    });
  }

  static async getRangeAttendance(organization_id: string, startDateStr: string, endDateStr: string) {
    const startDate = new Date(startDateStr);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(endDateStr);
    endDate.setUTCHours(23, 59, 59, 999);

    return (prisma as any).staffAttendance.findMany({
      where: {
        organization_id,
        attendance_date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            user_profile: {
              select: {
                profile_image: true,
                phone: true
              }
            }
          }
        }
      }
    });
  }
}
