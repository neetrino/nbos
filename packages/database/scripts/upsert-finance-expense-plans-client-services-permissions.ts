/**
 * Additive RBAC upsert for FINANCE_EXPENSE_PLANS and FINANCE_CLIENT_SERVICES.
 * Prefer migration `20260916180000_finance_expense_plans_client_services_permissions`
 * (`pnpm db:migrate:deploy` / `pnpm db:migrate:prod`). This script is only for a DB
 * that already applied later migrations and still lacks these rows.
 *
 * Does not delete existing role_permissions and never overwrites a scope an
 * administrator has already configured — safe for dev DBs with custom grants.
 *
 * Run: pnpm --filter @nbos/database exec tsx scripts/upsert-finance-expense-plans-client-services-permissions.ts
 */
import { FINANCE_CLIENT_SERVICES_MODULE, FINANCE_EXPENSE_PLANS_MODULE } from '@nbos/shared';
import { createPrismaClient } from '../src/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const ACTIONS = ['VIEW', 'EDIT', 'ADD', 'DELETE'] as const;

type Scope = 'NONE' | 'OWN' | 'DEPARTMENT' | 'ALL';
type MatrixRow = [Scope, Scope, Scope, Scope];
type Db = ReturnType<typeof createPrismaClient>;

const F: MatrixRow = ['ALL', 'ALL', 'ALL', 'ALL'];
const L: MatrixRow = ['OWN', 'OWN', 'NONE', 'NONE'];
const N: MatrixRow = ['NONE', 'NONE', 'NONE', 'NONE'];

const NEW_MODULES = [FINANCE_EXPENSE_PLANS_MODULE, FINANCE_CLIENT_SERVICES_MODULE] as const;
type NewModule = (typeof NEW_MODULES)[number];
type ModuleMap = Record<NewModule, MatrixRow>;

const ROLE_MATRIX: Record<string, ModuleMap> = {
  'role-owner': { FINANCE_EXPENSE_PLANS: F, FINANCE_CLIENT_SERVICES: F },
  'role-ceo': { FINANCE_EXPENSE_PLANS: F, FINANCE_CLIENT_SERVICES: F },
  'role-finance-director': { FINANCE_EXPENSE_PLANS: F, FINANCE_CLIENT_SERVICES: F },
  'role-accountant': { FINANCE_EXPENSE_PLANS: F, FINANCE_CLIENT_SERVICES: N },
  'role-tech-specialist': { FINANCE_EXPENSE_PLANS: L, FINANCE_CLIENT_SERVICES: N },
  'role-operations-manager': { FINANCE_EXPENSE_PLANS: L, FINANCE_CLIENT_SERVICES: N },
};

function permissionId(module: string, action: string): string {
  return `perm-${module.toLowerCase().replace(/_/g, '-')}-${action.toLowerCase()}`;
}

async function upsertPermissionRows(prisma: Db): Promise<void> {
  for (const module of NEW_MODULES) {
    for (const action of ACTIONS) {
      const id = permissionId(module, action);
      await prisma.permission.upsert({
        where: { id },
        create: { id, module, action },
        update: { module, action },
      });
    }
  }
}

async function createMissingGrantsForRole(
  prisma: Db,
  roleId: string,
  moduleMap: ModuleMap,
): Promise<number> {
  let created = 0;
  for (const module of NEW_MODULES) {
    const scopes = moduleMap[module];
    for (let idx = 0; idx < ACTIONS.length; idx += 1) {
      const action = ACTIONS[idx];
      const scope = scopes[idx] ?? 'NONE';
      if (!action || scope === 'NONE') continue;
      const permId = permissionId(module, action);
      const existing = await prisma.rolePermission.findUnique({
        where: { roleId_permissionId: { roleId, permissionId: permId } },
      });
      if (existing) continue;
      await prisma.rolePermission.create({
        data: { roleId, permissionId: permId, scope },
      });
      created += 1;
    }
  }
  return created;
}

async function createMissingGrants(prisma: Db, existingRoleIds: Set<string>): Promise<number> {
  let created = 0;
  for (const [roleId, moduleMap] of Object.entries(ROLE_MATRIX)) {
    if (!existingRoleIds.has(roleId)) continue;
    created += await createMissingGrantsForRole(prisma, roleId, moduleMap);
  }
  return created;
}

async function main(): Promise<void> {
  const prisma = createPrismaClient({ skipBudgetAssert: true, role: 'api' });

  await upsertPermissionRows(prisma);

  const existingRoleIds = new Set(
    (
      await prisma.role.findMany({
        where: { id: { in: Object.keys(ROLE_MATRIX) } },
        select: { id: true },
      })
    ).map((role) => role.id),
  );

  const created = await createMissingGrants(prisma, existingRoleIds);

  console.log(
    `Created ${created} role_permissions for FINANCE_EXPENSE_PLANS and FINANCE_CLIENT_SERVICES`,
  );
  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
