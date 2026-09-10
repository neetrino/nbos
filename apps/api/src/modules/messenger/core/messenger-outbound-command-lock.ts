import type { PrismaClient } from '@nbos/database';
import { sql } from '@nbos/database';
import {
  type CanonicalWhatsAppCommand,
  isActiveDispatchClaim,
  isCanonicalCommandTerminal,
} from './messenger-outbound-command-canonical';
import type { DispatchOwnership } from './messenger-outbound-command-claim';
import { whatsAppOutboundIdempotencyKey } from './messenger-wa-identity';

type PrismaLike = InstanceType<typeof PrismaClient>;

/**
 * One Postgres lock order for every paired outbound path:
 * 1. canonical MessengerCommand row (`SELECT ... FOR UPDATE` by identity)
 * 2. provider-ref / Message rows
 * 3. audit
 * ACK without a command may update Message only and must not lock in reverse.
 */
export const MESSENGER_OUTBOUND_LOCK_ORDER = [
  'messenger_commands',
  'messenger_message_external_refs|messenger_messages',
  'audit_logs',
] as const;

export type CanonicalCommandIdentity = {
  id?: string;
  idempotencyKey: string;
};

export function lockCanonicalWhatsAppCommandSql(identity: CanonicalCommandIdentity) {
  if (identity.id) {
    return sql`
      SELECT id, conversation_id AS "conversationId", result_message_id AS "resultMessageId",
             idempotency_key AS "idempotencyKey", kind, status, payload,
             first_attempt_at AS "firstAttemptAt", created_at AS "createdAt",
             invalid_reason AS "invalidReason", next_reconcile_at AS "nextReconcileAt",
             dispatch_token AS "dispatchToken", dispatch_claimed_at AS "dispatchClaimedAt"
      FROM messenger_commands
      WHERE id = ${identity.id}
        AND idempotency_key = ${identity.idempotencyKey}
        AND kind = CAST(${'SEND_MESSAGE'} AS "MessengerCommandKind")
      FOR UPDATE`;
  }
  return sql`
    SELECT id, conversation_id AS "conversationId", result_message_id AS "resultMessageId",
           idempotency_key AS "idempotencyKey", kind, status, payload,
           first_attempt_at AS "firstAttemptAt", created_at AS "createdAt",
           invalid_reason AS "invalidReason", next_reconcile_at AS "nextReconcileAt",
           dispatch_token AS "dispatchToken", dispatch_claimed_at AS "dispatchClaimedAt"
    FROM messenger_commands
    WHERE idempotency_key = ${identity.idempotencyKey}
      AND kind = CAST(${'SEND_MESSAGE'} AS "MessengerCommandKind")
    FOR UPDATE`;
}

/** Non-destructive row lock. Reloads live command state; does not write claim fields. */
export async function lockCanonicalWhatsAppCommand(
  prisma: PrismaLike,
  identity: CanonicalCommandIdentity,
): Promise<CanonicalWhatsAppCommand | null> {
  const rows = await prisma.$queryRaw<CanonicalWhatsAppCommand[]>(
    lockCanonicalWhatsAppCommandSql(identity),
  );
  return rows[0] ?? null;
}

export async function lockAndAuthorizeCommand(
  prisma: PrismaLike,
  identity: CanonicalCommandIdentity,
  ownership: DispatchOwnership,
  now: Date,
): Promise<CanonicalWhatsAppCommand | null> {
  const live = await lockCanonicalWhatsAppCommand(prisma, identity);
  if (!live || live.kind !== 'SEND_MESSAGE') return null;
  if (!ownsLockedCommand(live, ownership, now)) return null;
  return live;
}

export function ownsLockedCommand(
  live: CanonicalWhatsAppCommand,
  ownership: DispatchOwnership,
  now: Date,
): boolean {
  if (ownership.kind === 'proof') return true;
  if (isCanonicalCommandTerminal(live)) return false;
  if (ownership.kind === 'worker') {
    return (
      live.dispatchToken === ownership.token &&
      live.nextReconcileAt != null &&
      live.nextReconcileAt.getTime() > now.getTime()
    );
  }
  return schedulerOwnsSnapshot(live, ownership.snapshot, now);
}

function schedulerOwnsSnapshot(
  live: CanonicalWhatsAppCommand,
  snapshot: CanonicalWhatsAppCommand,
  now: Date,
): boolean {
  if (isActiveDispatchClaim(live, now)) return false;
  return (
    live.id === snapshot.id &&
    live.status === snapshot.status &&
    sameOptional(live.invalidReason, snapshot.invalidReason) &&
    sameOptional(live.dispatchToken, snapshot.dispatchToken) &&
    sameClock(live.firstAttemptAt, snapshot.firstAttemptAt) &&
    sameClock(live.nextReconcileAt, snapshot.nextReconcileAt)
  );
}

/**
 * Exact locked-row identity. Call after FOR UPDATE and before any
 * provider-ref, Message, command, or audit mutation.
 */
export function lockedCommandMatchesResolvedMessage(
  live: Pick<
    CanonicalWhatsAppCommand,
    'kind' | 'idempotencyKey' | 'resultMessageId' | 'conversationId'
  >,
  resolved: { messageId: string; conversationId: string; idempotencyKey?: string },
): boolean {
  if (live.kind !== 'SEND_MESSAGE') return false;
  if (live.resultMessageId !== resolved.messageId) return false;
  if (live.conversationId !== resolved.conversationId) return false;
  const canonical = whatsAppOutboundIdempotencyKey(resolved.messageId);
  if (live.idempotencyKey !== canonical) return false;
  return resolved.idempotencyKey == null || resolved.idempotencyKey === canonical;
}

function sameOptional(left: string | null | undefined, right: string | null | undefined): boolean {
  return (left ?? null) === (right ?? null);
}

function sameClock(left: Date | null | undefined, right: Date | null | undefined): boolean {
  if (left == null || right == null) return (left ?? null) === (right ?? null);
  return left.getTime() === right.getTime();
}
