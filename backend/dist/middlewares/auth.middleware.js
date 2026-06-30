"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const academic_context_resolver_1 = require("../utils/academic-context.resolver");
const authorization_service_1 = require("../services/authorization.service");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'supersecret_jwt_key_for_dev_only');
        const dbUser = await prisma_1.default.user.findUnique({
            where: { id: decoded.user_id },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: { permission: true }
                        }
                    }
                }
            }
        });
        if (!dbUser) {
            return res.status(401).json({ message: 'Unauthorized: User account no longer exists.' });
        }
        const freshPermissions = dbUser.role?.permissions?.map((rp) => `${rp.permission.module}:${rp.permission.action}`) || [];
        // Inject identity fallbacks for system roles that might lack explicit DB mapping
        const roleName = dbUser.role?.name || '';
        if (roleName === 'SYSTEM_ADMIN') {
            freshPermissions.push('IDENTITY:IS_SYSTEM_ADMIN');
        }
        if (roleName === 'SUPER_ADMIN') {
            freshPermissions.push('IDENTITY:IS_SUPER_ADMIN');
            freshPermissions.push('IDENTITY:IS_MANAGEMENT');
        }
        if (roleName === 'MANAGEMENT') {
            freshPermissions.push('IDENTITY:IS_MANAGEMENT');
        }
        if (roleName === 'Student' || roleName === 'STUDENT') {
            if (!freshPermissions.includes('IDENTITY:IS_STUDENT'))
                freshPermissions.push('IDENTITY:IS_STUDENT');
            if (!freshPermissions.includes('STUDENT_DASHBOARD_ACCESS:READ'))
                freshPermissions.push('STUDENT_DASHBOARD_ACCESS:READ');
        }
        if (roleName === 'Teacher' || roleName === 'TEACHER') {
            if (!freshPermissions.includes('IDENTITY:IS_TEACHER'))
                freshPermissions.push('IDENTITY:IS_TEACHER');
            if (!freshPermissions.includes('TEACHER_DASHBOARD_ACCESS:READ'))
                freshPermissions.push('TEACHER_DASHBOARD_ACCESS:READ');
        }
        console.log('[AuthMiddleware] User:', dbUser.id, 'Role:', roleName);
        console.log('[AuthMiddleware] Permissions:', freshPermissions);
        req.user = {
            user_id: dbUser.id,
            name: dbUser.name,
            role: dbUser.role?.name || '',
            organization_id: dbUser.organization_id,
            permissions: freshPermissions
        };
        // Strict tenant isolation security check: Ensure the token's organization matches the context
        const contextOrgId = req.organization_id;
        if (contextOrgId && req.user.organization_id !== contextOrgId) {
            return res.status(403).json({ message: 'Forbidden: Cross-tenant access denied' });
        }
        // If tenant middleware was not run but we are authed, attach org_id from token
        if (!req.organization_id && req.user.organization_id) {
            req.organization_id = req.user.organization_id;
        }
        // Attempt to resolve the active academic year context globally
        try {
            req.academic_year_id = await academic_context_resolver_1.AcademicContextResolver.resolveAcademicYearId(req);
        }
        catch (err) {
            console.error('[AuthMiddleware] Error resolving academic year context', err);
        }
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};
exports.authMiddleware = authMiddleware;
const requirePermission = (module, action) => {
    return (req, res, next) => {
        // Note: SYSTEM_ADMIN no longer bypasses globally. Permissions must be explicitly mapped in the database.
        const userPermissions = req.user?.permissions || [];
        if (authorization_service_1.AuthorizationService.hasPermission(userPermissions, module, action)) {
            return next();
        }
        return res.status(403).json({ message: `Forbidden: Requires ${module}:${action}` });
    };
};
exports.requirePermission = requirePermission;
