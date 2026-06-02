import type { PrismaClient } from '@nbos/database';
import type { NotificationService } from '../notifications/notification.service';
import type { SensitiveField } from './credential-domain.types';

export async function notifyCredentialHighRiskRecipients(
  prisma: InstanceType<typeof PrismaClient>,
  notifications: NotificationService,
  params: {
    actorId: string;
    title: string;
    body: string;
    entityId: string;
    ownerId?: string | null;
    dedupeSuffix: string;
  },
): Promise<void> {
  const recipients = new Set<string>();
  if (params.ownerId) recipients.add(params.ownerId);

  const admins = await prisma.employee.findMany({
    where: { role: { slug: { in: ['ceo', 'admin'] } } },
    select: { id: true },
  });
  for (const admin of admins) recipients.add(admin.id);
  recipients.delete(params.actorId);

  await Promise.all(
    [...recipients].map((recipientId) =>
      notifications.create({
        type: 'credentials.high_risk_action',
        recipientId,
        title: params.title,
        body: params.body,
        entityType: 'credential',
        entityId: params.entityId,
        sourceModule: 'credentials',
        dedupeKey: `credentials.high_risk_action:${recipientId}:${params.dedupeSuffix}`,
      }),
    ),
  );
}

export async function notifyHighRiskCredentialAction(
  prisma: InstanceType<typeof PrismaClient>,
  notifications: NotificationService,
  row: { id: string; name?: string | null; ownerId?: string | null; criticality?: string | null },
  actorId: string,
  action: 'reveal' | 'copy',
  field: SensitiveField,
): Promise<void> {
  const isHighRisk = row.criticality === 'HIGH' || row.criticality === 'CRITICAL';
  if (!isHighRisk) return;
  await notifyCredentialHighRiskRecipients(prisma, notifications, {
    actorId,
    title: 'High-risk credential action',
    body: `${action.toUpperCase()} on ${field} for credential ${row.name ?? row.id}.`,
    entityId: row.id,
    ownerId: row.ownerId ?? null,
    dedupeSuffix: `${action}:${field}:${row.id}:${actorId}`,
  });
}
