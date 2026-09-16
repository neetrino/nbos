/**
 * Additive RBAC upsert for the CALLS journal module.
 * Prefer migration `20260916120000_calls_permissions` (`pnpm db:migrate:deploy` /
 * `pnpm db:migrate:prod`). This script is only for a DB that already applied later
 * migrations and still lacks CALLS rows.
 *
 * Does not delete existing role_permissions — safe for dev DBs with custom grants.
 *
 * Run: pnpm --filter @nbos/database exec tsx scripts/upsert-calls-permissions.ts
 */
import {
  CALLS_MODULE,
  CALLS_PLAY_ACTION,
  CALLS_PLAY_DEFAULT_ROLE_IDS,
  CALLS_PLAY_DEFAULT_SCOPE,
  CALLS_PLAY_PERMISSION_ID,
} from '@nbos/shared';
import { createPrismaClient } from '../src/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const ACTIONS = ['VIEW', 'EDIT', 'ADD', 'DELETE'] as const;

type Scope = 'NONE' | 'OWN' | 'DEPARTMENT' | 'ALL';
type MatrixRow = [Scope, Scope, Scope, Scope];

const R: MatrixRow = ['ALL', 'NONE', 'NONE', 'NONE'];
const F: MatrixRow = ['ALL', 'ALL', 'ALL', 'ALL'];
const VO: MatrixRow = ['OWN', 'NONE', 'NONE', 'NONE'];

const CALLS_VIEW_MATRIX: Record<string, MatrixRow> = {
  'role-owner': F,
  'role-ceo': F,
  'role-seller': VO,
  'role-head-sales': R,
};

function permissionId(action: string): string {
  return `perm-calls-${action.toLowerCase()}`;
}

async function main(): Promise<void> {
  const prisma = createPrismaClient({ skipBudgetAssert: true, role: 'api' });

  for (const action of ACTIONS) {
    const id = permissionId(action);
    await prisma.permission.upsert({
      where: { id },
      create: { id, module: CALLS_MODULE, action },
      update: { module: CALLS_MODULE, action },
    });
  }

  await prisma.permission.upsert({
    where: { id: CALLS_PLAY_PERMISSION_ID },
    create: {
      id: CALLS_PLAY_PERMISSION_ID,
      module: CALLS_MODULE,
      action: CALLS_PLAY_ACTION,
    },
    update: { module: CALLS_MODULE, action: CALLS_PLAY_ACTION },
  });

  const existingRoleIds = new Set(
    (
      await prisma.role.findMany({
        where: { id: { in: [...Object.keys(CALLS_VIEW_MATRIX), ...CALLS_PLAY_DEFAULT_ROLE_IDS] } },
        select: { id: true },
      })
    ).map((role) => role.id),
  );

  let upserted = 0;
  await prisma.$transaction(async (tx) => {
    for (const [roleId, scopes] of Object.entries(CALLS_VIEW_MATRIX)) {
      if (!existingRoleIds.has(roleId)) continue;
      for (let idx = 0; idx < ACTIONS.length; idx += 1) {
        const action = ACTIONS[idx];
        const scope = scopes[idx] ?? 'NONE';
        if (scope === 'NONE') continue;
        await tx.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId, permissionId: permissionId(action) },
          },
          create: { roleId, permissionId: permissionId(action), scope },
          update: { scope },
        });
        upserted += 1;
      }
    }

    for (const roleId of CALLS_PLAY_DEFAULT_ROLE_IDS) {
      if (!existingRoleIds.has(roleId)) continue;
      await tx.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId: CALLS_PLAY_PERMISSION_ID },
        },
        create: {
          roleId,
          permissionId: CALLS_PLAY_PERMISSION_ID,
          scope: CALLS_PLAY_DEFAULT_SCOPE,
        },
        update: { scope: CALLS_PLAY_DEFAULT_SCOPE },
      });
      upserted += 1;
    }
  });

  console.log(`Upserted ${upserted} role_permissions for CALLS`);
  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
