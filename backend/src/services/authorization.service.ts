export class AuthorizationService {
  /**
   * Evaluates if a user has a required permission.
   * Includes temporary 24-hour backward compatibility for READ/EDIT -> VIEW/UPDATE.
   */
  static hasPermission(userPermissions: string[], module: string, action: string): boolean {
    if (!userPermissions || userPermissions.length === 0) return false;

    // 1. Exact Match
    const requiredPermission = `${module}:${action}`;
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    // 2. 24-Hour Backward Compatibility Mapping
    // Map incoming deprecated requests (READ) to their new equivalents (VIEW) to see if user has the new permission
    let mappedModule = module;
    let mappedAction = action;

    if (action === 'READ') mappedAction = 'VIEW';
    if (action === 'EDIT') mappedAction = 'UPDATE';

    if (module === 'ORGANIZATION') mappedModule = 'MASTER_CONFIGURATION';
    if (module === 'ROLES') mappedModule = 'ROLES_AND_PERMISSIONS';
    if (module === 'COMPLETION') mappedModule = 'COMPLETION_TRACKING';

    const mappedPermission = `${mappedModule}:${mappedAction}`;
    if (userPermissions.includes(mappedPermission)) {
      return true;
    }

    // Map the OTHER way around: If the system asks for the NEW permission (VIEW), but the user's JWT
    // still has the OLD permission (READ) because they haven't logged out.
    let legacyAction = action;
    if (action === 'VIEW') legacyAction = 'READ';
    if (action === 'UPDATE') legacyAction = 'EDIT';
    const legacyPermission = `${module}:${legacyAction}`;
    if (userPermissions.includes(legacyPermission)) {
      return true;
    }

    // 3. Fallback Cross-Module Allowances
    if (module === 'ACADEMIC_STRUCTURE' && ['CREATE', 'UPDATE', 'DELETE', 'EDIT'].includes(action)) {
      if (userPermissions.includes('UNITS_LIST:MANAGE_SYLLABUS') || userPermissions.includes('ACADEMIC:MANAGE_SYLLABUS')) {
        return true;
      }
    }

    if (module === 'ACADEMIC_STRUCTURE' && ['VIEW', 'READ'].includes(action)) {
      if (
        userPermissions.includes('QUESTION_BANK:VIEW') ||
        userPermissions.includes('QUESTION_BANK:READ') ||
        userPermissions.includes('COMPLETION_TRACKING:VIEW') ||
        userPermissions.includes('COMPLETION_TRACKING:READ') ||
        userPermissions.includes('UNITS_LIST:MANAGE_SYLLABUS')
      ) {
        return true;
      }
    }

    if (module === 'PRACTICE' && action === 'MANAGE') {
      if (userPermissions.includes('COMPLETION_TRACKING:VIEW') || userPermissions.includes('COMPLETION_TRACKING:MANAGE')) {
        return true;
      }
    }

    if (module === 'STUDENT_EXAM_RESULT') {
      if (userPermissions.includes('EXAMINATION:VIEW') || userPermissions.includes('EXAMINATION:MANAGE') || userPermissions.includes('IDENTITY:IS_SUPER_ADMIN')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Helper to check if a user possesses a specific Identity marker permission
   */
  static hasIdentity(userPermissions: string[], identity: 'IS_STUDENT' | 'IS_TEACHER' | 'IS_MANAGEMENT' | 'IS_SYSTEM_ADMIN' | 'IS_SUPER_ADMIN'): boolean {
    return userPermissions.includes(`IDENTITY:${identity}`);
  }
}
