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

    // 1. Check for Active Academic Year explicitly in database
    // By default, ALL operational modules MUST force the ACTIVE year.
    // We do NOT trust req.headers['x-academic-year-id'] for normal writes/reads.
    return await getActiveAcademicYearId(orgId);
  }

  /**
   * Resolves the historical academic_year_id for a given request.
   * This is exclusively for Analytics, Reports, Audit Logs, and Rollover modules.
   * It respects the x-academic-year-id header, falling back to active year.
   */
  static async resolveHistoricalAcademicYearId(req: Request | any): Promise<string> {
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
      console.debug(`[AcademicContextResolver] Missing explicit historical academic year for user ${req.user?.user_id}. Falling back to default active year.`);
      yearId = await getActiveAcademicYearId(orgId);
    }

    return yearId;
  }

  /**
   * Resolves the organization_id strictly for Master Data.
   * By definition, Master Data is isolated by Organization, NOT by Academic Year.
   */
  static resolveMasterContext(req: Request | any): { organization_id: string } {
    const orgId = req.user?.organization_id;
    if (!orgId) throw new Error('Organization ID is missing from user context');
    
    return { organization_id: orgId };
  }
}
