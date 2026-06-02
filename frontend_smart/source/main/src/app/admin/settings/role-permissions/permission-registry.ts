export interface IRegistryPermission {
  module: string;
  permissions: string[];
}

export const CENTRAL_PERMISSION_REGISTRY: IRegistryPermission[] = [
  {
    module: 'USERS',
    permissions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'BULK_IMPORT']
  },
  {
    module: 'ROLES_AND_PERMISSIONS',
    permissions: ['VIEW', 'MANAGE']
  },
  {
    module: 'MASTER_CONFIGURATION',
    permissions: ['VIEW', 'EDIT', 'MANAGE_CONFIG', 'MANAGE_SMTP']
  },
  {
    module: 'ACADEMIC_STRUCTURE',
    permissions: ['READ', 'CREATE', 'EDIT', 'DELETE']
  },
  {
    module: 'UNITS_LIST',
    permissions: ['MANAGE_SYLLABUS']
  },
  {
    module: 'TEACHER_ASSIGNMENT',
    permissions: ['VIEW', 'CREATE', 'DELETE']
  },
  {
    module: 'STUDENT_ENROLLMENT',
    permissions: ['READ']
  },
  {
    module: 'SETTINGS',
    permissions: ['VIEW', 'EDIT', 'MANAGE']
  },
  {
    module: 'QUESTION_BANK',
    permissions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'IMPORT']
  },
  {
    module: 'COMPLETION_TRACKING',
    permissions: ['VIEW', 'MANAGE']
  },
  {
    module: 'MCQ',
    permissions: ['VIEW', 'ATTEMPT']
  },
  {
    module: 'SKILLS_VERIFY_ASSIGNMENT',
    permissions: ['VIEW', 'ASSIGN', 'DELETE']
  },
  {
    module: 'IDENTITY',
    permissions: ['IS_TEACHER', 'IS_STUDENT', 'IS_PARENT', 'IS_MANAGEMENT']
  },
];
