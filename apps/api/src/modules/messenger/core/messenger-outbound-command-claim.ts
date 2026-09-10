import { randomBytes } from 'crypto';
import type { Prisma, PrismaClient, MessengerMessageStatus } from '@nbos/database';
import { WHATSAPP_CORE_UNKNOWN_RECONCILE_MS } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import {
  type CanonicalWhatsAppCommand,
  openCanonicalCommandWhere,
} from './messenger-outbound-command-canonical';

type PrismaLike = InstanceType<typeof PrismaClient>;

/** Reuses the reviewed 60s UNKNOWN reconcile interval as the dispatch lease. */
export const MESSENGER_DISPATCH_CLAIM_LEASE_MS = WHATSAPP_CORE_UNKNOWN_RECONCILE_MS;

export class MessengerOutboundClaimAborted extends Error {
  constructor() {
    super('MESSENGER_OUTBOUND_CLAIM_ABORTED');
    this.name = 'MessengerOutboundClaimAborted';
  }
}

export class MessengerOutboundOutcomeRollback extends Error {
  constructor() {
    super('MESSENGER_OUTBOUND_OUTCOME_ROLLBACK');
    this.name = 'MessengerOutboundOutcomeRollback';
  }
}

export const WHATSAPP_PROOF_MESSAGE_STATUSES: readonly MessengerMessageStatus[] = [
  'SENT',
  'DELIVERED',
  'READ',
];

export function isWhatsAppProofMessageStatus(status: string): boolean {
  return (WHATSAPP_PROOF_MESSAGE_STATUSES as readonly string[]).includes(status);
}

export type DispatchOwnership =
  | { kind: 'worker'; token: string }
  | { kind: 'scheduler'; snapshot: CanonicalWhatsAppCommand }
  | { kind: 'proof' };

export function createDispatchToken(): string {
  return randomBytes(16).toString('hex');
}

export function unclaimedOrExpiredDispatchWhere(now: Date) {
  return {
    OR: [
      { dispatchToken: null },
      { nextReconcileAt: null },
      { nextReconcileAt: { lte: now } },
    ],
  };
}

export function workerTokenCommandWhere(command: CanonicalWhatsAppCommand, token: string, now: Date) {
  return {
    ...openCanonicalCommandWhere(command),
    dispatchToken: token,
    nextReconcileAt: { gt: now },
  };
}

export function schedulerSnapshotCommandWhere(
  command: CanonicalWhatsAppCommand,
  now: Date,
): Prisma.MessengerCommandWhereInput {
  const open = openCanonicalCommandWhere(command);
  return {
    id: open.id,
    idempotencyKey: open.idempotencyKey,
    kind: open.kind,
    resultMessageId: open.resultMessageId,
    conversationId: open.conversationId,
    NOT: open.NOT,
    status: command.status === 'OUTCOME_UNKNOWN' ? 'OUTCOME_UNKNOWN' : 'PENDING',
    invalidReason: command.invalidReason,
    firstAttemptAt: command.firstAttemptAt,
    dispatchToken: command.dispatchToken,
    nextReconcileAt: command.nextReconcileAt,
    ...unclaimedOrExpiredDispatchWhere(now),
  };
}

export const CLEAR_DISPATCH_CLAIM = {
  dispatchToken: null,
  dispatchClaimedAt: null,
} as const;

export async function claimWhatsAppDispatch(
  prisma: PrismaLike,
  command: CanonicalWhatsAppCommand,
  messageStatus: string,
  now = new Date(),
): Promise<string | null> {
  const token = createDispatchToken();
  const firstAttemptAt =
    command.firstAttemptAt ?? (messageStatus === 'QUEUED' ? now : command.createdAt);
  const result = await prisma.messengerCommand.updateMany({
    where: {
      ...openCanonicalCommandWhere(command),
      ...unclaimedOrExpiredDispatchWhere(now),
    },
    data: {
      ...(command.firstAttemptAt ? {} : { firstAttemptAt }),
      dispatchToken: token,
      dispatchClaimedAt: now,
      nextReconcileAt: new Date(now.getTime() + MESSENGER_DISPATCH_CLAIM_LEASE_MS),
    },
  });
  return (result.count ?? 0) > 0 ? token : null;
}
