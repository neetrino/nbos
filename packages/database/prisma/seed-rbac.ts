import { createPrismaClient } from '../src/client';
import {
  CALLS_MODULE,
  CALLS_PLAY_ACTION,
  CALLS_PLAY_DEFAULT_ROLE_IDS,
  CALLS_PLAY_DEFAULT_SCOPE,
  CALLS_PLAY_PERMISSION_ID,
  CRM_CALL_RECORDINGS_MODULE,
  CRM_CALL_RECORDINGS_PLAY_ACTION,
  CRM_CALL_RECORDINGS_PLAY_DEFAULT_ROLE_IDS,
  CRM_CALL_RECORDINGS_PLAY_DEFAULT_SCOPE,
  CRM_CALL_RECORDINGS_PLAY_PERMISSION_ID,
  MESSENGER_CLIENT_CAPABILITY_ALL_ROLE_IDS,
  MESSENGER_CLIENT_CAPABILITY_OWN_ROLE_IDS,
  MESSENGER_CLIENT_READ_ACTION,
  MESSENGER_CLIENT_READ_PERMISSION_ID,
  MESSENGER_CLIENT_SEND_ACTION,
  MESSENGER_CLIENT_SEND_PERMISSION_ID,
  MESSENGER_MODULE,
  PLATFORM_RESOURCE_FAMILIES,
  ROLE_SELLER_ID,
} from '@nbos/shared';
import type { PlatformResourceFamilyEnum } from '@nbos/database';
import dotenv from 'dotenv';
import path from 'path';
import { OPERATIONS_ROLE_MATRIX } from './rbac-role-matrix-operations';
import { D, F, L, LA, MatrixEntry, N, R, VA, VA_OWN, VO } from './rbac-scopes';

const GLOBAL_OPERATIONAL_ROLE_IDS = ['role-owner', 'role-ceo'] as const;

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const MODULES = [
  'CRM_LEADS',
  'CRM_DEALS',
  'ORDERS',
  'FINANCE_INVOICES',
  'FINANCE_PAYMENTS',
  'FINANCE_SUBSCRIPTIONS',
  'FINANCE_EXPENSES',
  // Expense plans (`/finance/expenses/plans`) were previously gated by FINANCE_EXPENSES.
  // A separate module lets an administrator configure them independently; default grants
  // still mirror each role's FINANCE_EXPENSES level so effective access does not change.
  'FINANCE_EXPENSE_PLANS',
  // Client services (`/finance/client-services`) currently ride on FINANCE_INVOICES.
  // Do not copy that matrix: only Owner, CEO and Finance Director receive it (Finance
  // Director at the same full level as FINANCE_INVOICES / FINANCE_EXPENSES). Head of
  // Sales and every other role stay NONE until granted in Settings → Roles.
  'FINANCE_CLIENT_SERVICES',
  'FINANCE_BONUSES',
  'FINANCE_SALARY',
  'PROJECTS',
  'TASKS',
  'SUPPORT_TICKETS',
  'CREDENTIALS',
  'DRIVE',
  'DOCUMENTS',
  'MESSENGER',
  'MAIL',
  'CALENDAR',
  'CALLS',
  'COMPANY',
  // Settings / Admin is deliberately separate from COMPANY (My Company).
  // Only role-owner and role-ceo receive these below; every other role stays NONE.
  'SETTINGS',
  'SETTINGS_RBAC',
  'SETTINGS_SCHEDULER',
  // Marketing owns campaign budgets, so it is separate from CRM_LEADS. Besides
  // role-owner / role-ceo only role-head-marketing receives it below.
  'MARKETING',
  'CHECKLIST_TEMPLATES',
  'PARTNERS',
  'DASHBOARDS',
  'AUDIT_LOGS',
  'CLIENTS',
  'AI_PLATFORM',
] as const;

const ACTIONS = ['VIEW', 'EDIT', 'ADD', 'DELETE'] as const;

