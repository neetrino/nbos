import { createPrismaClient } from '../src/client';
import { PLATFORM_RESOURCE_FAMILIES } from '@nbos/shared';
import type { PlatformResourceFamilyEnum } from '@nbos/database';
import dotenv from 'dotenv';
import path from 'path';

const GLOBAL_OWNER_ROLE_IDS = ['role-owner', 'role-ceo'] as const;

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const MODULES = [
  'CRM_LEADS',
  'CRM_DEALS',
  'ORDERS',
  'FINANCE_INVOICES',
  'FINANCE_PAYMENTS',
  'FINANCE_SUBSCRIPTIONS',
  'FINANCE_EXPENSES',
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
  'COMPANY',
  'CHECKLIST_TEMPLATES',
  'PARTNERS',
  'DASHBOARDS',
  'AUDIT_LOGS',
] as const;

const ACTIONS = ['VIEW', 'EDIT', 'ADD', 'DELETE'] as const;

type Scope = 'NONE' | 'OWN' | 'DEPARTMENT' | 'ALL';

/**
 * Maps the access matrix from docs/NBOS/04-Roles-and-Access/02-Access-Matrix.md
 * ✅ Full   -> VIEW:ALL, EDIT:ALL, ADD:ALL, DELETE:ALL
 * 👁 Read   -> VIEW:ALL
 * 🔶 Limited -> VIEW:OWN, EDIT:OWN
 * ❌ None   -> all NONE
 */
type MatrixEntry = Record<string, [Scope, Scope, Scope, Scope]>; // [VIEW, EDIT, ADD, DELETE]

const F: [Scope, Scope, Scope, Scope] = ['ALL', 'ALL', 'ALL', 'ALL'];
const R: [Scope, Scope, Scope, Scope] = ['ALL', 'NONE', 'NONE', 'NONE'];
const L: [Scope, Scope, Scope, Scope] = ['OWN', 'OWN', 'NONE', 'NONE'];
const D: [Scope, Scope, Scope, Scope] = ['DEPARTMENT', 'DEPARTMENT', 'DEPARTMENT', 'NONE'];
const N: [Scope, Scope, Scope, Scope] = ['NONE', 'NONE', 'NONE', 'NONE'];

