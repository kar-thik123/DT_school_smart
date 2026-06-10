"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditEvent = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const logAuditEvent = async (payload) => {
    try {
        await prisma_1.default.auditLog.create({
            data: {
                organization_id: payload.organization_id,
                user_id: payload.user_id,
                user_name: payload.user_name || null,
                action_type: payload.action_type,
                entity_type: payload.entity_type,
                entity_id: payload.entity_id,
                metadata: payload.metadata || null
            }
        });
    }
    catch (error) {
        console.error('[Audit Logger Error]', error);
    }
};
exports.logAuditEvent = logAuditEvent;
