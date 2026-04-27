import { createPrismaClient } from '../src/client';
import dotenv from 'dotenv';
import path from 'path';

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
  'MESSENGER',
  'CALENDAR',
  'COMPANY',
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
    MESSENGER: L,
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
    MESSENGER: F,
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
    MESSENGER: L,
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
    MESSENGER: L,
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
    MESSENGER: L,
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
    MESSENGER: L,
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
    MESSENGER: L,
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
    MESSENGER: N,
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
    MESSENGER: L,
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
    MESSENGER: F,
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
    MESSENGER: F,
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
    MESSENGER: D,
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
    MESSENGER: N,
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

  await prisma.rolePermission.deleteMany({});
  await prisma.rolePermission.createMany({ data: rolePermissionData });
  console.log(`  ✓ RolePermissions (${rolePermissionData.length})`);

  console.log('\n✅ RBAC seed completed!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('RBAC seed failed:', e);
  process.exit(1);
});
