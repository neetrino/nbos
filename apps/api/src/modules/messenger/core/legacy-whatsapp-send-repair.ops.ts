import { Logger } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import type { WhatsAppDestinationVerdict } from '../../integrations/whatsapp-gateway/whatsapp-destination-access';
import { runMessengerWriteTx } from './messenger-core-revision-tx';
import { parseWhatsAppSendCommandPayload } from './messenger-core-command-payload';
import {
  classifyLegacyRepairFailure,
  legacyRepairPayload,
  rejectLegacyRepairDestination,
  rejectLegacyRepairStructure,
} from './legacy-whatsapp-repair-eligibility';
import { whatsAppOutboundIdempotencyKey } from './messenger-wa-identity';

type PrismaLike = InstanceType<typeof PrismaClient>;

const logger = new Logger('LegacyWhatsAppSendRepair');
const DELIVERED = new Set(['SENT', 'DELIVERED', 'READ']);
const REPAIRABLE_MESSAGE = new Set(['FAILED', 'QUEUED']);

export type LegacySendRepairResult =
  | {
      action: 'repair';
      reason: string;
      messageId: string;
      commandId: string;
      chatId: string;
      accountId: string;
      idempotencyKey: string;
    }
  | {
      action: 'reject' | 'manual_review' | 'lost_race';
      reason: string;
      messageId: string;
      commandId: string | null;
    };

type RepairSnapshot = {
  command: {
    id: string;
    kind: string;
    status: string;
    conversationId: string | null;
    resultMessageId: string | null;
    idempotencyKey: string;
    payload: unknown;
    dispatchToken: string | null;
    errorCode: string | null;
    invalidReason: string | null;
    firstAttemptAt: Date | null;
    createdAt: Date;
  } | null;
  message: {
    id: string;
    conversationId: string;
    status: string;
    deletedAt: Date | null;
  } | null;
  mapping: { externalAccountId: string; externalConversationId: string } | null;
  hasExternalRef: boolean;
  destination: WhatsAppDestinationVerdict;
};

/**
 * Explicit repair for one proven FAILED WhatsApp send that still routes via `default`.
 * Keeps the same message, command, and logical idempotency key. Ambiguous outcomes stay manual review.
 */
export function decideLegacyDefaultSendRepair(input: RepairSnapshot): LegacySendRepairResult {
  const messageId = input.message?.id ?? '';
  const blocked = rejectRepair(input);
  if (blocked) {
    return {
      action: blocked.action,
      reason: blocked.reason,
      messageId,
      commandId: input.command?.id ?? null,
    };
  }
  if (!input.command || !input.message || !input.mapping) {
    return { action: 'reject', reason: 'missing_message', messageId, commandId: null };
  }
  const payload = parseWhatsAppSendCommandPayload(input.command.payload);
  if (!payload) {
    return {
      action: 'reject',
      reason: 'malformed_payload',
      messageId,
      commandId: input.command.id,
    };
  }
  return {
    action: 'repair',
    reason: 'legacy_default_routing',
    messageId,
    commandId: input.command.id,
    chatId: payload.chatId,
    accountId: input.mapping.externalAccountId,
    idempotencyKey: input.command.idempotencyKey,
  };
}

type RepairCommit = Extract<LegacySendRepairResult, { action: 'repair' }>;

export async function repairLegacyDefaultWhatsAppSend(
  prisma: PrismaLike,
  messageId: string,
  probe: (chatId: string, targetAccountId: string) => Promise<WhatsAppDestinationVerdict>,
): Promise<LegacySendRepairResult> {
  logger.warn(`whatsapp_legacy_send_repair_started messageId=${messageId}`);
  const loaded = await loadRepairSnapshot(prisma, messageId);
  const optimistic = decideLegacyDefaultSendRepair({ ...loaded, destination: 'accessible' });
  if (optimistic.action !== 'repair') return reject(optimistic);
  const destination = await readDestination(probe, optimistic.chatId, optimistic.accountId);
  const decision = decideLegacyDefaultSendRepair({ ...loaded, destination });
  if (decision.action !== 'repair') return reject(decision);
  const committed = await commitLegacyDefaultSendRepair(prisma, decision);
  if (committed === 'lost_race') {
    return reject({
      action: 'lost_race',
      reason: 'concurrent_repair',
      messageId: decision.messageId,
      commandId: decision.commandId,
    });
  }
  logger.log(
    `whatsapp_legacy_send_repair_queued messageId=${messageId} commandId=${decision.commandId}`,
  );
  return decision;
}

