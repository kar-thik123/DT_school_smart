"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveAcademicYearId = getActiveAcademicYearId;
const prisma_1 = __importDefault(require("../prisma"));
/**
 * Resolves the active academic year ID for a given organization.
 *
 * Logic flow:
 * 1. Checks if a custom active_academic_year_id is saved under the 'master-config' ModuleConfig.
 * 2. Validates that the configured year exists and belongs to the organization.
 * 3. Falls back to the academic year with is_active = true.
 * 4. Falls back to the oldest academic year for the organization.
 * 5. If no year exists, automatically bootstraps a default active year for the organization.
 *
 * @param organizationId The organization UUID
 */
async function getActiveAcademicYearId(organizationId) {
    // 1. Try loading from Master Configuration settings
    const config = await prisma_1.default.moduleConfig.findUnique({
        where: {
            organization_id_module_name: {
                organization_id: organizationId,
                module_name: 'master-config'
            }
        }
    });
    const configData = config?.config_data;
    if (configData?.active_academic_year_id) {
        // Validate existence and correct organization ownership
        const year = await prisma_1.default.academicYear.findFirst({
            where: { id: configData.active_academic_year_id, organization_id: organizationId }
        });
        if (year) {
            return year.id;
        }
    }
    // 2. Fallback: query database where is_active is true
    const activeYear = await prisma_1.default.academicYear.findFirst({
        where: { organization_id: organizationId, is_active: true }
    });
    if (activeYear) {
        return activeYear.id;
    }
    // 3. Fallback: select first available year
    const firstYear = await prisma_1.default.academicYear.findFirst({
        where: { organization_id: organizationId },
        orderBy: { name: 'asc' }
    });
    if (firstYear) {
        return firstYear.id;
    }
    // 4. Fallback: auto-generate a default academic year for this new tenant
    const now = new Date();
    const defaultYear = await prisma_1.default.academicYear.create({
        data: {
            name: `${now.getFullYear()}-${now.getFullYear() + 1}`,
            organization_id: organizationId,
            is_active: true
        }
    });
    return defaultYear.id;
}
