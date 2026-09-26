/**
 * Additive RBAC upsert for VIDEO_MEETINGS.
 * Prefer the migration that creates permission rows; this script is for a DB that
 * already applied later migrations and still lacks these grants.
 *
 * Default matrix beyond Owner/CEO is a DECISION still open for Product+Security —
 * this script grants Owner/CEO only and never overwrites an existing scope.
 *
 * Run: pnpm --filter @nbos/database exec tsx scripts/upsert-video-meetings-permissions.ts
 */
import { VIDEO_MEETINGS_DEFAULT_ROLE_IDS, VIDEO_MEETINGS_MODULE } from '@nbos/shared';
import { createPrismaClient } from '../src/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const ACTIONS = ['VIEW', 'EDIT', 'ADD', 'DELETE'] as const;
type Db = ReturnType<typeof createPrismaClient>;

function permissionId(action: (typeof ACTIONS)[number]): string {
  return `perm-video-meetings-${action.toLowerCase()}`;
}

async function upsertPermissionRows(prisma: Db): Promise<void> {
  for (const action of ACTIONS) {
    const id = permissionId(action);
    await prisma.permission.upsert({
      where: { id },
      create: {
        id,
        module: VIDEO_MEETINGS_MODULE,
        action,
        description: `Video Meetings ${action}`,
      },
      update: { module: VIDEO_MEETINGS_MODULE, action },
    });
  }
}

async function createMissingOwnerCeoGrants(prisma: Db): Promise<number> {
  const roles = await prisma.role.findMany({
    where: { id: { in: [...VIDEO_MEETINGS_DEFAULT_ROLE_IDS] } },
    select: { id: true },
  });
  let created = 0;
  for (const role of roles) {
    for (const action of ACTIONS) {
      const permId = permissionId(action);
      const existing = await prisma.rolePermission.findUnique({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permId } },
      });
      if (existing) continue;
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: permId, scope: 'ALL' },
      });
      created += 1;
    }
  }
  return created;
}

async function main(): Promise<void> {
  const prisma = createPrismaClient({ skipBudgetAssert: true, role: 'api' });
  await upsertPermissionRows(prisma);
  const created = await createMissingOwnerCeoGrants(prisma);
  console.log(
    `VIDEO_MEETINGS permissions upserted; created ${created} Owner/CEO role_permissions (DECISION: wider matrix open)`,
  );
  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