export async function commitLegacyDefaultSendRepair(
  prisma: PrismaLike,
  plan: RepairCommit,
): Promise<'repaired' | 'lost_race'> {
  try {
    await runMessengerWriteTx(prisma, (tx) => writeRepair(tx, plan));
    return 'repaired';
  } catch (error) {
    if (error instanceof LegacyRepairConflict) return 'lost_race';
    throw error;
  }
}

function rejectRepair(
  input: RepairSnapshot,
): { action: 'reject' | 'manual_review'; reason: string } | null {
  const structural = rejectLegacyRepairStructure(input);
  if (structural || !input.command || !input.message) return structural;
  if (DELIVERED.has(input.message.status) || input.hasExternalRef) {
    return { action: 'reject', reason: 'delivery_proof' };
  }
  const failure = classifyLegacyRepairFailure(input.command);
  if (failure) return { action: 'manual_review', reason: failure };
  if (input.command.status !== 'FAILED') return { action: 'reject', reason: 'command_not_failed' };
  if (!REPAIRABLE_MESSAGE.has(input.message.status)) {
    return { action: 'reject', reason: 'unsafe_message_status' };
  }
  return rejectLegacyRepairDestination(input.destination);
}

async function loadRepairSnapshot(
  prisma: PrismaLike,
  messageId: string,
): Promise<Omit<RepairSnapshot, 'destination'>> {
  const message = await prisma.messengerMessage.findUnique({
    where: { id: messageId },
    select: { id: true, conversationId: true, status: true, deletedAt: true },
  });
  const command = message
    ? await prisma.messengerCommand.findUnique({
        where: { idempotencyKey: whatsAppOutboundIdempotencyKey(message.id) },
        select: {
          id: true,
          kind: true,
          status: true,
          conversationId: true,
          resultMessageId: true,
          idempotencyKey: true,
          payload: true,
          dispatchToken: true,
          errorCode: true,
          invalidReason: true,
          firstAttemptAt: true,
          createdAt: true,
        },
      })
    : null;
  const mapping = message
    ? await prisma.messengerExternalConversationMapping.findFirst({
        where: { conversationId: message.conversationId, provider: 'WHATSAPP' },
        select: { externalAccountId: true, externalConversationId: true },
      })
    : null;
  const ref = message
    ? await prisma.messengerMessageExternalRef.findFirst({
        where: { messageId: message.id, provider: 'WHATSAPP' },
        select: { id: true },
      })
    : null;
  return { command, message, mapping, hasExternalRef: ref !== null };
}

async function writeRepair(prisma: PrismaLike, plan: RepairCommit): Promise<void> {
  const ref = await prisma.messengerMessageExternalRef.findFirst({
    where: { messageId: plan.messageId, provider: 'WHATSAPP' },
    select: { id: true },
  });
  if (ref) throw new LegacyRepairConflict();
  const message = await prisma.messengerMessage.updateMany({
    where: { id: plan.messageId, status: { in: ['FAILED', 'QUEUED'] }, deletedAt: null },
    data: { status: 'QUEUED' },
  });
  if (message.count !== 1) throw new LegacyRepairConflict();
  const command = await prisma.messengerCommand.updateMany({
    where: {
      id: plan.commandId,
      status: 'FAILED',
      kind: 'SEND_MESSAGE',
      idempotencyKey: plan.idempotencyKey,
      resultMessageId: plan.messageId,
      dispatchToken: null,
    },
    data: {
      status: 'PENDING',
      payload: legacyRepairPayload(plan.accountId, plan.chatId),
      errorCode: null,
      invalidReason: null,
      completedAt: null,
      nextReconcileAt: null,
      dispatchToken: null,
      dispatchClaimedAt: null,
    },
  });
  if (command.count !== 1) throw new LegacyRepairConflict();
}

function reject(result: LegacySendRepairResult): LegacySendRepairResult {
  logger.warn(
    `whatsapp_legacy_send_repair_rejected messageId=${result.messageId} commandId=${result.commandId ?? ''} reason=${result.reason}`,
  );
  return result;
}

async function readDestination(
  probe: (chatId: string, targetAccountId: string) => Promise<WhatsAppDestinationVerdict>,
  chatId: string,
  targetAccountId: string,
): Promise<WhatsAppDestinationVerdict> {
  try {
    return await probe(chatId, targetAccountId);
  } catch {
    return 'unavailable';
  }
}

class LegacyRepairConflict extends Error {
  constructor() {
    super('legacy_repair_conflict');
    this.name = 'LegacyRepairConflict';
  }
}
