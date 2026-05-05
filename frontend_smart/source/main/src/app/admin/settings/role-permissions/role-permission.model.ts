export interface IPermission {
  id: string;
  module: string;
  action: string;
  description?: string;
}

export interface IRole {
  id: string;
  name: string;
  description?: string;
  is_system: boolean;
  _count?: {
    users: number;
  };
}

export interface IRoleWithPermissions extends IRole {
  permissions: IPermission[];
}

export class Role implements IRole {
  id: string;
  name: string;
  description?: string;
  is_system: boolean;
  _count?: {
    users: number;
  };

  constructor(role: IRole) {
    this.id = role.id;
    this.name = role.name;
    this.description = role.description;
    this.is_system = role.is_system || false;
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
