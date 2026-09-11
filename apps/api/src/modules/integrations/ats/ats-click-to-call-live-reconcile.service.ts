import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { AtsCallRealtimePublisher } from './ats-call-realtime.publisher';
import { AtsCallRecordingEnqueueService } from './ats-call-recording-enqueue.service';
import { shouldEnqueueCallRecording } from './ats-call-recording-should-enqueue';
import { matchHistoryToPendingCall } from './ats-call-history-match';
import {
  persistAtsCallByUid,
  CALL_ROW_SELECT,
  type AtsPersistedCallRow,
} from './ats-call-uid-persist';
import { shouldSyncClickToCallFromHistory } from './ats-click-to-call-live-reconcile.guard';
import { AtsHistoryClient } from './ats-history.client';
import type { AtsHistoryCallRow } from './ats-history.parse';
import { ATS_CALLDIRECT_OUTBOUND, ATS_STATE_END } from './ats.constants';
import type { AtsWebhookPayload } from './ats.types';

const LIVE_SELECT = {
  ...CALL_ROW_SELECT,
  state: true,
  phone: true,
  clid: true,
  source: true,
  createdAt: true,
} as const;

type LiveCallRow = AtsPersistedCallRow & {
  state: string | null;
  phone: string | null;
  clid: string | null;
  source: string | null;
  createdAt: Date;
};

@Injectable()
export class AtsClickToCallLiveReconcileService {
  private readonly logger = new Logger(AtsClickToCallLiveReconcileService.name);
  private readonly lastAttemptAt = new Map<string, number>();

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly history: AtsHistoryClient,
    private readonly publisher: AtsCallRealtimePublisher,
    private readonly recordingEnqueue: AtsCallRecordingEnqueueService,
  ) {}

  async syncIfPending(callId: string): Promise<void> {
    try {
      await this.syncPendingCall(callId);
    } catch (err) {
      this.logger.warn({ event: 'ats_live_history_sync_failed', callId, error: String(err) });
    }
  }

  private async syncPendingCall(callId: string): Promise<void> {
    const call = await this.prisma.atsCallEvent.findUnique({
      where: { id: callId },
      select: LIVE_SELECT,
    });
    if (!call) return;
    if (
      !shouldSyncClickToCallFromHistory({
        source: call.source,
        state: call.state,
        createdAt: call.createdAt,
        lastAttemptAt: this.lastAttemptAt.get(callId),
      })
    ) {
      return;
    }
    this.lastAttemptAt.set(callId, Date.now());
    const phone = call.phone ?? call.clid;
    if (!phone) return;
    const match = await this.findEndedHistoryRow(call, phone);
    if (!match) return;
    await this.applyEndedHistory(call, match, phone);
  }

  private async findEndedHistoryRow(
    call: LiveCallRow,
    phone: string,
  ): Promise<AtsHistoryCallRow | null> {
    const rows = await this.history.listCallsForDateRange(call.createdAt, new Date());
    return matchHistoryToPendingCall(rows, { phoneE164: phone, createdAt: call.createdAt });
  }

  private async applyEndedHistory(
    call: LiveCallRow,
    match: AtsHistoryCallRow,
    phone: string,
  ): Promise<void> {
    const payload = historyToTerminalPayload(match, phone);
    let persisted = await persistAtsCallByUid(this.prisma, payload, persistRowOf(call));
    if (persisted.row.id !== call.id) {
      persisted = await persistAtsCallByUid(
        this.prisma,
        { ...payload, uid: call.uid },
        persistRowOf(call),
      );
    }
    if (!persisted.stateTransitionApplied) return;
    const ingest = { callId: call.id, isFirstSeen: false, stateTransitionApplied: true };
    await this.publisher.publishAfterWebhook({ ...payload, uid: persisted.row.uid }, ingest);
    if (shouldEnqueueCallRecording(payload)) {
      await this.recordingEnqueue.enqueueAfterWebhook({ ...payload, uid: persisted.row.uid });
    }
    this.lastAttemptAt.delete(call.id);
  }
}

function persistRowOf(call: LiveCallRow): AtsPersistedCallRow {
  return {
    id: call.id,
    uid: call.uid,
    leadId: call.leadId,
    contactId: call.contactId,
    dealId: call.dealId,
    responsibleEmployeeId: call.responsibleEmployeeId,
    answeredEmployeeId: call.answeredEmployeeId,
    initiatedByEmployeeId: call.initiatedByEmployeeId,
  };
}

function historyToTerminalPayload(row: AtsHistoryCallRow, phone: string): AtsWebhookPayload {
  return {
    uid: row.uid,
    state: ATS_STATE_END,
    calldirect: ATS_CALLDIRECT_OUTBOUND,
    clid: phone,
    op: row.op,
    disposition: row.disposition,
    billsec: row.billsec,
  };
}
