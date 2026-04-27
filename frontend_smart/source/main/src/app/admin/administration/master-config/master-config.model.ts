export interface MasterEntity {
  id: string;
  name: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface AcademicYear extends MasterEntity {
  start_date?: Date;
  end_date?: Date;
  is_active: boolean;
}

export interface OrganizationProfile {
  id: string;
  school_name: string;
  subdomain: string;
  logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  school_type?: string;
  status: string;
}

export interface MasterConfigTab {
  label: string;
  icon: string;
  id: string;
}
