import prisma from '../prisma';

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
export async function getActiveAcademicYearId(organizationId: string): Promise<string> {
  // 1. Try loading from Master Configuration settings
  const config = await prisma.moduleConfig.findUnique({
    where: {
      organization_id_module_name: {
        organization_id: organizationId,
        module_name: 'master-config'
      }
    }
  });

  const configData = config?.config_data as any;
  if (configData?.active_academic_year_id) {
    // Validate existence and correct organization ownership
    const year = await prisma.academicYear.findFirst({
      where: { id: configData.active_academic_year_id, organization_id: organizationId }
    });
    if (year) {
      return year.id;
    }
  }

  // 2. Fallback: query database where is_active is true
  const activeYear = await prisma.academicYear.findFirst({
    where: { organization_id: organizationId, is_active: true }
  });
  if (activeYear) {
    return activeYear.id;
  }

  // 3. Fallback: select first available year
  const firstYear = await prisma.academicYear.findFirst({
    where: { organization_id: organizationId },
    orderBy: { name: 'asc' }
  });
  if (firstYear) {
    return firstYear.id;
  }

  // 4. Fallback: auto-generate a default academic year for this new tenant
  const now = new Date();
  const defaultYear = await prisma.academicYear.create({
    data: {
      name: `${now.getFullYear()}-${now.getFullYear() + 1}`,
      organization_id: organizationId,
      is_active: true
    }
  });
  return defaultYear.id;
}
