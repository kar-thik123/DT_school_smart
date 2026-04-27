export interface Permission {
  id: string;
  module: string;
  action: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  organization_id?: string;
  _count?: {
    users: number;
    permissions: number;
  };
}

export interface RolePermissionSync {
  permissionIds: string[];
}
