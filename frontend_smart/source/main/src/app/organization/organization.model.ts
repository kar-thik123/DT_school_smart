export interface Organization {
  id?: string;
  school_name: string;
  school_type?: string;
  medium?: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  logo_url?: string;
  domain_type: 'subdomain' | 'custom' | 'on_premise';
  subdomain?: string;
  custom_domain?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_email?: string;
  smtp_password?: string;
  backup_enabled: boolean;
  login_limit: number;
}

export interface ProvisioningPayload extends Organization {
  admin_name?: string;
  admin_email?: string;
  admin_password?: string;
}

export interface ProvisioningResponse {
  message: string;
  organizationId: string;
  adminCreated: boolean;
  adminEmail: string | null;
}

export interface ReadinessStatus {
  ready: boolean;
  subdomainAvailable: boolean;
  adminEmailAvailable: boolean;
  errors: string[];
}
