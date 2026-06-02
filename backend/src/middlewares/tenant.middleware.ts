import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

export interface TenantRequest extends Request {
  organization_id?: string;
}

export const tenantMiddleware = async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const hostname = req.hostname || '';

    // First, try to resolve as a Custom Domain
    let org = await prisma.organization.findFirst({ where: { custom_domain: hostname } });

    // If not found, try to resolve as a Subdomain
    if (!org) {
      const parts = hostname.split('.');
      if (parts.length > 0) {
        const potentialSubdomain = parts[0];
        org = await prisma.organization.findFirst({ where: { subdomain: potentialSubdomain } });
      }
    }

    if (org) {
      req.organization_id = org.id;
    }
    
    // If no organization matched, req.organization_id remains undefined.
    // This represents the Platform Context (e.g. app.platform.com) which will be verified downstream.
    return next();

  } catch (error) {
    return res.status(500).json({ message: 'Internal server error in tenant middleware' });
  }
};