const ROLE_MATRIX: Record<string, MatrixEntry> = {
  'role-owner': Object.fromEntries(MODULES.map((m) => [m, F])),
  'role-ceo': Object.fromEntries(MODULES.map((m) => [m, F])),
  'role-seller': {
    CRM_LEADS: F,
    CRM_DEALS: F,
    ORDERS: R,
    FINANCE_INVOICES: L,
    FINANCE_PAYMENTS: N,
    FINANCE_SUBSCRIPTIONS: L,
    FINANCE_EXPENSES: N,
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
    COMPANY: R,
    PARTNERS: L,
    DASHBOARDS: L,
    AUDIT_LOGS: N,
  },
  'role-pm': {
    CRM_LEADS: N,
    CRM_DEALS: L,
    ORDERS: L,
    FINANCE_INVOICES: R,
    FINANCE_PAYMENTS: N,
    FINANCE_SUBSCRIPTIONS: R,
    FINANCE_EXPENSES: N,
    FINANCE_BONUSES: L,
    FINANCE_SALARY: N,
    PROJECTS: F,
    TASKS: F,
    SUPPORT_TICKETS: F,
    CREDENTIALS: ['ALL', 'OWN', 'ALL', 'NONE'],
    DRIVE: F,
    DOCUMENTS: F,
    MESSENGER: F,
    MAIL: F,
    CALENDAR: F,
    COMPANY: R,
    PARTNERS: N,
    DASHBOARDS: D,
    AUDIT_LOGS: N,
  },
  'role-developer': {
    CRM_LEADS: N,
    CRM_DEALS: N,
    ORDERS: N,
    FINANCE_INVOICES: N,
    FINANCE_PAYMENTS: N,
    FINANCE_SUBSCRIPTIONS: N,
    FINANCE_EXPENSES: N,
    FINANCE_BONUSES: L,
    FINANCE_SALARY: N,
    PROJECTS: L,
    TASKS: L,
    SUPPORT_TICKETS: L,
    CREDENTIALS: L,
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
  'role-junior-developer': {
    CRM_LEADS: N,
    CRM_DEALS: N,
    ORDERS: N,
    FINANCE_INVOICES: N,
    FINANCE_PAYMENTS: N,
    FINANCE_SUBSCRIPTIONS: N,
    FINANCE_EXPENSES: N,
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
  },
  'role-designer': {
    CRM_LEADS: N,
    CRM_DEALS: N,
    ORDERS: N,
    FINANCE_INVOICES: N,
    FINANCE_PAYMENTS: N,
    FINANCE_SUBSCRIPTIONS: N,
    FINANCE_EXPENSES: N,
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
  },
  'role-qa': {
    CRM_LEADS: N,
    CRM_DEALS: N,
    ORDERS: N,
    FINANCE_INVOICES: N,
    FINANCE_PAYMENTS: N,
    FINANCE_SUBSCRIPTIONS: N,
    FINANCE_EXPENSES: N,
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
  },
  'role-tech-specialist': {
    CRM_LEADS: N,
    CRM_DEALS: N,
    ORDERS: N,
    FINANCE_INVOICES: N,
    FINANCE_PAYMENTS: N,
    FINANCE_SUBSCRIPTIONS: N,
    FINANCE_EXPENSES: L,
    FINANCE_BONUSES: N,
    FINANCE_SALARY: N,
    PROJECTS: L,
    TASKS: L,
    SUPPORT_TICKETS: L,
    CREDENTIALS: ['ALL', 'ALL', 'ALL', 'OWN'],
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
    CRM_DEALS: N,
    ORDERS: F,
    FINANCE_INVOICES: F,
    FINANCE_PAYMENTS: F,
    FINANCE_SUBSCRIPTIONS: F,
    FINANCE_EXPENSES: F,
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
  },
  'role-marketing': {
    CRM_LEADS: R,
    CRM_DEALS: L,
    ORDERS: N,
    FINANCE_INVOICES: N,
    FINANCE_PAYMENTS: N,
    FINANCE_SUBSCRIPTIONS: N,
    FINANCE_EXPENSES: N,
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
  },
  'role-head-sales': {
    CRM_LEADS: F,
    CRM_DEALS: F,
    ORDERS: R,
    FINANCE_INVOICES: L,
    FINANCE_PAYMENTS: R,
    FINANCE_SUBSCRIPTIONS: L,
    FINANCE_EXPENSES: N,
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
    COMPANY: R,
    PARTNERS: F,
    DASHBOARDS: D,
    AUDIT_LOGS: N,
  },
  'role-head-delivery': {
    CRM_LEADS: N,
    CRM_DEALS: L,
    ORDERS: L,
    FINANCE_INVOICES: R,
    FINANCE_PAYMENTS: N,
    FINANCE_SUBSCRIPTIONS: R,
    FINANCE_EXPENSES: N,
    FINANCE_BONUSES: R,
    FINANCE_SALARY: N,
    PROJECTS: F,
    TASKS: F,
    SUPPORT_TICKETS: F,
    CREDENTIALS: ['ALL', 'ALL', 'ALL', 'NONE'],
    DRIVE: F,
    DOCUMENTS: F,
    MESSENGER: F,
    MAIL: F,
    CALENDAR: F,
    COMPANY: R,
    PARTNERS: N,
    DASHBOARDS: D,
    AUDIT_LOGS: N,
  },
  'role-head-marketing': {
    CRM_LEADS: F,
    CRM_DEALS: D,
    ORDERS: N,
    FINANCE_INVOICES: N,
    FINANCE_PAYMENTS: N,
    FINANCE_SUBSCRIPTIONS: N,
    FINANCE_EXPENSES: N,
    FINANCE_BONUSES: D,
    FINANCE_SALARY: N,
    PROJECTS: N,
    TASKS: N,
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
  },
  'role-observer': {
    CRM_LEADS: N,
    CRM_DEALS: N,
    ORDERS: N,
    FINANCE_INVOICES: N,
    FINANCE_PAYMENTS: N,
    FINANCE_SUBSCRIPTIONS: N,
    FINANCE_EXPENSES: N,
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
    DASHBOARDS: N,
    AUDIT_LOGS: N,
  },
};

async function main() {
  const prisma = createPrismaClient();

  console.log('Seeding RBAC permissions...');

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

  for (const [roleId, moduleMap] of Object.entries(ROLE_MATRIX)) {
    for (const [module, scopes] of Object.entries(moduleMap)) {
      ACTIONS.forEach((action, idx) => {
        const scope = scopes[idx] ?? 'NONE';
        if (scope === 'NONE') return;
        const permId = `perm-${module.toLowerCase().replace(/_/g, '-')}-${action.toLowerCase()}`;
        rolePermissionData.push({ roleId, permissionId: permId, scope });
      });
    }
  }

  for (const [roleId, moduleMap] of Object.entries(ROLE_MATRIX)) {
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

  for (const [roleId, moduleMap] of Object.entries(ROLE_MATRIX)) {
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

  for (const [roleId, moduleMap] of Object.entries(ROLE_MATRIX)) {
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

  for (const [roleId, moduleMap] of Object.entries(ROLE_MATRIX)) {
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

  await prisma.rolePermission.deleteMany({});
  await prisma.rolePermission.createMany({
    data: rolePermissionData,
    skipDuplicates: true,
  });
  console.log(`  ✓ RolePermissions (${rolePermissionData.length})`);

  for (const roleId of GLOBAL_OWNER_ROLE_IDS) {
    for (const family of PLATFORM_RESOURCE_FAMILIES) {
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
          scopeMode: 'ALL',
        },
        update: {
          scopeMode: 'ALL',
        },
      });
    }
  }
  console.log(`  ✓ RoleAccessPolicy (owner/ceo × ${PLATFORM_RESOURCE_FAMILIES.length} families)`);

  console.log('\n✅ RBAC seed completed!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('RBAC seed failed:', e);
  process.exit(1);
});
