"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.authorizeRoles = exports.authMiddleware = void 0;
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
            role: dbUser.role?.name || '',
            organization_id: dbUser.organization_id,
            permissions: freshPermissions
        };
        // Strict tenant isolation security check: Ensure the token's organization matches the context
        if (req.organization_id && req.user.organization_id !== req.organization_id) {
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
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
const requirePermission = (module, action) => {
    return (req, res, next) => {
        const userPermissions = req.user?.permissions || [];
        const requiredPermission = `${module}:${action}`;
        // SYSTEM_ADMIN bypasses globally, SUPER_ADMIN bypasses within their tenant (tenant isolation applied upstream)
        if (req.user?.role === 'SYSTEM_ADMIN' || req.user?.role === 'SUPER_ADMIN' || userPermissions.includes(requiredPermission)) {
            return next();
        }
        return res.status(403).json({ message: `Forbidden: Requires ${requiredPermission}` });
    };
};
exports.requirePermission = requirePermission;
