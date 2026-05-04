"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantMiddleware = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const tenantMiddleware = async (req, res, next) => {
    try {
        const orgId = req.headers['x-organization-id'];
        const subdomain = req.headers['x-subdomain'];
        if (orgId) {
            const org = await prisma_1.default.organization.findUnique({ where: { id: orgId } });
            if (!org) {
                return res.status(404).json({ message: 'Organization not found' });
            }
            req.organization_id = org.id;
            return next();
        }
        if (subdomain) {
            const org = await prisma_1.default.organization.findUnique({ where: { subdomain } });
            if (!org) {
                return res.status(404).json({ message: 'Organization not found' });
            }
            req.organization_id = org.id;
            return next();
        }
        return res.status(400).json({ message: 'Organization identification missing (header x-organization-id or x-subdomain required)' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error in tenant middleware' });
    }
};
exports.tenantMiddleware = tenantMiddleware;
