import { Organization } from '@prisma/client';

export class FrontendUrlResolver {
  /**
   * Resolves the base URL for a given organization.
   * Throws an error if a valid URL cannot be constructed.
   */
  static resolve(org: Partial<Organization> | null, frontendOrigin: string): string {
    // Validate frontendOrigin
    let validatedOrigin = '';
    if (frontendOrigin) {
      try {
        const urlObj = new URL(frontendOrigin);
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
          throw new Error('frontendOrigin must use http or https protocol.');
        }
        validatedOrigin = `${urlObj.protocol}//${urlObj.host}`; // Normalized without trailing slash
      } catch (e) {
        throw new Error(`Invalid frontendOrigin: ${frontendOrigin}`);
      }
    }

    // No organization context (System default)
    if (!org) {
      if (!validatedOrigin) {
        throw new Error('frontendOrigin is missing. Cannot resolve default platform URL.');
      }
      return validatedOrigin;
    }

    const domainType = org.domain_type?.toLowerCase() || '';

    // Custom Domain Deployment
    if (domainType === 'custom domain' || org.custom_domain) {
      if (!org.custom_domain) {
        throw new Error(`Organization ${org.id} is configured for a custom domain but custom_domain is missing.`);
      }
      return org.custom_domain.startsWith('http') ? org.custom_domain : `https://${org.custom_domain}`;
    }

    // Subdomain Deployment
    if (domainType === 'subdomain' || (!domainType && org.subdomain)) {
      if (!org.subdomain) {
        throw new Error(`Organization ${org.id} is configured for a subdomain but subdomain is missing.`);
      }
      if (!process.env.PLATFORM_BASE_DOMAIN) {
        throw new Error('PLATFORM_BASE_DOMAIN environment variable is missing.');
      }
      
      const baseDomain = process.env.PLATFORM_BASE_DOMAIN;
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      return `${protocol}://${org.subdomain}.${baseDomain}`;
    }

    // Platform Domain (Default) Deployment
    if (domainType === 'platform domain' || !domainType) {
      if (!validatedOrigin) {
        throw new Error('frontendOrigin is missing. Platform Domain deployment requires the frontend origin to be provided.');
      }
      return validatedOrigin;
    }

    throw new Error(`Unable to resolve frontend URL for organization ${org.id}. Invalid domain configuration: ${domainType}`);
  }
}
