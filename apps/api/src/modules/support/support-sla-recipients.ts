import type { PrismaClient } from '@nbos/database';

/**
 * Resolves in-app notification recipients for Support SLA / escalation signals.
 * — assignee (if any)
 * — active employees whose role has SUPPORT_TICKETS:VIEW scope ALL (Support lead / PM / owner tier)
 */
export async function resolveSupportSlaNotificationRecipientIds(
  prisma: InstanceType<typeof PrismaClient>,
  assignedTo: string | null,
): Promise<string[]> {
  const ids = new Set<string>();
  if (assignedTo) ids.add(assignedTo);

  const withGlobalSupportView = await prisma.employee.findMany({
    where: {
      status: { not: 'TERMINATED' },
      role: {
        permissions: {
          some: {
            scope: 'ALL',
            permission: { module: 'SUPPORT_TICKETS', action: 'VIEW' },
          },
        },
      },
    },
    select: { id: true },
  });

  for (const row of withGlobalSupportView) ids.add(row.id);
  return [...ids];
}
