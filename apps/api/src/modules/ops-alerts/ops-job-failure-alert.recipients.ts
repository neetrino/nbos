import type { PrismaClient } from '@nbos/database';
import { CEO_ROLE_SLUG, PLATFORM_OWNERSHIP_SINGLETON_ID } from '@nbos/shared';
import { OPS_ALERT_RECIPIENT_STATUSES } from './ops-job-failure-alert.constants';

type OpsAlertPrisma = Pick<InstanceType<typeof PrismaClient>, 'employee' | 'platformOwnership'>;

/**
 * Founder (PlatformOwnership) and CEO (role slug) as separate people.
 */
export async function resolveOpsAlertRecipientIds(prisma: OpsAlertPrisma): Promise<string[]> {
  const ids = new Set<string>();
  const ownership = await prisma.platformOwnership.findUnique({
    where: { id: PLATFORM_OWNERSHIP_SINGLETON_ID },
    select: { ownerEmployeeId: true },
  });
  if (ownership?.ownerEmployeeId) {
    const founder = await prisma.employee.findUnique({
      where: { id: ownership.ownerEmployeeId },
      select: { id: true, status: true },
    });
    if (founder && isAlertableStatus(founder.status)) ids.add(founder.id);
  }
  const ceos = await prisma.employee.findMany({
    where: {
      status: { in: [...OPS_ALERT_RECIPIENT_STATUSES] },
      role: { slug: CEO_ROLE_SLUG },
    },
    select: { id: true },
  });
  for (const row of ceos) ids.add(row.id);
  return [...ids];
}

function isAlertableStatus(status: string): boolean {
  return (OPS_ALERT_RECIPIENT_STATUSES as readonly string[]).includes(status);
}
