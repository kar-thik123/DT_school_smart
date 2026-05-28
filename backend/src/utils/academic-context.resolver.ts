import { Request } from 'express';
import { getActiveAcademicYearId } from './academic-helper';

export class AcademicContextResolver {
  /**
   * Resolves the authoritative academic_year_id for a given request.
   * Enforces the x-academic-year-id header to guarantee temporal data isolation.
   */
  static async resolveAcademicYearId(req: Request | any): Promise<string> {
    const orgId = req.user?.organization_id;
    if (!orgId) throw new Error('Organization ID is missing from user context');

    let yearId = req.headers['x-academic-year-id'] as string;

    if (!yearId) {
      // Fallback to query string for backward compatibility during rollout
      yearId = req.query?.academic_year_id as string;
      if (yearId) {
        console.warn(`[AcademicContextResolver] Deprecation Warning: Academic year passed via query string by user ${req.user?.user_id}`);
      }
    }

    if (!yearId || yearId === 'null' || yearId === 'undefined') {
      // Final fallback to the global active year
      console.warn(`[AcademicContextResolver] Missing explicit academic year for user ${req.user?.user_id}. Falling back to default active year.`);
      yearId = await getActiveAcademicYearId(orgId);
    }

    return yearId;
  }
}