const DEVELOPER_ROLE_MATRIX: MatrixEntry = {
  CRM_LEADS: N,
  CRM_DEALS: N,
  ORDERS: N,
  FINANCE_INVOICES: N,
  FINANCE_PAYMENTS: N,
  FINANCE_SUBSCRIPTIONS: N,
  FINANCE_EXPENSES: N,
  FINANCE_EXPENSE_PLANS: N,
  FINANCE_CLIENT_SERVICES: N,
  FINANCE_BONUSES: L,
  FINANCE_SALARY: N,
  PROJECTS: L,
  TASKS: L,
  SUPPORT_TICKETS: L,
  CREDENTIALS: ['OWN', 'OWN', 'OWN', 'NONE'],
  DRIVE: L,
  DOCUMENTS: F,
  MESSENGER: L,
  MAIL: L,
  CALENDAR: L,
  COMPANY: R,
  PARTNERS: N,
  DASHBOARDS: L,
  AUDIT_LOGS: N,
  CLIENTS: N,
  AI_PLATFORM: N,
};

const SELLER_ROLE_MATRIX: MatrixEntry = {
  CRM_LEADS: F,
  CRM_DEALS: F,
  ORDERS: R,
  FINANCE_INVOICES: LA,
  FINANCE_PAYMENTS: N,
  FINANCE_SUBSCRIPTIONS: L,
  FINANCE_EXPENSES: N,
  FINANCE_EXPENSE_PLANS: N,
  FINANCE_CLIENT_SERVICES: N,
  FINANCE_BONUSES: L,
  FINANCE_SALARY: N,
  PROJECTS: N,
  TASKS: L,
  SUPPORT_TICKETS: N,
  CREDENTIALS: L,
  DRIVE: L,
  DOCUMENTS: R,
  MESSENGER: L,
  MAIL: L,
  CALENDAR: F,
  CALLS: VO,
  COMPANY: R,
  PARTNERS: L,
  DASHBOARDS: L,
  AUDIT_LOGS: N,
  CLIENTS: VA,
  AI_PLATFORM: N,
};

