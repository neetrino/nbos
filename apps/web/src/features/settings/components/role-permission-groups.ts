import { CRM_CALL_RECORDINGS_MODULE } from '@nbos/shared';
import { formatRolePermissionModuleName } from './role-permissions-types';

/** Legacy PLAY-only module. The matrix edits VIEW/EDIT/ADD/DELETE; playback is CALLS_PLAY. */
const HIDDEN_ROLE_MATRIX_MODULES = new Set<string>([CRM_CALL_RECORDINGS_MODULE]);

export interface RolePermissionGroup {
  id: string;
  title: string;
  modules: string[];
}

const GROUP_CATALOG: { id: string; title: string; modules: readonly string[] }[] = [
  {
    id: 'sales',
    title: 'Sales and clients',
    modules: ['CRM_LEADS', 'CRM_DEALS', 'CLIENTS', 'ORDERS', 'PARTNERS', 'CALLS'],
  },
  {
    id: 'finance',
    title: 'Finance',
    modules: [
      'FINANCE_INVOICES',
      'FINANCE_PAYMENTS',
      'FINANCE_SUBSCRIPTIONS',
      'FINANCE_EXPENSES',
      'FINANCE_EXPENSE_PLANS',
      'FINANCE_CLIENT_SERVICES',
      'FINANCE_BONUSES',
      'FINANCE_SALARY',
    ],
  },
  {
    id: 'work',
    title: 'Work',
    modules: ['PROJECTS', 'TASKS', 'CALENDAR', 'SUPPORT_TICKETS', 'CHECKLIST_TEMPLATES'],
  },
  {
    id: 'delivery',
    title: 'Delivery',
    modules: ['FUNCTION_CATALOG', 'DELIVERY_COMPENSATION_RULES', 'DELIVERY_CONFIGURATION'],
  },
  {
    id: 'files',
    title: 'Files',
    modules: ['DRIVE', 'DOCUMENTS', 'CREDENTIALS'],
  },
  {
    id: 'messages',
    title: 'Messages',
    modules: ['MESSENGER', 'MAIL'],
  },
  {
    id: 'company',
    title: 'Company',
    modules: ['COMPANY', 'MARKETING'],
  },
  {
    id: 'platform',
    title: 'Platform',
    modules: [
      'DASHBOARDS',
      'SETTINGS',
      'SETTINGS_RBAC',
      'SETTINGS_SCHEDULER',
      'AUDIT_LOGS',
      'AI_PLATFORM',
    ],
  },
];

/** Groups catalog modules and drops groups that do not match the search. */
export function groupRolePermissionModules(
  modules: string[],
  query: string,
): RolePermissionGroup[] {
  const needle = query.trim().toLowerCase();
  const remaining = new Set(
    modules.filter((permissionModule) => !HIDDEN_ROLE_MATRIX_MODULES.has(permissionModule)),
  );
  const groups: RolePermissionGroup[] = [];

  for (const group of GROUP_CATALOG) {
    const known = group.modules.filter((permissionModule) => remaining.has(permissionModule));
    for (const permissionModule of known) remaining.delete(permissionModule);
    const matched = known.filter((permissionModule) =>
      matchesModuleQuery(permissionModule, needle),
    );
    if (matched.length > 0) groups.push({ id: group.id, title: group.title, modules: matched });
  }

  const other = [...remaining]
    .filter((permissionModule) => matchesModuleQuery(permissionModule, needle))
    .sort();
  if (other.length > 0) groups.push({ id: 'other', title: 'Other', modules: other });
  return groups;
}

function matchesModuleQuery(permissionModule: string, needle: string): boolean {
  if (!needle) return true;
  const label = formatRolePermissionModuleName(permissionModule).toLowerCase();
  return label.includes(needle) || permissionModule.toLowerCase().includes(needle);
}
