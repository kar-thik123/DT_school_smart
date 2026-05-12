"use strict";
/**
 * CENTRAL PERMISSION REGISTRY
 *
 * Source of truth for all modules and actions in the platform.
 * Follows the pattern: MODULE_NAME : [ ACTIONS ]
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFlatPermissions = exports.PERMISSION_REGISTRY = void 0;
exports.PERMISSION_REGISTRY = {
    ORGANIZATION: ['VIEW', 'EDIT', 'MANAGE_CONFIG', 'MANAGE_SMTP'],
    USERS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'BULK_IMPORT'],
    ACADEMIC: ['MANAGE_GRADES', 'MANAGE_SECTIONS', 'MANAGE_SUBJECTS', 'MANAGE_SYLLABUS'],
    TEACHER_ASSIGNMENT: ['VIEW', 'CREATE', 'DELETE'],
    QUESTION_BANK: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'IMPORT'],
    PRACTICE: ['VIEW_OWN', 'VIEW_ALL', 'ASSIGN'],
    ANALYTICS: ['VIEW_OWN', 'VIEW_SCHOOL', 'VIEW_PLATFORM'],
    ROLES: ['VIEW', 'MANAGE'],
    ACADEMIC_STRUCTURE: ['READ', 'CREATE', 'EDIT', 'DELETE'],
    IDENTITY: ['IS_TEACHER', 'IS_STUDENT', 'IS_PARENT', 'IS_MANAGEMENT']
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
