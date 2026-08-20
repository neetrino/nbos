import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { CALL_SSE_EVENT } from '../../realtime/call-realtime.constants';
import { CallRealtimeEventBus } from '../../realtime/call-realtime-event-bus';
import type { IncomingCallSsePayload } from '../../realtime/call-realtime.types';
import { ATS_CALLDIRECT_INBOUND, ATS_STATE_START } from './ats.constants';
import type { AtsWebhookPayload } from './ats.types';

const CALL_SNAPSHOT_SELECT = {
  id: true,
  phone: true,
  clid: true,
  answeredEmployeeId: true,
  responsibleEmployeeId: true,
  leadId: true,
  contactId: true,
  dealId: true,
  lead: { select: { name: true, contactName: true } },
  contact: { select: { firstName: true, lastName: true } },
  deal: { select: { name: true, code: true } },
  responsibleEmployee: { select: { firstName: true, lastName: true } },
  answeredEmployee: { select: { firstName: true, lastName: true } },
} as const;

type CallSnapshot = {
  id: string;
  phone: string | null;
  clid: string | null;
  answeredEmployeeId: string | null;
  responsibleEmployeeId: string | null;
  leadId: string | null;
  contactId: string | null;
  dealId: string | null;
  lead: { name: string | null; contactName: string } | null;
  contact: { firstName: string; lastName: string } | null;
  deal: { name: string | null; code: string } | null;
  responsibleEmployee: { firstName: string; lastName: string } | null;
  answeredEmployee: { firstName: string; lastName: string } | null;
};

/**
 * Publishes incoming-call SSE after Phase 1 ingest has committed.
 * Failures are logged and never thrown.
 */
@Injectable()
export class AtsCallRealtimePublisher {
  private readonly logger = new Logger(AtsCallRealtimePublisher.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly eventBus: CallRealtimeEventBus,
  ) {}

  async publishIncomingStart(payload: AtsWebhookPayload): Promise<void> {
    if (!isInboundStart(payload)) return;
    try {
      const call = await this.prisma.atsCallEvent.findUnique({
        where: { uid: payload.uid },
        select: CALL_SNAPSHOT_SELECT,
      });
      if (!call) return;

      const target = resolveIncomingCallTarget(call);
      if (!target) {
        this.logger.debug({ event: 'ats_incoming_call_sse_skipped', uid: payload.uid });
        return;
      }

      await this.eventBus.publish({
        event: CALL_SSE_EVENT.INCOMING_CALL,
        payload: { employeeId: target.employeeId, ...toIncomingCallPayload(call, target.name) },
      });
    } catch (err) {
      this.logger.error({
        event: 'ats_incoming_call_sse_failed',
        uid: payload.uid,
        error: String(err),
      });
    }
  }
}

export function isInboundStart(payload: AtsWebhookPayload): boolean {
  const state = payload.state?.toLowerCase() ?? '';
  return payload.calldirect === ATS_CALLDIRECT_INBOUND && state === ATS_STATE_START;
}

export function resolveIncomingCallTarget(call: {
  answeredEmployeeId: string | null;
  responsibleEmployeeId: string | null;
  answeredEmployee: { firstName: string; lastName: string } | null;
  responsibleEmployee: { firstName: string; lastName: string } | null;
}): { employeeId: string; name: string | null } | null {
  if (call.answeredEmployeeId) {
    return {
      employeeId: call.answeredEmployeeId,
      name: formatPersonName(call.answeredEmployee),
    };
  }
  if (call.responsibleEmployeeId) {
    return {
      employeeId: call.responsibleEmployeeId,
      name: formatPersonName(call.responsibleEmployee),
    };
  }
  return null;
}

export function toIncomingCallPayload(
  call: CallSnapshot,
  responsibleEmployeeName: string | null,
): IncomingCallSsePayload {
  return {
    type: 'incoming_call',
    callId: call.id,
    direction: 'INBOUND',
    phone: call.phone ?? call.clid,
    contactName: formatPersonName(call.contact),
    leadName: call.lead?.name?.trim() || call.lead?.contactName?.trim() || null,
    dealName: call.deal?.name?.trim() || call.deal?.code?.trim() || null,
    responsibleEmployeeName,
    leadId: call.leadId,
    contactId: call.contactId,
    dealId: call.dealId,
  };
}

function formatPersonName(person: { firstName: string; lastName: string } | null): string | null {
  if (!person) return null;
  const name = `${person.firstName} ${person.lastName}`.trim();
  return name.length > 0 ? name : null;
}
