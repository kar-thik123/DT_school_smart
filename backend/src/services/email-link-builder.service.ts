import { Organization } from '@prisma/client';
import { FrontendUrlResolver } from './frontend-url-resolver.service';

export class EmailLinkBuilder {
  /**
   * Builds the Password Reset URL for the specified organization.
   */
  static buildPasswordResetUrl(org: Partial<Organization> | null, token: string, frontendOrigin: string): string {
    const baseUrl = FrontendUrlResolver.resolve(org, frontendOrigin);
    return `${baseUrl}/#/authentication/reset-password?token=${token}`;
  }

  /**
   * Future Extensibility: Welcome Email
   */
  static buildWelcomeUrl(org: Partial<Organization> | null, token: string, frontendOrigin: string): string {
    const baseUrl = FrontendUrlResolver.resolve(org, frontendOrigin);
    return `${baseUrl}/#/authentication/welcome?token=${token}`;
  }

  /**
   * Future Extensibility: Invitation Email
   */
  static buildInvitationUrl(org: Partial<Organization> | null, token: string, frontendOrigin: string): string {
    const baseUrl = FrontendUrlResolver.resolve(org, frontendOrigin);
    return `${baseUrl}/#/authentication/invite?token=${token}`;
  }

  /**
   * Future Extensibility: Email Verification
   */
  static buildEmailVerificationUrl(org: Partial<Organization> | null, token: string, frontendOrigin: string): string {
    const baseUrl = FrontendUrlResolver.resolve(org, frontendOrigin);
    return `${baseUrl}/#/authentication/verify-email?token=${token}`;
  }

  /**
   * Future Extensibility: Magic Login
   */
  static buildMagicLoginUrl(org: Partial<Organization> | null, token: string, frontendOrigin: string): string {
    const baseUrl = FrontendUrlResolver.resolve(org, frontendOrigin);
    return `${baseUrl}/#/authentication/magic-login?token=${token}`;
  }
}
