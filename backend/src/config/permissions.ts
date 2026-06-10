/**
 * CENTRAL PERMISSION REGISTRY
 * 
 * Source of truth for all modules and actions in the platform.
 * Follows the pattern: MODULE_NAME : [ ACTIONS ]
 */

export const PERMISSION_REGISTRY = {
  // --- PLATFORM DOMAIN ---
  ORGANIZATION: ['LIST', 'PROVISION', 'LICENSE_MANAGE'],
  PLATFORM_ANALYTICS: ['VIEW'],

  // --- TENANT DOMAIN ---
  USERS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'IMPORT', 'EXPORT'],
  ROLES_AND_PERMISSIONS: ['VIEW', 'MANAGE'],
  MASTER_CONFIGURATION: ['VIEW', 'EDIT', 'MANAGE_CONFIG', 'MANAGE_SMTP'],
  ACADEMIC_STRUCTURE: ['READ', 'CREATE', 'EDIT', 'DELETE', 'IMPORT', 'EXPORT'],
  UNITS_LIST: ['MANAGE_SYLLABUS', 'IMPORT', 'EXPORT'],
  TEACHER_ASSIGNMENT: ['VIEW', 'CREATE', 'DELETE'],
  STUDENT_ENROLLMENT: ['READ', 'IMPORT', 'EXPORT'],
  QUESTION_BANK: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'IMPORT'],
  COMPLETION_TRACKING: ['VIEW', 'MANAGE'],
  MCQ: ['VIEW', 'ATTEMPT'],
  SKILLS_VERIFY_ASSIGNMENT: ['VIEW', 'ASSIGN', 'DELETE'],
  SKILLS_VERIFICATION: ['VIEW'],
  IDENTITY: ['IS_TEACHER', 'IS_STUDENT', 'IS_PARENT', 'IS_MANAGEMENT', 'IS_SYSTEM_ADMIN', 'IS_SUPER_ADMIN', 'IS_SKILL_VERIFIER'],
};

export const PERMISSION_DOMAINS: Record<string, 'PLATFORM' | 'TENANT'> = {
  ORGANIZATION: 'PLATFORM',
  PLATFORM_ANALYTICS: 'PLATFORM',
  USERS: 'TENANT',
  ROLES_AND_PERMISSIONS: 'TENANT',
  MASTER_CONFIGURATION: 'TENANT',
  ACADEMIC_STRUCTURE: 'TENANT',
  UNITS_LIST: 'TENANT',
  TEACHER_ASSIGNMENT: 'TENANT',
  STUDENT_ENROLLMENT: 'TENANT',
  QUESTION_BANK: 'TENANT',
  COMPLETION_TRACKING: 'TENANT',
  MCQ: 'TENANT',
  IDENTITY: 'TENANT',
  SKILLS_VERIFY_ASSIGNMENT: 'TENANT',
  SKILLS_VERIFICATION: 'TENANT'
};

export type PermissionModule = keyof typeof PERMISSION_REGISTRY;

/**
 * Transforms the registry into a flat array of { module, action } for database seeding.
 */
export const getFlatPermissions = () => {
  const flat: { module: string; action: string; description: string }[] = [];

  for (const [module, actions] of Object.entries(PERMISSION_REGISTRY)) {
    actions.forEach(action => {
      flat.push({
        module,
        action,
        description: `Allows ${action.toLowerCase().replace('_', ' ')} in ${module.toLowerCase()} module`
      });
    });
  }

  return flat;
};
