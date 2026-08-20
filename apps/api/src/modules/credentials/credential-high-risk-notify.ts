import type { PrismaClient } from '@nbos/database';
import { CEO_ROLE_SLUG, PLATFORM_OWNERSHIP_SINGLETON_ID } from '@nbos/shared';
import type { NotificationService } from '../notifications/notification.service';
import type { SensitiveField } from './credential-domain.types';

const ACTIVE_STATUSES = ['ACTIVE', 'PROBATION'] as const;

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
  const recipientIds = await loadHighRiskRecipientIds(prisma, params.actorId, params.ownerId);
  if (recipientIds.length === 0) return;

  await notifications.createMany({
    recipientIds,
    type: 'credentials.high_risk_action',
    title: params.title,
    body: params.body,
    entityType: 'credential',
    entityId: params.entityId,
    sourceModule: 'credentials',
    dedupeKeyPrefix: 'credentials.high_risk_action',
    dedupeKeySuffix: params.dedupeSuffix,
  });
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

async function loadHighRiskRecipientIds(
  prisma: InstanceType<typeof PrismaClient>,
  actorId: string,
  ownerId?: string | null,
): Promise<string[]> {
  const recipients = new Set<string>();
  if (ownerId) recipients.add(ownerId);
  const ownership = await prisma.platformOwnership.findUnique({
    where: { id: PLATFORM_OWNERSHIP_SINGLETON_ID },
    select: { ownerEmployeeId: true },
  });
  if (ownership?.ownerEmployeeId) recipients.add(ownership.ownerEmployeeId);
  const ceos = await prisma.employee.findMany({
    where: {
      status: { in: [...ACTIVE_STATUSES] },
      role: { slug: CEO_ROLE_SLUG },
    },
    select: { id: true },
  });
  for (const ceo of ceos) recipients.add(ceo.id);
  recipients.delete(actorId);
  return [...recipients];
}
