import { RouteInfo } from './sidebar.metadata';

export const PLATFORM_MODULES: RouteInfo[] = [
  // 1. SYSTEM CONTROL (SYSTEM_ADMIN ONLY)
  {
    path: '',
    title: 'System Control',
    iconType: '',
    icon: '',
    class: '',
    groupTitle: true,
    badge: '',
    badgeClass: '',
    role: ['SYSTEM_ADMIN'],
    submenu: [],
    showInSidebar: true,
    domain: 'PLATFORM'
  },
  {
    path: '/organization/list',
    title: 'Organization List',
    iconType: 'material-icons-outlined',
    icon: 'list_alt',
    class: '',
    groupTitle: false,
    badge: '',
    badgeClass: '',
    role: ['SYSTEM_ADMIN'],
    submenu: [],
    showInSidebar: true,
    domain: 'PLATFORM'
  },
  {
    path: '/organization/setup',
    title: 'Provision New',
    iconType: 'material-icons-outlined',
    icon: 'add_business',
    class: '',
    groupTitle: false,
    badge: '',
    badgeClass: '',
    role: ['SYSTEM_ADMIN'],
    submenu: [],
    showInSidebar: true,
    domain: 'PLATFORM'
  },

  // 2. MAIN HEADER (ADMIN, SUPER_ADMIN, MANAGEMENT)
  {
    path: '',
    title: 'MENUITEMS.MAIN.TEXT',
    iconType: '',
    icon: '',
    class: '',
    groupTitle: true,
    badge: '',
    badgeClass: '',
    role: ['ADMIN', 'SUPER_ADMIN', 'MANAGEMENT'],
    submenu: [],
    showInSidebar: true,
    domain: 'TENANT'
  },

  // 3. ADMINISTRATION GROUP
  {
    path: '',
    title: 'MENUITEMS.ADMINISTRATION.TEXT',
    iconType: 'material-icons-outlined',
    icon: 'admin_panel_settings',
    class: 'menu-toggle',
    groupTitle: false,
    badge: '',
    badgeClass: '',
    role: ['ADMIN', 'SUPER_ADMIN', 'MANAGEMENT'],
    showInSidebar: true,
    domain: 'TENANT',
    submenu: [
      {
        path: '/admin/administration/users',
        title: 'MENUITEMS.ADMINISTRATION.LIST.USERS',
        iconType: '',
        icon: '',
        class: 'ml-menu',
        groupTitle: false,
        badge: '',
        badgeClass: '',
        role: ['USERS:VIEW', 'USERS_VIEW'],
        submenu: [],
        showInSidebar: true,
        domain: 'TENANT'
      },
      {
        path: '/admin/administration/roles',
        title: 'MENUITEMS.ADMINISTRATION.LIST.ROLES',
        iconType: '',
        icon: '',
        class: 'ml-menu',
        groupTitle: false,
        badge: '',
        badgeClass: '',
        role: ['ROLES_AND_PERMISSIONS:VIEW', 'ROLES_AND_PERMISSIONS_VIEW'],
        submenu: [],
        showInSidebar: true,
        domain: 'TENANT'
      },
      {
        path: '/admin/administration/master-config',
        title: 'MENUITEMS.ADMINISTRATION.LIST.MASTER-CONFIG',
        iconType: '',
        icon: '',
        class: 'ml-menu',
        groupTitle: false,
        badge: '',
        badgeClass: '',
        role: ['ORGANIZATION:MANAGE_CONFIG', 'ORGANIZATION_MANAGE_CONFIG', 'MASTER_CONFIGURATION:MANAGE_CONFIG'],
        submenu: [],
        showInSidebar: true,
        domain: 'TENANT'
      },
      {
        path: '/admin/administration/academic-structure',
        title: 'MENUITEMS.ADMINISTRATION.LIST.ACADEMIC-STRUCTURE',
        iconType: '',
        icon: '',
        class: 'ml-menu',
        groupTitle: false,
        badge: '',
        badgeClass: '',
        role: ['ACADEMIC_STRUCTURE:READ', 'ACADEMIC_STRUCTURE_READ', 'ACADEMIC_STRUCTURE:VIEW', 'ACADEMIC_STRUCTURE_VIEW'],
        submenu: [],
        showInSidebar: true,
        domain: 'TENANT'
      },
      {
        path: '/admin/administration/units-list',
        title: 'MENUITEMS.ADMINISTRATION.LIST.UNITS-LIST',
        iconType: '',
        icon: '',
        class: 'ml-menu',
        groupTitle: false,
        badge: '',
        badgeClass: '',
        role: ['UNITS_LIST:MANAGE_SYLLABUS'],
        submenu: [],
        showInSidebar: true,
        domain: 'TENANT'
      },
      {
        path: '/admin/administration/teacher-assignment',
        title: 'MENUITEMS.ADMINISTRATION.LIST.TEACHER-ASSIGNMENT',
        iconType: '',
        icon: '',
        class: 'ml-menu',
        groupTitle: false,
        badge: '',
        badgeClass: '',
        role: ['TEACHER_ASSIGNMENT:VIEW', 'TEACHER_ASSIGNMENT_VIEW'],
        submenu: [],
        showInSidebar: true,
        domain: 'TENANT'
      },
      {
        path: '/admin/administration/student-mapping',
        title: 'MENUITEMS.ADMINISTRATION.LIST.STUDENT-ENROLLMENT',
        iconType: '',
        icon: '',
        class: 'ml-menu',
        groupTitle: false,
        badge: '',
        badgeClass: '',
        role: ['STUDENT_ENROLLMENT:READ', 'ACADEMIC_STRUCTURE:READ', 'ACADEMIC_STRUCTURE_READ'],
        submenu: [],
        showInSidebar: true,
        domain: 'TENANT'
      },
      {
        path: '/admin/administration/settings',
        title: 'MENUITEMS.ADMINISTRATION.LIST.SETTINGS',
        iconType: '',
        icon: '',
        class: 'ml-menu',
        groupTitle: false,
        badge: '',
        badgeClass: '',
        role: ['MASTER_CONFIGURATION:VIEW', 'MASTER_CONFIGURATION_VIEW'],
        submenu: [],
        showInSidebar: true,
        domain: 'TENANT'
      }
    ]
  },

  // 4. STANDALONE MODULES - QUESTION BANK & COMPLETION TRACKING
  // Admin versions:
  {
    path: '/admin/administration/question-bank',
    title: 'MENUITEMS.ADMINISTRATION.LIST.QUESTION-BANK',
    iconType: 'material-icons-outlined',
    icon: 'fact_check',
    class: '',
    groupTitle: false,
    badge: '',
    badgeClass: '',
    role: ['QUESTION_BANK:VIEW', 'QUESTION_BANK_VIEW'],
    submenu: [],
    showInSidebar: true,
    domain: 'TENANT'
  },
  {
    path: '/admin/administration/completion-mgmt',
    title: 'MENUITEMS.ADMINISTRATION.LIST.COMPLETION-TRACKING',
    iconType: 'material-icons-outlined',
    icon: 'assignment_turned_in',
    class: '',
    groupTitle: false,
    badge: '',
    badgeClass: '',
    role: ['COMPLETION_TRACKING:VIEW', 'COMPLETION_TRACKING_VIEW', 'COMPLETION:VIEW', 'COMPLETION_VIEW'],
    submenu: [],
    showInSidebar: true,
    domain: 'TENANT'
  }
];
