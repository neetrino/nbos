import type { SidebarModuleKey } from '@nbos/shared/constants';
import type { NavigationMessageKey } from './nav-message-keys';

export interface PermissionRequirement {
  module: string;
  action: string;
}

/** Non-clickable section label inside a module submenu (e.g. Revenue under Finance). */
export type NavChildGroupDefinition = {
  kind: 'group';
  /** next-intl key under the navigation namespace */
  label: NavigationMessageKey;
};

export type NavChildLinkDefinition = {
  kind?: 'link';
  /** next-intl key under the navigation namespace */
  label: NavigationMessageKey;
  href: string;
  /** Section id for modules with visit registry (href from last visited path). */
  navSection?: string;
  permission?: PermissionRequirement;
};

export type NavChildDefinition = NavChildGroupDefinition | NavChildLinkDefinition;

/** Hover-only action on a top-level nav row. Tasks uses unsorted (no-link) create. */
export type NavQuickAction = 'create-unsorted-task';

export function isNavChildGroup(child: NavChildDefinition): child is NavChildGroupDefinition {
  return child.kind === 'group';
}

export function isNavChildLink(child: NavChildDefinition): child is NavChildLinkDefinition {
  return !isNavChildGroup(child);
}

export interface NavModuleDefinition {
  key: SidebarModuleKey;
  /** next-intl key under the navigation namespace */
  label: NavigationMessageKey;
  href: string;
  permission?: PermissionRequirement;
  children?: NavChildDefinition[];
  /** Optional hover action on the module row (only Tasks today). */
  quickAction?: NavQuickAction;
}