const ROLE_MATRIX: Record<string, MatrixEntry> = {
  ...OPERATIONS_ROLE_MATRIX,
  'role-owner': Object.fromEntries(MODULES.map((m) => [m, F])),
  'role-ceo': Object.fromEntries(MODULES.map((m) => [m, F])),
  [ROLE_SELLER_ID]: SELLER_ROLE_MATRIX,
  'role-pm': {
    CRM_LEADS: N,
    CRM_DEALS: L,
    ORDERS: L,
    FINANCE_INVOICES: R,
    FINANCE_PAYMENTS: N,
    FINANCE_SUBSCRIPTIONS: R,
    FINANCE_EXPENSES: N,
    FINANCE_EXPENSE_PLANS: N,
    FINANCE_CLIENT_SERVICES: N,
    FINANCE_BONUSES: L,
    FINANCE_SALARY: N,
    PROJECTS: F,
    TASKS: F,
    SUPPORT_TICKETS: F,
    CREDENTIALS: ['OWN', 'OWN', 'ALL', 'NONE'],
    DRIVE: F,
    DOCUMENTS: F,
    MESSENGER: F,
    MAIL: F,
    CALENDAR: F,
    COMPANY: R,
    PARTNERS: N,
    DASHBOARDS: D,
    AUDIT_LOGS: N,
    CLIENTS: VA,
    AI_PLATFORM: N,
  },
  'role-developer': DEVELOPER_ROLE_MATRIX,
  'role-developer-frontend': DEVELOPER_ROLE_MATRIX,
  'role-junior-developer': {
    CRM_LEADS: N,
    CRM_DEALS: N,
    ORDERS: N,
    FINANCE_INVOICES: N,
    FINANCE_PAYMENTS: N,
    FINANCE_SUBSCRIPTIONS: N,
    FINANCE_EXPENSES: N,
    FINANCE_EXPENSE_PLANS: N,
    FINANCE_CLIENT_SERVICES: N,
    FINANCE_BONUSES: L,
    FINANCE_SALARY: N,
    PROJECTS: L,
    TASKS: L,
    SUPPORT_TICKETS: N,
    CREDENTIALS: ['OWN', 'OWN', 'OWN', 'NONE'],
    DRIVE: L,
    DOCUMENTS: L,
    MESSENGER: L,
    MAIL: L,
    CALENDAR: L,
    COMPANY: R,
    PARTNERS: N,
    DASHBOARDS: L,
    AUDIT_LOGS: N,
    CLIENTS: N,
    AI_PLATFORM: N,
  },
  'role-designer': {
    CRM_LEADS: N,
    CRM_DEALS: N,
    ORDERS: N,
    FINANCE_INVOICES: N,
    FINANCE_PAYMENTS: N,
    FINANCE_SUBSCRIPTIONS: N,
    FINANCE_EXPENSES: N,
    FINANCE_EXPENSE_PLANS: N,
    FINANCE_CLIENT_SERVICES: N,
    FINANCE_BONUSES: L,
    FINANCE_SALARY: N,
    PROJECTS: L,
    TASKS: L,
    SUPPORT_TICKETS: N,
    CREDENTIALS: L,
    DRIVE: L,
    DOCUMENTS: L,
    MESSENGER: L,
    MAIL: L,
    CALENDAR: L,
    COMPANY: R,
    PARTNERS: N,
    DASHBOARDS: L,
    AUDIT_LOGS: N,
    CLIENTS: N,
    AI_PLATFORM: N,
  },
  'role-qa': {
    CRM_LEADS: N,
    CRM_DEALS: N,
    ORDERS: N,
    FINANCE_INVOICES: N,
    FINANCE_PAYMENTS: N,
    FINANCE_SUBSCRIPTIONS: N,
    FINANCE_EXPENSES: N,
    FINANCE_EXPENSE_PLANS: N,
    FINANCE_CLIENT_SERVICES: N,
    FINANCE_BONUSES: L,
    FINANCE_SALARY: N,
    PROJECTS: L,
    TASKS: L,
    SUPPORT_TICKETS: F,
    CREDENTIALS: L,
    DRIVE: L,
    DOCUMENTS: L,
    MESSENGER: L,
    MAIL: L,
    CALENDAR: L,
    COMPANY: R,
    PARTNERS: N,
    DASHBOARDS: L,
    AUDIT_LOGS: N,
    CLIENTS: N,
    AI_PLATFORM: N,
  },
  'role-tech-specialist': {
    CRM_LEADS: N,
    CRM_DEALS: N,
    ORDERS: N,
    FINANCE_INVOICES: N,
    FINANCE_PAYMENTS: N,
    FINANCE_SUBSCRIPTIONS: N,
    FINANCE_EXPENSES: L,
    FINANCE_EXPENSE_PLANS: L,
    FINANCE_CLIENT_SERVICES: N,
    FINANCE_BONUSES: N,
    FINANCE_SALARY: N,
    PROJECTS: L,
    TASKS: L,
    SUPPORT_TICKETS: L,
    CREDENTIALS: ['OWN', 'ALL', 'ALL', 'OWN'],
    DRIVE: L,
    DOCUMENTS: F,
    MESSENGER: L,
    MAIL: L,
    CALENDAR: L,
    COMPANY: R,
    PARTNERS: N,
    DASHBOARDS: L,
    AUDIT_LOGS: N,
  },
  'role-finance-director': {
    CRM_LEADS: N,
    // Read-only: the deal card opens from an invoice or order, where the amount, payment type and
    // contract are the invoice's own context. Writes stay with sales.
    CRM_DEALS: R,
    ORDERS: F,
    FINANCE_INVOICES: F,
    FINANCE_PAYMENTS: F,
    FINANCE_SUBSCRIPTIONS: F,
    FINANCE_EXPENSES: F,
    FINANCE_EXPENSE_PLANS: F,
    // Full level, matching FINANCE_INVOICES / FINANCE_EXPENSES. Head of Sales is not granted.
    FINANCE_CLIENT_SERVICES: F,
    FINANCE_BONUSES: F,
    FINANCE_SALARY: F,
    PROJECTS: R,
    TASKS: N,
    SUPPORT_TICKETS: N,
    CREDENTIALS: L,
    DRIVE: L,
    DOCUMENTS: R,
    MESSENGER: N,
    MAIL: N,
    CALENDAR: F,
    COMPANY: F,
    PARTNERS: F,
    DASHBOARDS: F,
    AUDIT_LOGS: R,
    CLIENTS: VA,
    AI_PLATFORM: N,
  },
  'role-marketing': {
    CRM_LEADS: R,
    CRM_DEALS: L,
    ORDERS: N,
    FINANCE_INVOICES: N,
    FINANCE_PAYMENTS: N,
    FINANCE_SUBSCRIPTIONS: N,
    FINANCE_EXPENSES: N,
    FINANCE_EXPENSE_PLANS: N,
    FINANCE_CLIENT_SERVICES: N,
    FINANCE_BONUSES: N,
    FINANCE_SALARY: N,
    PROJECTS: N,
    TASKS: N,
    SUPPORT_TICKETS: N,
    CREDENTIALS: L,
    DRIVE: L,
    DOCUMENTS: F,
    MESSENGER: L,
    MAIL: L,
    CALENDAR: L,
    COMPANY: R,
    PARTNERS: N,
    DASHBOARDS: D,
    AUDIT_LOGS: N,
    CLIENTS: VA,
    AI_PLATFORM: N,
  },
  'role-head-sales': {
    CRM_LEADS: F,
    CRM_DEALS: F,
    ORDERS: R,
    FINANCE_INVOICES: LA,
    FINANCE_PAYMENTS: R,
    FINANCE_SUBSCRIPTIONS: L,
    FINANCE_EXPENSES: N,
    FINANCE_EXPENSE_PLANS: N,
    FINANCE_CLIENT_SERVICES: N,
    FINANCE_BONUSES: R,
    FINANCE_SALARY: N,
    PROJECTS: N,
    TASKS: N,
    SUPPORT_TICKETS: N,
    CREDENTIALS: L,
    DRIVE: L,
    DOCUMENTS: F,
    MESSENGER: F,
    MAIL: F,
    CALENDAR: F,
    CALLS: R,
    COMPANY: R,
    PARTNERS: F,
    DASHBOARDS: D,
    AUDIT_LOGS: N,
    CLIENTS: VA,
    AI_PLATFORM: N,
  },
  'role-head-delivery': {
    CRM_LEADS: N,
    CRM_DEALS: L,
    ORDERS: L,
    FINANCE_INVOICES: R,
    FINANCE_PAYMENTS: N,
    FINANCE_SUBSCRIPTIONS: R,
    FINANCE_EXPENSES: N,
    FINANCE_EXPENSE_PLANS: N,
    FINANCE_CLIENT_SERVICES: N,
    FINANCE_BONUSES: R,
    FINANCE_SALARY: N,
    PROJECTS: F,
    TASKS: F,
    SUPPORT_TICKETS: F,
    CREDENTIALS: ['OWN', 'ALL', 'ALL', 'NONE'],
    DRIVE: F,
    DOCUMENTS: F,
    MESSENGER: F,
    MAIL: F,
    CALENDAR: F,
    COMPANY: R,
    PARTNERS: N,
    DASHBOARDS: D,
    AUDIT_LOGS: N,
    CLIENTS: VA,
    AI_PLATFORM: N,
  },
  'role-head-marketing': {
    CRM_LEADS: F,
    MARKETING: F,
    CRM_DEALS: D,
    ORDERS: N,
    FINANCE_INVOICES: VA_OWN,
    FINANCE_PAYMENTS: N,
    FINANCE_SUBSCRIPTIONS: N,
    FINANCE_EXPENSES: N,
    FINANCE_EXPENSE_PLANS: N,
    FINANCE_CLIENT_SERVICES: N,
    FINANCE_BONUSES: D,
    FINANCE_SALARY: N,
    PROJECTS: N,
    TASKS: L,
    SUPPORT_TICKETS: N,
    CREDENTIALS: L,
    DRIVE: D,
    DOCUMENTS: D,
    MESSENGER: D,
    MAIL: D,
    CALENDAR: F,
    COMPANY: R,
    PARTNERS: N,
    DASHBOARDS: D,
    AUDIT_LOGS: N,
    CLIENTS: VA,
    AI_PLATFORM: N,
  },
  'role-observer': {
    CRM_LEADS: N,
    CRM_DEALS: N,
    ORDERS: N,
    FINANCE_INVOICES: N,
    FINANCE_PAYMENTS: N,
    FINANCE_SUBSCRIPTIONS: N,
    FINANCE_EXPENSES: N,
    FINANCE_EXPENSE_PLANS: N,
    FINANCE_CLIENT_SERVICES: N,
    FINANCE_BONUSES: N,
    FINANCE_SALARY: N,
    PROJECTS: N,
    TASKS: L,
    SUPPORT_TICKETS: N,
    CREDENTIALS: ['OWN', 'OWN', 'OWN', 'OWN'],
    DRIVE: N,
    DOCUMENTS: R,
    MESSENGER: N,
    MAIL: N,
    CALENDAR: N,
    COMPANY: N,
    PARTNERS: N,
    DASHBOARDS: L,
    AUDIT_LOGS: N,
    CLIENTS: N,
    AI_PLATFORM: N,
  },
};

