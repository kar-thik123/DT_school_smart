"use strict";
/**
 * CENTRAL PERMISSION REGISTRY
 *
 * Source of truth for all modules and actions in the platform.
 * Follows the pattern: MODULE_NAME : [ ACTIONS ]
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFlatPermissions = exports.PERMISSION_DOMAINS = exports.PERMISSION_REGISTRY = void 0;
exports.PERMISSION_REGISTRY = {
    // --- PLATFORM DOMAIN ---
    ORGANIZATION: ['LIST', 'PROVISION', 'LICENSE_MANAGE'],
    PLATFORM_ANALYTICS: ['VIEW'],
    // --- TENANT DOMAIN ---
    USERS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'BULK_IMPORT'],
    ROLES_AND_PERMISSIONS: ['VIEW', 'MANAGE'],
    MASTER_CONFIGURATION: ['VIEW', 'EDIT', 'MANAGE_CONFIG', 'MANAGE_SMTP'],
    ACADEMIC_STRUCTURE: ['READ', 'CREATE', 'EDIT', 'DELETE'],
    UNITS_LIST: ['MANAGE_SYLLABUS'],
    TEACHER_ASSIGNMENT: ['VIEW', 'CREATE', 'DELETE'],
    STUDENT_ENROLLMENT: ['READ'],
    QUESTION_BANK: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'IMPORT'],
    COMPLETION_TRACKING: ['VIEW', 'MANAGE'],
    IDENTITY: ['IS_TEACHER', 'IS_STUDENT', 'IS_PARENT', 'IS_MANAGEMENT', 'IS_SYSTEM_ADMIN', 'IS_SUPER_ADMIN']
};
exports.PERMISSION_DOMAINS = {
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
    IDENTITY: 'TENANT'
};
/**
 * Transforms the registry into a flat array of { module, action } for database seeding.
 */
const getFlatPermissions = () => {
    const flat = [];
    for (const [module, actions] of Object.entries(exports.PERMISSION_REGISTRY)) {
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
exports.getFlatPermissions = getFlatPermissions;
