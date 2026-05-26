"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
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
        req.user = {
            user_id: dbUser.id,
            name: dbUser.name,
            role: dbUser.role?.name || '',
            organization_id: dbUser.organization_id,
            permissions: freshPermissions
        };
        // Strict tenant isolation security check: Ensure the token's organization matches the context
        const contextOrgId = req.organization_id || req.headers['x-organization-id'];
        if (contextOrgId && req.user.organization_id !== contextOrgId) {
            return res.status(403).json({ message: 'Forbidden: Cross-tenant access denied' });
        }
        // If tenant middleware was not run but we are authed, attach org_id from token
        if (!req.organization_id && req.user.organization_id) {
            req.organization_id = req.user.organization_id;
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
        // SYSTEM_ADMIN bypasses globally; other roles are permission-driven.
        if (req.user?.role === 'SYSTEM_ADMIN') {
            return next();
        }
        const userPermissions = req.user?.permissions || [];
        const requiredPermission = `${module}:${action}`;
        if (userPermissions.includes(requiredPermission)) {
            return next();
        }
        // Dynamic mapping for backward-compatibility with old route permission checks
        let mappedModule = module;
        let mappedAction = action;
        if (module === 'ORGANIZATION') {
            mappedModule = 'MASTER_CONFIGURATION';
        }
        else if (module === 'ROLES') {
            mappedModule = 'ROLES_AND_PERMISSIONS';
        }
        else if (module === 'COMPLETION') {
            mappedModule = 'COMPLETION_TRACKING';
        }
        else if (module === 'ACADEMIC' && action === 'MANAGE_SYLLABUS') {
            mappedModule = 'UNITS_LIST';
        }
        else if (module === 'QUESTION_BANK' && action === 'READ') {
            mappedModule = 'QUESTION_BANK';
            mappedAction = 'VIEW';
        }
        const mappedPermission = `${mappedModule}:${mappedAction}`;
        if (userPermissions.includes(mappedPermission)) {
            return next();
        }
        // Allow academic structure create/edit/delete for syllabus managers
        if (module === 'ACADEMIC_STRUCTURE' && (action === 'CREATE' || action === 'EDIT' || action === 'DELETE')) {
            if (userPermissions.includes('UNITS_LIST:MANAGE_SYLLABUS') ||
                userPermissions.includes('ACADEMIC:MANAGE_SYLLABUS')) {
                return next();
            }
        }
        // Allow read-only access to academic structure for users who have question bank or completion tracking view permissions
        if (module === 'ACADEMIC_STRUCTURE' && action === 'READ') {
            if (userPermissions.includes('QUESTION_BANK:VIEW') ||
                userPermissions.includes('COMPLETION_TRACKING:VIEW') ||
                userPermissions.includes('UNITS_LIST:MANAGE_SYLLABUS')) {
                return next();
            }
        }
        // Allow PRACTICE:MANAGE legacy action for completion tracking permission holders
        if (module === 'PRACTICE' && action === 'MANAGE') {
            if (userPermissions.includes('COMPLETION_TRACKING:VIEW') ||
                userPermissions.includes('COMPLETION_TRACKING:MANAGE')) {
                return next();
            }
        }
        return res.status(403).json({ message: `Forbidden: Requires ${requiredPermission}` });
    };
};
exports.requirePermission = requirePermission;
