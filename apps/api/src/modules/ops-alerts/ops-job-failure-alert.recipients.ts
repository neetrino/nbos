import type { PrismaClient } from '@nbos/database';
import {
  OPS_ALERT_RECIPIENT_ROLE_SLUGS,
  OPS_ALERT_RECIPIENT_STATUSES,
} from './ops-job-failure-alert.constants';

type OpsAlertPrisma = Pick<InstanceType<typeof PrismaClient>, 'employee'>;

/**
 * Active Owner and CEO seats as separate people.
 * Do not treat Owner as CEO (platform-owner security).
 */
export async function resolveOpsAlertRecipientIds(prisma: OpsAlertPrisma): Promise<string[]> {
  const rows = await prisma.employee.findMany({
    where: {
      status: { in: [...OPS_ALERT_RECIPIENT_STATUSES] },
      role: { slug: { in: [...OPS_ALERT_RECIPIENT_ROLE_SLUGS] } },
    },
    select: { id: true },
  });
  return [...new Set(rows.map((row) => row.id))];
}
