"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSeatAvailability = checkSeatAvailability;
const prisma_1 = __importDefault(require("../prisma"));
async function checkSeatAvailability(organizationId, countToAdd = 1) {
    try {
        // Get organization limit (fallback to Organization table if License table is missing)
        const org = await prisma_1.default.organization.findUnique({
            where: { id: organizationId },
            include: { license: true }
        });
        if (!org) {
            return { allowed: false, message: 'Organization not found', usagePercent: 0, limit: 0, current: 0 };
        }
        const limit = org.license?.licensed_seats || org.login_limit || 100;
        // Count active users
        const currentActive = await prisma_1.default.user.count({
            where: {
                organization_id: organizationId,
                is_active: true
            }
        });
        const totalProposed = currentActive + countToAdd;
        const usagePercent = Math.round((currentActive / limit) * 100);
        if (totalProposed > limit) {
            return {
                allowed: false,
                message: `LICENSE_LIMIT_REACHED: This organization is licensed for ${limit} seats. Currently using ${currentActive}. Cannot add ${countToAdd} more.`,
                usagePercent,
                limit,
                current: currentActive
            };
        }
        return {
            allowed: true,
            message: 'Seats available',
            usagePercent,
            limit,
            current: currentActive
        };
    }
    catch (error) {
        console.error('[LICENSE CHECK ERROR]', error);
        return { allowed: true, message: 'Error checking license, allowing by default', usagePercent: 0, limit: 0, current: 0 };
    }
}
