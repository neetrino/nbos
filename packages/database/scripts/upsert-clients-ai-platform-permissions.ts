/**
 * Additive RBAC upsert for CLIENTS and AI_PLATFORM modules.
 * Does not delete existing role_permissions — safe for dev DBs with custom grants.
 *
 * Run: pnpm --filter @nbos/database exec tsx scripts/upsert-clients-ai-platform-permissions.ts
 */
import { createPrismaClient } from '../src/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const ACTIONS = ['VIEW', 'EDIT', 'ADD', 'DELETE'] as const;
const NEW_MODULES = ['CLIENTS', 'AI_PLATFORM'] as const;

type Scope = 'NONE' | 'OWN' | 'DEPARTMENT' | 'ALL';
type MatrixEntry = Record<string, [Scope, Scope, Scope, Scope]>;

const F: [Scope, Scope, Scope, Scope] = ['ALL', 'ALL', 'ALL', 'ALL'];
const R: [Scope, Scope, Scope, Scope] = ['ALL', 'NONE', 'NONE', 'NONE'];
const N: [Scope, Scope, Scope, Scope] = ['NONE', 'NONE', 'NONE', 'NONE'];
const VA: [Scope, Scope, Scope, Scope] = ['ALL', 'NONE', 'ALL', 'NONE'];

const CLIENTS_AI_MATRIX: Record<string, MatrixEntry> = {
  'role-owner': { CLIENTS: F, AI_PLATFORM: F },
  'role-ceo': { CLIENTS: F, AI_PLATFORM: F },
  'role-seller': { CLIENTS: VA, AI_PLATFORM: N },
  'role-pm': { CLIENTS: R, AI_PLATFORM: N },
  'role-developer': { CLIENTS: N, AI_PLATFORM: N },
  'role-developer-frontend': { CLIENTS: N, AI_PLATFORM: N },
  'role-junior-developer': { CLIENTS: N, AI_PLATFORM: N },
  'role-designer': { CLIENTS: N, AI_PLATFORM: N },
  'role-qa': { CLIENTS: N, AI_PLATFORM: N },
  'role-tech-specialist': { CLIENTS: N, AI_PLATFORM: N },
  'role-finance-director': { CLIENTS: R, AI_PLATFORM: N },
  'role-marketing': { CLIENTS: R, AI_PLATFORM: N },
  'role-head-sales': { CLIENTS: VA, AI_PLATFORM: N },
  'role-head-delivery': { CLIENTS: R, AI_PLATFORM: N },
  'role-head-marketing': { CLIENTS: R, AI_PLATFORM: N },
  'role-observer': { CLIENTS: N, AI_PLATFORM: N },
};

function permissionId(module: string, action: string): string {
  return `perm-${module.toLowerCase().replace(/_/g, '-')}-${action.toLowerCase()}`;
}

async function main(): Promise<void> {
  const prisma = createPrismaClient({ skipBudgetAssert: true, role: 'api' });

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

  let upserted = 0;
  await prisma.$transaction(async (tx) => {
    for (const [roleId, moduleMap] of Object.entries(CLIENTS_AI_MATRIX)) {
      for (const module of NEW_MODULES) {
        const scopes = moduleMap[module];
        if (!scopes) continue;

        for (let idx = 0; idx < ACTIONS.length; idx += 1) {
          const action = ACTIONS[idx];
          const scope = scopes[idx] ?? 'NONE';
          if (scope === 'NONE') continue;

          await tx.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId,
                permissionId: permissionId(module, action),
              },
            },
            create: {
              roleId,
              permissionId: permissionId(module, action),
              scope,
            },
            update: { scope },
          });
          upserted += 1;
        }
      }
    }
  });

  console.log(`Upserted ${upserted} role_permissions for CLIENTS and AI_PLATFORM`);
  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
