export interface IUser {
  id: string;
  name: string;
  email: string;
  role: string;
  role_id: string;
  status: string;
  is_active: boolean;
  last_login?: string;
  profile_img?: string;
  roll_number?: string;
  admission_number?: string;
  mobile_number?: string;
}

export interface LicenseInfo {
  school_name: string;
  limit: number;
  activeUsers: number;
  usagePercent: number;
  renewal_date?: string;
  status: string;
  warning_threshold: number;
}

export class User implements IUser {
  id: string;
  name: string;
  email: string;
  role: string;
  role_id: string;
  status: string;
  is_active: boolean;
  last_login?: string;
  profile_img?: string;
  roll_number?: string;
  admission_number?: string;
  mobile_number?: string;

  constructor(user: Partial<IUser>) {
    this.id = user.id || '';
    this.name = user.name || '';
    this.email = user.email || '';
    this.role = user.role || '';
    this.role_id = user.role_id || '';
    this.status = user.status || 'Active';
    this.is_active = user.is_active ?? true;
    this.last_login = user.last_login;
    this.profile_img = user.profile_img || 'assets/images/user/new.jpg';
    this.roll_number = user.roll_number || '';
    this.admission_number = user.admission_number || '';
    this.mobile_number = user.mobile_number || '';
  }
}
