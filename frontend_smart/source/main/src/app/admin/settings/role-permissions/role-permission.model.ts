export interface IPermission {
  id: string;
  module: string;
  action: string;
}

export interface IRole {
  id: string;
  name: string;
  description?: string;
  is_system: boolean;
  organization_id?: string;
  is_teaching_role?: boolean;
  _count?: {
    users: number;
    permissions: number;
  };
}

export interface IRoleWithPermissions extends IRole {
  permissions: IPermission[];
}

export class Role implements IRole {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  organization_id?: string;
  is_teaching_role?: boolean;
  _count?: {
    users: number;
    permissions: number;
  };

  constructor(role: Partial<IRole>) {
    this.id = role.id || '';
    this.name = role.name || '';
    this.description = role.description || '';
    this.is_system = role.is_system || false;
    this.is_teaching_role = role.is_teaching_role || false;
    this.organization_id = role.organization_id;
    this._count = role._count;
  }
}

export interface PermissionGroup {
  module: string;
  actions: {
    id: string;
    action: string;
    selected: boolean;
  }[];
}
