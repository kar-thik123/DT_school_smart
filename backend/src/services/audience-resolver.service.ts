import prisma from '../prisma';
import { NotificationEventPayload } from './events.service';

export class AudienceResolver {
  
  /**
   * Resolves audience for a given academic context and required permission.
   * This is entirely dynamic and avoids hardcoded roles like 'STUDENT'.
   */
  static async resolveByPermissionAndContext(
    payload: NotificationEventPayload, 
    requiredModule: string,
    requiredAction: string
  ): Promise<string[]> {
    const { organization_id, context } = payload;
    
    // 1. Find all active users in this org who possess the required permission
    const usersWithPermission = await prisma.user.findMany({
      where: {
        organization_id,
        is_active: true,
        role: {
          permissions: {
            some: {
              permission: {
                module: requiredModule,
                action: requiredAction
              }
            }
          }
        }
      },
      select: { id: true, role: { select: { is_system: true, name: true } } }
    });

    // Extract user IDs, deliberately excluding SYSTEM_ADMIN and platform operators
    const candidateUserIds = usersWithPermission
      .filter(u => !u.role.is_system && u.role.name !== 'SYSTEM_ADMIN')
      .map(u => u.id);

    if (candidateUserIds.length === 0) return [];

    // 2. Filter candidates by actual Academic Context enrollment
    const finalUserIds = new Set<string>();

    // Check Student Enrollments
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        organization_id,
        academic_year_id: context.academic_year_id,
        grade_id: context.grade_id,
        ...(context.section_id ? { section_id: context.section_id } : {}),
        student_id: { in: candidateUserIds },
        status: 'ACTIVE'
      },
      select: { student_id: true }
    });
    
    enrollments.forEach(e => finalUserIds.add(e.student_id));

    // Optional: Check Teacher Assignments if teachers should also receive it
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: {
        organization_id,
        academic_year_id: context.academic_year_id,
        grade_id: context.grade_id,
        ...(context.section_id ? { section_id: context.section_id } : {}),
        teacher_id: { in: candidateUserIds }
      },
      select: { teacher_id: true }
    });

    teacherAssignments.forEach(t => finalUserIds.add(t.teacher_id));

    return Array.from(finalUserIds);
  }
}
