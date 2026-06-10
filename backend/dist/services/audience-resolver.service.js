"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudienceResolver = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const assignment_visibility_resolver_1 = require("../utils/assignment-visibility.resolver");
class AudienceResolver {
    /**
     * Resolves audience for a given academic context and required permission.
     * This is entirely dynamic and avoids hardcoded roles like 'STUDENT'.
     */
    static async resolveByPermissionAndContext(payload, requiredModule, requiredAction) {
        const { organization_id, context } = payload;
        // 1. Find all active users in this org who possess the required permission
        const usersWithPermission = await prisma_1.default.user.findMany({
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
            select: {
                id: true,
                role: {
                    select: {
                        is_system: true,
                        name: true,
                        permissions: {
                            select: {
                                permission: { select: { module: true, action: true } }
                            }
                        }
                    }
                }
            }
        });
        const finalUserIds = new Set();
        const contextBoundUserIds = new Set();
        // Separate Global Audience (SUPER_ADMIN or MANAGE permission) from Context-Bound (VIEW only)
        for (const u of usersWithPermission) {
            const isGlobal = String(u.role.name) === 'SUPER_ADMIN' || u.role.permissions.some((p) => (p.permission.module === 'IDENTITY' && p.permission.action === 'IS_SUPER_ADMIN') ||
                (p.permission.module === requiredModule && p.permission.action === 'MANAGE') ||
                (p.permission.module === requiredModule && p.permission.action === 'VIEW_ALL'));
            if (isGlobal) {
                finalUserIds.add(u.id);
            }
            else {
                contextBoundUserIds.add(u.id);
            }
        }
        if (contextBoundUserIds.size === 0)
            return Array.from(finalUserIds);
        // Filter context-bound candidates by actual Academic Context enrollment
        // 1. Check Student Enrollments
        const studentWhere = {
            organization_id,
            academic_year_id: context.academic_year_id,
            grade_id: context.grade_id,
            student_id: { in: Array.from(contextBoundUserIds) },
            status: 'ACTIVE'
        };
        if (context.section_id)
            studentWhere.section_id = context.section_id;
        // Fix: If context has subject_id, only include students mapped to a group containing that subject
        if (context.subject_id) {
            studentWhere.student = {
                student_group_mappings: {
                    some: {
                        academic_year_id: context.academic_year_id,
                        group: {
                            subjects: {
                                some: { subject_id: context.subject_id }
                            }
                        }
                    }
                }
            };
        }
        const enrollments = await prisma_1.default.studentEnrollment.findMany({
            where: studentWhere,
            select: { student_id: true }
        });
        enrollments.forEach((e) => finalUserIds.add(e.student_id));
        // 2. Check Teacher Assignments using the AssignmentVisibilityResolver
        const authorizedTeachers = await assignment_visibility_resolver_1.AssignmentVisibilityResolver.getTeachersForContext(organization_id, context.academic_year_id, context.grade_id, context.section_id, context.subject_id);
        // Intersect authorized teachers with the context-bound candidates
        authorizedTeachers.forEach(tId => {
            if (contextBoundUserIds.has(tId)) {
                finalUserIds.add(tId);
            }
        });
        return Array.from(finalUserIds);
    }
}
exports.AudienceResolver = AudienceResolver;
