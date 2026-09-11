import { Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  WHATSAPP_CORE_PENDING_DRAIN_BATCH_SIZE,
  WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX,
  WHATSAPP_CORE_UNKNOWN_RECONCILE_MS,
} from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import type { WhatsAppCoreSendJobPayload } from '../../integrations/whatsapp-gateway/whatsapp-outbound.types';
import { markWhatsAppCommandInvalid } from './messenger-outbound-command-invalid.ops';
import { invalidateSchedulerMalformedCommand } from './messenger-outbound-malformed-command.ops';
import { finalizeWhatsAppTerminalMessageSkip } from './messenger-outbound-message-skip.ops';
import { messengerSchedulerAuditActor } from './messenger-outbound-audit';
import { MESSENGER_COMMAND_INVALID_REASON } from './messenger-outbound-reconcile.constants';
import { prepareWhatsAppCoreSend } from './messenger-wa-outbound-prepare.ops';
import { repairWhatsAppRefProof } from './messenger-wa-outbound-repair.ops';
import {
  type CanonicalWhatsAppCommand,
  CANONICAL_WHATSAPP_COMMAND_SELECT,
  isActiveDispatchClaim,
  tryCanonicalWhatsAppSendJob,
} from './messenger-outbound-command-canonical';
import {
  isNeverAttemptedQueuedSend,
  isWithinWhatsAppSameKeyWindow,
} from './messenger-outbound-gateway-window';
import type { MessengerDeliveryStatusPublisher } from './messenger-delivery-status.types';

const logger = new Logger('MessengerOutboundReconcile');

type PrismaLike = InstanceType<typeof PrismaClient>;

export type DrainQueue = {
  isAvailable(): boolean;
  enqueue(payload: WhatsAppCoreSendJobPayload, wait: boolean): Promise<void>;
};

export type MessengerOutboundReconcileCounts = {
  scanned: number;
  enqueued: number;
  repaired: number;
  manualReview: number;
  invalid: number;
  errors: number;
};

type CommandRow = CanonicalWhatsAppCommand;

export async function reconcileMessengerOutboundCommands(
  prisma: PrismaLike,
  queue: DrainQueue | undefined,
  now = new Date(),
  publisher?: MessengerDeliveryStatusPublisher,
): Promise<MessengerOutboundReconcileCounts> {
  const counts: MessengerOutboundReconcileCounts = {
    scanned: 0,
    enqueued: 0,
    repaired: 0,
    manualReview: 0,
    invalid: 0,
    errors: 0,
  };
  const rows = await loadReconcileCandidates(prisma, now);
  for (const row of rows) {
    counts.scanned += 1;
    try {
      await reconcileOneCommand(prisma, queue, row, now, counts, publisher);
    } catch (error) {
      counts.errors += 1;
      logger.warn(
        `Messenger outbound reconcile skipped commandId=${row.id} (${error instanceof Error ? error.name : 'error'})`,
      );
    }
  }
  logger.log(
    `Messenger outbound reconcile scanned=${counts.scanned} enqueued=${counts.enqueued} repaired=${counts.repaired} manualReview=${counts.manualReview} invalid=${counts.invalid} errors=${counts.errors}`,
  );
  return counts;
}

async function loadReconcileCandidates(prisma: PrismaLike, now: Date): Promise<CommandRow[]> {
  return prisma.messengerCommand.findMany({
    where: {
      kind: 'SEND_MESSAGE',
      idempotencyKey: { startsWith: WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX },
      status: { in: ['PENDING', 'OUTCOME_UNKNOWN'] },
      OR: [{ nextReconcileAt: null }, { nextReconcileAt: { lte: now } }],
    },
    orderBy: { createdAt: 'asc' },
    take: WHATSAPP_CORE_PENDING_DRAIN_BATCH_SIZE,
    select: CANONICAL_WHATSAPP_COMMAND_SELECT,
  });
}