/**
 * `--roles=role-a,role-b` limits the run to those roles.
 *
 * Without it the seed resets and rewrites the grants of every role it owns, which silently
 * discards matrix edits an admin made in Settings -> Permissions / RBAC. Scoping the run is the
 * safe way to publish a newly added role against a database that has been tuned by hand.
 */
function parseRoleFilter(argv: readonly string[]): ReadonlySet<string> | null {
  const flag = argv.find((arg) => arg.startsWith('--roles='));
  if (!flag) return null;
  const ids = flag
    .slice('--roles='.length)
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  if (ids.length === 0) throw new Error('--roles was passed without any role id');
  const unknown = ids.filter((id) => !(id in ROLE_MATRIX));
  if (unknown.length > 0) throw new Error(`Unknown role ids: ${unknown.join(', ')}`);
  return new Set(ids);
}

async function main() {
  const prisma = createPrismaClient({ skipBudgetAssert: true, role: 'api' });

  const roleFilter = parseRoleFilter(process.argv.slice(2));
  const includeRole = (roleId: string): boolean => roleFilter === null || roleFilter.has(roleId);
  const roleMatrix: Record<string, MatrixEntry> = roleFilter
    ? Object.fromEntries(Object.entries(ROLE_MATRIX).filter(([roleId]) => includeRole(roleId)))
    : ROLE_MATRIX;

  console.log(
    roleFilter
      ? `Seeding RBAC permissions for ${[...roleFilter].join(', ')}...`
      : 'Seeding RBAC permissions...',
  );

  const permissionRecords: Array<{ id: string; module: string; action: string }> = [];
  for (const module of MODULES) {
    for (const action of ACTIONS) {
      const id = `perm-${module.toLowerCase().replace(/_/g, '-')}-${action.toLowerCase()}`;
      permissionRecords.push({ id, module, action });
    }
  }
  permissionRecords.push({
    id: 'perm-documents-view-activity',
    module: 'DOCUMENTS',
    action: 'VIEW_ACTIVITY',
  });
  permissionRecords.push({
    id: 'perm-documents-manage-sections',
    module: 'DOCUMENTS',
    action: 'MANAGE_SECTIONS',
  });
  permissionRecords.push({
    id: 'perm-documents-export',
    module: 'DOCUMENTS',
    action: 'EXPORT',
  });
  permissionRecords.push({
    id: 'perm-checklist-templates-publish',
    module: 'CHECKLIST_TEMPLATES',
    action: 'PUBLISH',
  });
  permissionRecords.push({
    id: 'perm-checklist-templates-archive',
    module: 'CHECKLIST_TEMPLATES',
    action: 'ARCHIVE',
  });
  permissionRecords.push({
    id: CRM_CALL_RECORDINGS_PLAY_PERMISSION_ID,
    module: CRM_CALL_RECORDINGS_MODULE,
    action: CRM_CALL_RECORDINGS_PLAY_ACTION,
  });
  permissionRecords.push({
    id: CALLS_PLAY_PERMISSION_ID,
    module: CALLS_MODULE,
    action: CALLS_PLAY_ACTION,
  });
  permissionRecords.push({
    id: MESSENGER_CLIENT_READ_PERMISSION_ID,
    module: MESSENGER_MODULE,
    action: MESSENGER_CLIENT_READ_ACTION,
  });
  permissionRecords.push({
    id: MESSENGER_CLIENT_SEND_PERMISSION_ID,
    module: MESSENGER_MODULE,
    action: MESSENGER_CLIENT_SEND_ACTION,
  });

  await prisma.permission.createMany({
    data: permissionRecords,
    skipDuplicates: true,
  });
  console.log(`  ✓ Permissions (${permissionRecords.length})`);

  const rolePermissionData: Array<{
    roleId: string;
    permissionId: string;
    scope: string;
  }> = [];

  for (const [roleId, moduleMap] of Object.entries(roleMatrix)) {
    for (const [module, scopes] of Object.entries(moduleMap)) {
      ACTIONS.forEach((action, idx) => {
        const scope = scopes[idx] ?? 'NONE';
        if (scope === 'NONE') return;
        const permId = `perm-${module.toLowerCase().replace(/_/g, '-')}-${action.toLowerCase()}`;
        rolePermissionData.push({ roleId, permissionId: permId, scope });
      });
    }
  }

  for (const [roleId, moduleMap] of Object.entries(roleMatrix)) {
    const docsScopes = moduleMap.DOCUMENTS;
    if (!docsScopes) continue;
    const viewScope = docsScopes[0];
    if (viewScope === 'NONE') continue;
    rolePermissionData.push({
      roleId,
      permissionId: 'perm-documents-view-activity',
      scope: viewScope,
    });
  }

  for (const [roleId, moduleMap] of Object.entries(roleMatrix)) {
    const docsScopes = moduleMap.DOCUMENTS;
    if (!docsScopes) continue;
    const editScope = docsScopes[1];
    if (editScope === 'NONE') continue;
    rolePermissionData.push({
      roleId,
      permissionId: 'perm-documents-manage-sections',
      scope: editScope,
    });
  }

  for (const [roleId, moduleMap] of Object.entries(roleMatrix)) {
    const docsScopes = moduleMap.DOCUMENTS;
    if (!docsScopes) continue;
    const editScope = docsScopes[1];
    if (editScope === 'NONE') continue;
    rolePermissionData.push({
      roleId,
      permissionId: 'perm-documents-export',
      scope: editScope,
    });
  }

  for (const [roleId, moduleMap] of Object.entries(roleMatrix)) {
    const company = moduleMap.COMPANY;
    const checklistScopes = moduleMap.CHECKLIST_TEMPLATES;
    if (!company) continue;
    const [viewScope, editScope, , addScope] = company;
    const checklistViewFromMatrix = checklistScopes?.[0] ?? 'NONE';

    if (viewScope !== 'NONE' && checklistViewFromMatrix === 'NONE') {
      rolePermissionData.push({
        roleId,
        permissionId: 'perm-checklist-templates-view',
        scope: viewScope,
      });
    }

    const writeScope = editScope !== 'NONE' ? editScope : addScope;
    if (writeScope === 'NONE') continue;

    const hasChecklistCrudFromMatrix =
      checklistScopes !== undefined &&
      (checklistScopes[1] !== 'NONE' || checklistScopes[2] !== 'NONE');

    const checklistCompanyActions: ('add' | 'edit' | 'publish' | 'archive')[] =
      hasChecklistCrudFromMatrix ? ['publish', 'archive'] : ['add', 'edit', 'publish', 'archive'];

    for (const action of checklistCompanyActions) {
      rolePermissionData.push({
        roleId,
        permissionId: `perm-checklist-templates-${action}`,
        scope: writeScope,
      });
    }
  }

  for (const roleId of CRM_CALL_RECORDINGS_PLAY_DEFAULT_ROLE_IDS.filter(includeRole)) {
    rolePermissionData.push({
      roleId,
      permissionId: CRM_CALL_RECORDINGS_PLAY_PERMISSION_ID,
      scope: CRM_CALL_RECORDINGS_PLAY_DEFAULT_SCOPE,
    });
  }

  for (const roleId of CALLS_PLAY_DEFAULT_ROLE_IDS.filter(includeRole)) {
    rolePermissionData.push({
      roleId,
      permissionId: CALLS_PLAY_PERMISSION_ID,
      scope: CALLS_PLAY_DEFAULT_SCOPE,
    });
  }

  for (const roleId of MESSENGER_CLIENT_CAPABILITY_ALL_ROLE_IDS.filter(includeRole)) {
    rolePermissionData.push({
      roleId,
      permissionId: MESSENGER_CLIENT_READ_PERMISSION_ID,
      scope: 'ALL',
    });
    rolePermissionData.push({
      roleId,
      permissionId: MESSENGER_CLIENT_SEND_PERMISSION_ID,
      scope: 'ALL',
    });
  }

  for (const roleId of MESSENGER_CLIENT_CAPABILITY_OWN_ROLE_IDS.filter(includeRole)) {
    rolePermissionData.push({
      roleId,
      permissionId: MESSENGER_CLIENT_READ_PERMISSION_ID,
      scope: 'OWN',
    });
    rolePermissionData.push({
      roleId,
      permissionId: MESSENGER_CLIENT_SEND_PERMISSION_ID,
      scope: 'OWN',
    });
  }

  // Reset only the roles this seed owns. A blanket deleteMany would also wipe the grants of
  // roles an admin created in Settings -> Permissions / RBAC, leaving them silently powerless.
  const seededRoleIds = [...new Set(rolePermissionData.map((row) => row.roleId))];
  await prisma.rolePermission.deleteMany({ where: { roleId: { in: seededRoleIds } } });
  await prisma.rolePermission.createMany({
    data: rolePermissionData,
    skipDuplicates: true,
  });
  console.log(`  ✓ RolePermissions (${rolePermissionData.length})`);

  // Global cleanup, not tied to any single role, so a scoped run leaves it alone.
  if (roleFilter === null) {
    await prisma.rolePermission.deleteMany({
      where: { permissionId: 'perm-credentials-bypass-row-visibility' },
    });
    await prisma.permission.deleteMany({
      where: { id: 'perm-credentials-bypass-row-visibility' },
    });
    await prisma.role.updateMany({
      where: { OR: [{ slug: 'owner' }, { id: 'role-owner' }] },
      data: { assignable: false },
    });
  }

  for (const roleId of GLOBAL_OPERATIONAL_ROLE_IDS.filter(includeRole)) {
    for (const family of PLATFORM_RESOURCE_FAMILIES) {
      const scopeMode = family === 'CREDENTIALS' ? 'ASSIGNED' : 'ALL';
      await prisma.roleAccessPolicy.upsert({
        where: {
          roleId_resourceFamily: {
            roleId,
            resourceFamily: family as PlatformResourceFamilyEnum,
          },
        },
        create: {
          roleId,
          resourceFamily: family as PlatformResourceFamilyEnum,
          defaultLevel: 'VIEW',
          scopeMode,
        },
        update: {
          scopeMode,
        },
      });
    }
  }
  if (GLOBAL_OPERATIONAL_ROLE_IDS.some(includeRole)) {
    console.log(
      `  ✓ RoleAccessPolicy (ceo/legacy-owner operational ALL, credentials ASSIGNED × ${PLATFORM_RESOURCE_FAMILIES.length} families)`,
    );
  }

  console.log('\n✅ RBAC seed completed!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('RBAC seed failed:', e);
  process.exit(1);
});
