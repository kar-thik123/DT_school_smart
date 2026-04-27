import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

export interface TenantRequest extends Request {
  organization_id?: string;
}

export const tenantMiddleware = async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    const subdomain = req.headers['x-subdomain'] as string;

    if (orgId) {
      const org = await prisma.organization.findUnique({ where: { id: orgId } });
      if (!org) {
        return res.status(404).json({ message: 'Organization not found' });
      }
      req.organization_id = org.id;
      return next();
    }

    if (subdomain) {
      const org = await prisma.organization.findUnique({ where: { subdomain } });
      if (!org) {
        return res.status(404).json({ message: 'Organization not found' });
      }
      req.organization_id = org.id;
      return next();
    }

    return res.status(400).json({ message: 'Organization identification missing (header x-organization-id or x-subdomain required)' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error in tenant middleware' });
  }
};
