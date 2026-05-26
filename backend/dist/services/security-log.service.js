"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityLogService = void 0;
const prisma_1 = __importDefault(require("../prisma"));
class SecurityLogService {
    /**
     * Logs an access governance event (Role change, Permission sync, etc.)
     */
    static async logEvent(data) {
        try {
            console.log(`[SECURITY_AUDIT] ${data.event_type}: ${data.description} by ${data.actor_id}`);
            await prisma_1.default.auditLog.create({
                data: {
                    organization_id: data.organization_id,
                    user_id: data.actor_id,
                    action_type: data.event_type,
                    entity_type: 'ROLE_PERMISSION',
                    entity_id: data.target_user_id || data.metadata?.roleId || 'SYSTEM',
                    metadata: { description: data.description, ...data.metadata }
                }
            });
        }
        catch (error) {
            console.error('Failed to log security event:', error);
        }
    }
}
exports.SecurityLogService = SecurityLogService;
