import { isActorType, type ActorType } from '@nbos/shared';

export interface HistoricalAuditActorRow {
  userId: string | null;
  actorType?: string | null;
  actorId?: string | null;
}

export interface HistoricalAuditActorRef {
  type: ActorType;
  id: string;
}

/**
 * Mirrors migration `20260821150000_audit_actor_aware` backfill plus read fallback
 * for rows written before the application cutover.
 */
export function resolveHistoricalAuditActor(
  row: HistoricalAuditActorRow,
): HistoricalAuditActorRef | null {
  if (row.actorType && row.actorId && isActorType(row.actorType)) {
    return { type: row.actorType, id: row.actorId };
  }
  if (row.userId) {
    return { type: 'USER', id: row.userId };
  }
  return null;
}

export function backfillHistoricalAuditActor(row: HistoricalAuditActorRow): {
  actorType: ActorType | null;
  actorId: string | null;
  userId: string | null;
} {
  const resolved = resolveHistoricalAuditActor(row);
  if (!resolved) {
    return { actorType: null, actorId: null, userId: row.userId };
  }
  return {
    actorType: resolved.type,
    actorId: resolved.id,
    userId: row.userId,
  };
}