async function reconcileOneCommand(
  prisma: PrismaLike,
  queue: DrainQueue | undefined,
  row: CommandRow,
  now: Date,
  counts: MessengerOutboundReconcileCounts,
  publisher?: MessengerDeliveryStatusPublisher,
): Promise<void> {
  const job = tryCanonicalWhatsAppSendJob(row);
  if (!job) {
    if (await invalidateSchedulerMalformedCommand(prisma, row, now)) {
      counts.invalid += 1;
    }
    return;
  }
  await reconcileValidCommand(prisma, queue, row, job, now, counts, publisher);
}

async function reconcileValidCommand(
  prisma: PrismaLike,
  queue: DrainQueue | undefined,
  row: CommandRow,
  job: WhatsAppCoreSendJobPayload,
  now: Date,
  counts: MessengerOutboundReconcileCounts,
  publisher?: MessengerDeliveryStatusPublisher,
): Promise<void> {
  if (isActiveDispatchClaim(row, now)) return;
  const prepared = await prepareWhatsAppCoreSend(prisma, job);
  if (prepared.kind === 'invalid') {
    await markWhatsAppCommandInvalid(
      prisma,
      row,
      job,
      prepared.reason,
      messengerSchedulerAuditActor(),
      publisher,
    );
    counts.invalid += 1;
    return;
  }
  if (prepared.kind === 'skip') {
    await finalizeWhatsAppTerminalMessageSkip(
      prisma,
      row,
      job,
      { kind: 'scheduler', snapshot: row },
      publisher,
      messengerSchedulerAuditActor(),
    );
    counts.invalid += 1;
    return;
  }
  if (prepared.kind === 'repair') {
    if (await repairWhatsAppRefProof(prisma, row, job, publisher, messengerSchedulerAuditActor())) {
      counts.repaired += 1;
    }
    return;
  }
  await enqueueOrFinalizeCommand(
    prisma,
    queue,
    row,
    job,
    prepared.message.status,
    now,
    counts,
    publisher,
  );
}

async function enqueueOrFinalizeCommand(
  prisma: PrismaLike,
  queue: DrainQueue | undefined,
  row: CommandRow,
  job: WhatsAppCoreSendJobPayload,
  messageStatus: string,
  now: Date,
  counts: MessengerOutboundReconcileCounts,
  publisher?: MessengerDeliveryStatusPublisher,
): Promise<void> {
  if (!isNeverAttemptedQueuedSend(row.firstAttemptAt, messageStatus)) {
    if (!isWithinWhatsAppSameKeyWindow(row, now)) {
      await markWhatsAppCommandInvalid(
        prisma,
        row,
        job,
        MESSENGER_COMMAND_INVALID_REASON.GATEWAY_WINDOW_EXPIRED,
        messengerSchedulerAuditActor(),
        publisher,
      );
      counts.manualReview += 1;
      return;
    }
  }
  if (row.status === 'OUTCOME_UNKNOWN' && !isUnknownAgeElapsed(row, now)) return;
  if (!queue?.isAvailable()) return;
  try {
    await queue.enqueue(job, false);
    counts.enqueued += 1;
    await claimCommand(prisma, row, now);
  } catch (error) {
    counts.errors += 1;
    logger.warn(
      `Messenger outbound enqueue failed commandId=${row.id} (${error instanceof Error ? error.name : 'error'})`,
    );
  }
}

function isUnknownAgeElapsed(row: CommandRow, now: Date): boolean {
  if (row.status !== 'OUTCOME_UNKNOWN') return true;
  if (row.nextReconcileAt) return row.nextReconcileAt.getTime() <= now.getTime();
  return now.getTime() - row.createdAt.getTime() >= WHATSAPP_CORE_UNKNOWN_RECONCILE_MS;
}

async function claimCommand(prisma: PrismaLike, row: CommandRow, now: Date): Promise<boolean> {
  const nextReconcileAt = new Date(now.getTime() + WHATSAPP_CORE_UNKNOWN_RECONCILE_MS);
  const result = await prisma.messengerCommand.updateMany({
    where: {
      id: row.id,
      status: row.status === 'OUTCOME_UNKNOWN' ? 'OUTCOME_UNKNOWN' : 'PENDING',
      dispatchToken: null,
      OR: [{ nextReconcileAt: null }, { nextReconcileAt: { lte: now } }],
    },
    data: { nextReconcileAt },
  });
  return result.count > 0;
}
