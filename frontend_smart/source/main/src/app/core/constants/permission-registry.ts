// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Update permissions.json in the project root and run 'node scripts/generate-permissions.js'

export const PERMISSIONS_REGISTRY = {
  "IDENTITY": {
    "description": "Identity markers for resolving audience and contexts",
    "actions": [
      "IS_MANAGEMENT",
      "IS_TEACHER",
      "IS_STUDENT",
      "IS_SYSTEM_ADMIN"
    ]
  },
  "USERS": {
    "description": "User management module",
    "actions": [
      "VIEW",
      "CREATE",
      "UPDATE",
      "DELETE"
    ]
  },
  "ROLES_AND_PERMISSIONS": {
    "description": "Roles and Permissions management",
    "actions": [
      "VIEW",
      "MANAGE"
    ]
  },
  "MASTER_CONFIGURATION": {
    "description": "Master settings (academic years, general config)",
    "actions": [
      "VIEW",
      "MANAGE_CONFIG"
    ]
  },
  "ACADEMIC_STRUCTURE": {
    "description": "Grades, Sections, and Subjects",
    "actions": [
      "VIEW",
      "CREATE",
      "UPDATE",
      "DELETE",
      "IMPORT",
      "EXPORT"
    ]
  },
  "UNITS_LIST": {
    "description": "Units, Topics, and Subtopics",
    "actions": [
      "VIEW",
      "MANAGE_SYLLABUS",
      "IMPORT",
      "EXPORT"
    ]
  },
  "TEACHER_ASSIGNMENT": {
    "description": "Teacher Subject and Class assignments",
    "actions": [
      "VIEW",
      "CREATE",
      "EDIT",
      "DELETE"
    ]
  },
  "STUDENT_ENROLLMENT": {
    "description": "Student mapping and enrollments",
    "actions": [
      "VIEW",
      "ENROLL",
      "TRANSFER"
    ]
  },
  "QUESTION_BANK": {
    "description": "Question bank module",
    "actions": [
      "VIEW",
      "CREATE",
      "UPDATE",
      "DELETE"
    ]
  },
  "COMPLETION_TRACKING": {
    "description": "Syllabus completion tracking module",
    "actions": [
      "VIEW",
      "MANAGE"
    ]
  },
  "MCQ": {
    "description": "Multiple Choice Questions practice module",
    "actions": [
      "VIEW",
      "ATTEMPT"
    ]
  },
  "EXAMINATION": {
    "description": "Examination and marks module",
    "actions": [
      "VIEW",
      "MANAGE"
    ]
  }
} as const;

export type PermissionModule = keyof typeof PERMISSIONS_REGISTRY;
export type PermissionAction<M extends PermissionModule> = (typeof PERMISSIONS_REGISTRY)[M]['actions'][number];
