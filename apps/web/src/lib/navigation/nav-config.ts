import type { SidebarModuleKey } from '@nbos/shared/constants';

export interface PermissionRequirement {
  module: string;
  action: string;
}

/** Non-clickable section label inside a module submenu (e.g. Revenue under Finance). */
export type NavChildGroupDefinition = {
  kind: 'group';
  label: string;
};

export type NavChildLinkDefinition = {
  kind?: 'link';
  label: string;
  href: string;
  /** Section id for modules with visit registry (href from last visited path). */
  navSection?: string;
  permission?: PermissionRequirement;
};

export type NavChildDefinition = NavChildGroupDefinition | NavChildLinkDefinition;

export function isNavChildGroup(child: NavChildDefinition): child is NavChildGroupDefinition {
  return child.kind === 'group';
}

export function isNavChildLink(child: NavChildDefinition): child is NavChildLinkDefinition {
  return !isNavChildGroup(child);
}

export interface NavModuleDefinition {
  key: SidebarModuleKey;
  label: string;
  href: string;
  permission?: PermissionRequirement;
  children?: NavChildDefinition[];
}

export const NAV_MODULE_DEFINITIONS: NavModuleDefinition[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  {
    key: 'crm',
    label: 'CRM',
    href: '/crm',
    permission: { module: 'CRM_LEADS', action: 'VIEW' },
    children: [
      {
        label: 'Dashboard',
        href: '/crm/dashboard',
        navSection: 'dashboard',
        permission: { module: 'CRM_LEADS', action: 'VIEW' },
      },
      {
        label: 'Leads',
        href: '/crm/leads',
        navSection: 'leads',
        permission: { module: 'CRM_LEADS', action: 'VIEW' },
      },
      {
        label: 'Deals',
        href: '/crm/deals',
        navSection: 'deals',
        permission: { module: 'CRM_DEALS', action: 'VIEW' },
      },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing',
    href: '/marketing',
    permission: { module: 'CRM_LEADS', action: 'VIEW' },
    children: [
      { label: 'Marketing Board', href: '/marketing', navSection: 'board' },
      { label: 'Attribution Review', href: '/marketing/attribution', navSection: 'attribution' },
      { label: 'Marketing Dashboard', href: '/marketing/dashboard', navSection: 'dashboard' },
      { label: 'Marketing Settings', href: '/marketing/settings', navSection: 'settings' },
    ],
  },
  {
    key: 'project-hub',
    label: 'Project Hub',
    href: '/projects',
    permission: { module: 'PROJECTS', action: 'VIEW' },
  },
  {
    key: 'delivery-board',
    label: 'Delivery Board',
    href: '/delivery-board',
    permission: { module: 'PROJECTS', action: 'VIEW' },
  },
  {
    key: 'tasks',
    label: 'Tasks',
    href: '/tasks',
    permission: { module: 'TASKS', action: 'VIEW' },
  },
  {
    key: 'work-spaces',
    label: 'Work Spaces',
    href: '/work-spaces',
    permission: { module: 'TASKS', action: 'VIEW' },
  },
  {
    key: 'finance',
    label: 'Finance',
    href: '/finance',
    permission: { module: 'FINANCE_INVOICES', action: 'VIEW' },
    children: [
      {
        label: 'Overview',
        href: '/finance/dashboard',
        navSection: 'overview',
        permission: { module: 'FINANCE_INVOICES', action: 'VIEW' },
      },
      {
        label: 'Revenue',
        href: '/finance/orders',
        navSection: 'revenue',
        permission: { module: 'FINANCE_INVOICES', action: 'VIEW' },
      },
      {
        label: 'Expenses',
        href: '/finance/expenses',
        navSection: 'expenses',
        permission: { module: 'FINANCE_EXPENSES', action: 'VIEW' },
      },
      {
        label: 'Payroll',
        href: '/finance/payroll',
        navSection: 'payroll',
        permission: { module: 'FINANCE_INVOICES', action: 'VIEW' },
      },
    ],
  },
  {
    key: 'support',
    label: 'Support',
    href: '/support',
    permission: { module: 'SUPPORT_TICKETS', action: 'VIEW' },
    children: [
      {
        label: 'Tickets',
        href: '/support',
        navSection: 'tickets',
        permission: { module: 'SUPPORT_TICKETS', action: 'VIEW' },
      },
      {
        label: 'Change Control',
        href: '/support/change-control',
        navSection: 'change-control',
        permission: { module: 'SUPPORT_TICKETS', action: 'VIEW' },
      },
    ],
  },
  {
    key: 'clients',
    label: 'Clients',
    href: '/clients',
    children: [
      { label: 'Companies', href: '/clients/companies', navSection: 'companies' },
      { label: 'Contacts', href: '/clients/contacts', navSection: 'contacts' },
    ],
  },
  {
    key: 'partners',
    label: 'Partners',
    href: '/partners',
    permission: { module: 'PARTNERS', action: 'VIEW' },
  },
  {
    key: 'my-company',
    label: 'My Company',
    href: '/my-company',
    permission: { module: 'COMPANY', action: 'VIEW' },
    children: [
      {
        label: 'Org Structure',
        href: '/my-company',
        permission: { module: 'COMPANY', action: 'VIEW' },
      },
      {
        label: 'Team',
        href: '/my-company/team',
        permission: { module: 'COMPANY', action: 'VIEW' },
      },
      {
        label: 'Departments',
        href: '/my-company/departments',
        permission: { module: 'COMPANY', action: 'VIEW' },
      },
      {
        label: 'Roles & Seats',
        href: '/my-company/roles-seats',
        permission: { module: 'COMPANY', action: 'VIEW' },
      },
      {
        label: 'Compensation',
        href: '/my-company/compensation',
        permission: { module: 'FINANCE_SALARY', action: 'VIEW' },
      },
      {
        label: 'KPI / Scorecard',
        href: '/my-company/kpi',
        permission: { module: 'DASHBOARDS', action: 'VIEW' },
      },
      {
        label: 'SOP & Templates',
        href: '/my-company/sop',
        permission: { module: 'COMPANY', action: 'VIEW' },
      },
    ],
  },
  {
    key: 'messenger',
    label: 'Messenger',
    href: '/messenger',
    permission: { module: 'MESSENGER', action: 'VIEW' },
  },
  {
    key: 'calendar',
    label: 'Calendar',
    href: '/calendar',
    permission: { module: 'CALENDAR', action: 'VIEW' },
  },
  {
    key: 'drive',
    label: 'Drive',
    href: '/drive',
    permission: { module: 'DRIVE', action: 'VIEW' },
  },
  {
    key: 'documents',
    label: 'Documents',
    href: '/documents',
    permission: { module: 'DOCUMENTS', action: 'VIEW' },
  },
  {
    key: 'mail',
    label: 'Mail',
    href: '/mail',
    permission: { module: 'MAIL', action: 'VIEW' },
  },
  {
    key: 'credentials',
    label: 'Credentials',
    href: '/credentials',
    permission: { module: 'CREDENTIALS', action: 'VIEW' },
  },
  {
    key: 'reports',
    label: 'Reports / Analytics',
    href: '/reports',
    permission: { module: 'DASHBOARDS', action: 'VIEW' },
  },
  {
    key: 'settings',
    label: 'Platform Admin',
    href: '/settings',
    children: [
      { label: 'General', href: '/settings', permission: { module: 'COMPANY', action: 'EDIT' } },
      {
        label: 'System Lists',
        href: '/settings/lists',
        permission: { module: 'COMPANY', action: 'EDIT' },
      },
      {
        label: 'Permissions / RBAC',
        href: '/settings/roles',
        permission: { module: 'COMPANY', action: 'ADD' },
      },
      {
        label: 'Module Settings',
        href: '/settings/module-settings',
        permission: { module: 'COMPANY', action: 'EDIT' },
      },
      {
        label: 'Integrations',
        href: '/settings/integrations',
        permission: { module: 'COMPANY', action: 'EDIT' },
      },
      {
        label: 'Security',
        href: '/settings/security',
        permission: { module: 'COMPANY', action: 'EDIT' },
      },
      {
        label: 'Feature Flags',
        href: '/settings/feature-flags',
        permission: { module: 'COMPANY', action: 'EDIT' },
      },
      {
        label: 'Audit Log',
        href: '/settings/audit-log',
        permission: { module: 'AUDIT_LOGS', action: 'VIEW' },
      },
    ],
  },
];