export const NAV_MODULE_DEFINITIONS: NavModuleDefinition[] = [
  {
    key: 'dashboard',
    label: 'modules.dashboard',
    href: '/dashboard',
    permission: { module: 'DASHBOARDS', action: 'VIEW' },
  },
  {
    key: 'crm',
    label: 'modules.crm',
    href: '/crm',
    permission: { module: 'CRM_LEADS', action: 'VIEW' },
  },
  {
    key: 'marketing',
    label: 'modules.marketing',
    href: '/marketing',
    permission: { module: 'CRM_LEADS', action: 'VIEW' },
  },
  {
    key: 'project-hub',
    label: 'modules.project-hub',
    href: '/projects',
    permission: { module: 'PROJECTS', action: 'VIEW' },
  },
  {
    key: 'delivery-board',
    label: 'modules.delivery-board',
    href: '/delivery-board',
    permission: { module: 'PROJECTS', action: 'VIEW' },
  },
  {
    key: 'tasks',
    label: 'modules.tasks',
    href: '/tasks',
    permission: { module: 'TASKS', action: 'VIEW' },
    quickAction: 'create-unsorted-task',
  },
  {
    key: 'work-spaces',
    label: 'modules.work-spaces',
    href: '/work-spaces',
    permission: { module: 'TASKS', action: 'VIEW' },
  },
  {
    key: 'finance',
    label: 'modules.finance',
    href: '/finance',
    permission: { module: 'FINANCE_INVOICES', action: 'VIEW' },
  },
  {
    key: 'support',
    label: 'modules.support',
    href: '/support',
    permission: { module: 'SUPPORT_TICKETS', action: 'VIEW' },
  },
  {
    key: 'clients',
    label: 'modules.clients',
    href: '/clients',
    permission: { module: 'CLIENTS', action: 'VIEW' },
  },
  {
    key: 'partners',
    label: 'modules.partners',
    href: '/partners',
    permission: { module: 'PARTNERS', action: 'VIEW' },
  },
  {
    key: 'my-company',
    label: 'modules.my-company',
    href: '/my-company',
    permission: { module: 'COMPANY', action: 'VIEW' },
    children: [
      {
        label: 'children.myCompany.compensation',
        href: '/my-company/compensation',
        permission: { module: 'FINANCE_SALARY', action: 'VIEW' },
      },
      {
        label: 'children.myCompany.kpi',
        href: '/my-company/kpi',
        permission: { module: 'DASHBOARDS', action: 'VIEW' },
      },
      {
        label: 'children.myCompany.kpiPolicies',
        href: '/my-company/kpi-policies',
        permission: { module: 'COMPANY', action: 'VIEW' },
      },
      {
        label: 'children.myCompany.sop',
        href: '/my-company/sop',
        permission: { module: 'COMPANY', action: 'VIEW' },
      },
    ],
  },
  {
    key: 'messenger',
    label: 'modules.messenger',
    href: '/messenger',
    permission: { module: 'MESSENGER', action: 'VIEW' },
    children: [
      { label: 'children.messenger.all', href: '/messenger' },
      { label: 'children.messenger.products', href: '/messenger/products' },
      { label: 'children.messenger.tasks', href: '/messenger/tasks' },
      { label: 'children.messenger.deals', href: '/messenger/deals' },
      { label: 'children.messenger.workSpaces', href: '/messenger/work-spaces' },
      { label: 'children.messenger.groups', href: '/messenger/groups' },
      { label: 'children.messenger.direct', href: '/messenger/direct' },
      { label: 'children.messenger.collections', href: '/messenger/collections' },
    ],
  },
  {
    key: 'client-messenger',
    label: 'modules.client-messenger',
    href: '/client-messenger',
    permission: { module: 'MESSENGER', action: 'VIEW' },
    children: [
      { label: 'children.clientMessenger.inbox', href: '/client-messenger' },
      { label: 'children.clientMessenger.sales', href: '/client-messenger/sales' },
      { label: 'children.clientMessenger.clients', href: '/client-messenger/clients' },
      { label: 'children.clientMessenger.collections', href: '/client-messenger/collections' },
    ],
  },
  {
    key: 'calendar',
    label: 'modules.calendar',
    href: '/calendar',
    permission: { module: 'CALENDAR', action: 'VIEW' },
  },
  {
    key: 'drive',
    label: 'modules.drive',
    href: '/drive',
    permission: { module: 'DRIVE', action: 'VIEW' },
  },
  {
    key: 'documents',
    label: 'modules.documents',
    href: '/documents',
    permission: { module: 'DOCUMENTS', action: 'VIEW' },
  },
  {
    key: 'mail',
    label: 'modules.mail',
    href: '/mail',
    permission: { module: 'MAIL', action: 'VIEW' },
  },
  {
    key: 'credentials',
    label: 'modules.credentials',
    href: '/credentials',
    permission: { module: 'CREDENTIALS', action: 'VIEW' },
  },
  {
    key: 'ai-agents',
    label: 'modules.ai-agents',
    href: '/ai-agents',
    permission: { module: 'AI_PLATFORM', action: 'VIEW' },
  },
  {
    key: 'reports',
    label: 'modules.reports',
    href: '/reports',
    permission: { module: 'DASHBOARDS', action: 'VIEW' },
  },
  {
    key: 'settings',
    label: 'modules.settings',
    href: '/settings',
    children: [
      {
        label: 'children.settings.general',
        href: '/settings',
        permission: { module: 'COMPANY', action: 'EDIT' },
      },
      {
        label: 'children.settings.systemLists',
        href: '/settings/lists',
        permission: { module: 'COMPANY', action: 'EDIT' },
      },
      {
        label: 'children.settings.permissionsRbac',
        href: '/settings/roles',
        permission: { module: 'COMPANY', action: 'ADD' },
      },
      {
        label: 'children.settings.moduleSettings',
        href: '/settings/module-settings',
        permission: { module: 'COMPANY', action: 'EDIT' },
      },
      {
        label: 'children.settings.integrations',
        href: '/settings/integrations',
        permission: { module: 'COMPANY', action: 'EDIT' },
      },
      {
        label: 'children.settings.security',
        href: '/settings/security',
        permission: { module: 'COMPANY', action: 'EDIT' },
      },
      {
        label: 'children.settings.featureFlags',
        href: '/settings/feature-flags',
        permission: { module: 'COMPANY', action: 'EDIT' },
      },
      {
        label: 'children.settings.scheduler',
        href: '/settings/scheduler',
        permission: { module: 'COMPANY', action: 'VIEW' },
      },
      {
        label: 'children.settings.auditLog',
        href: '/settings/audit-log',
        permission: { module: 'AUDIT_LOGS', action: 'VIEW' },
      },
    ],
  },
];
