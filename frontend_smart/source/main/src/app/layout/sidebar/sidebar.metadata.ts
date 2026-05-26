// Sidebar route metadata
export interface RouteInfo {
  path: string;
  title: string;
  iconType: string;
  icon: string;
  class: string;
  groupTitle: boolean;
  badge: string;
  badgeClass: string;
  role: string[];
  submenu: RouteInfo[];
  showInSidebar?: boolean;
  // Module Registry Foundation (Phase 1)
  moduleKey?: string;
  requiredPermissions?: string[];
  sidebarGroup?: string;
  breadcrumbGroup?: string;
  visibilityRules?: any;
  domain?: 'PLATFORM' | 'TENANT';
}

