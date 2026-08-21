import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { mapCallDirection } from '../../crm/calls/call-response.map';
import {
  CALL_SSE_EVENT,
  type CallLifecycleSseEventName,
} from '../../realtime/call-realtime.constants';
import { CallRealtimeEventBus } from '../../realtime/call-realtime-event-bus';
import type { ActiveCallSsePayload } from '../../realtime/call-realtime.types';
import { mapAtsStateToPhase, resolveCallLifecycleEvent } from './ats-call-realtime.phase';
import { formatPersonName, resolveLifecycleTarget } from './ats-call-realtime.target';
import type { AtsWebhookPayload } from './ats.types';

const LIFECYCLE_SELECT = {
  id: true,
  uid: true,
  phone: true,
  clid: true,
  state: true,
  calldirect: true,
  initiatedByEmployeeId: true,
  responsibleEmployeeId: true,
  answeredEmployeeId: true,
  lead: { select: { name: true, contactName: true } },
  contact: { select: { firstName: true, lastName: true } },
  initiatedByEmployee: { select: { firstName: true, lastName: true } },
  responsibleEmployee: { select: { firstName: true, lastName: true } },
  answeredEmployee: { select: { firstName: true, lastName: true } },
} as const;

export type AtsCallIngestMeta = {
  callId: string;
  isFirstSeen: boolean;
};

type LifecycleCallRow = {
  id: string;
  uid: string;
  phone: string | null;
  clid: string | null;
  state: string | null;
  calldirect: string | null;
  initiatedByEmployeeId: string | null;
  responsibleEmployeeId: string | null;
  answeredEmployeeId: string | null;
  lead: { name: string | null; contactName: string } | null;
  contact: { firstName: string; lastName: string } | null;
  initiatedByEmployee: { firstName: string; lastName: string } | null;
  responsibleEmployee: { firstName: string; lastName: string } | null;
  answeredEmployee: { firstName: string; lastName: string } | null;
};

@Injectable()
export class AtsCallRealtimePublisher {
  private readonly logger = new Logger(AtsCallRealtimePublisher.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly eventBus: CallRealtimeEventBus,
  ) {}

  async publishAfterWebhook(payload: AtsWebhookPayload, ingest: AtsCallIngestMeta): Promise<void> {
    try {
      const eventName = resolveCallLifecycleEvent(payload, ingest.isFirstSeen);
      if (!eventName) return;
      await this.publishNamed(ingest.callId, eventName, payload);
    } catch (err) {
      this.logger.error({
        event: 'ats_call_sse_failed',
        uid: payload.uid,
        error: String(err),
      });
    }
  }

  async publishStartedToEmployee(callId: string, employeeId: string): Promise<void> {
    try {
      const call = await this.loadCall(callId);
      if (!call) return;
      await this.eventBus.publish({
        event: CALL_SSE_EVENT.STARTED,
        payload: { employeeId, ...toSsePayload(call, CALL_SSE_EVENT.STARTED) },
      });
    } catch (err) {
      this.logger.error({ event: 'ats_call_sse_failed', callId, error: String(err) });
    }
  }

  private async publishNamed(
    callId: string,
    eventName: CallLifecycleSseEventName,
    payload: AtsWebhookPayload,
  ): Promise<void> {
    const call = await this.loadCall(callId);
    if (!call) return;
    const target = resolveLifecycleTarget(payload, call);
    if (!target) {
      this.logger.debug({ event: 'ats_call_sse_skipped', uid: payload.uid, sse: eventName });
      return;
    }
    await this.eventBus.publish({
      event: eventName,
      payload: { employeeId: target.employeeId, ...toSsePayload(call, eventName) },
    });
  }

  private loadCall(callId: string): Promise<LifecycleCallRow | null> {
    return this.prisma.atsCallEvent.findUnique({
      where: { id: callId },
      select: LIFECYCLE_SELECT,
    });
  }
}

export function toSsePayload(
  call: Pick<
    LifecycleCallRow,
    'id' | 'uid' | 'phone' | 'clid' | 'state' | 'calldirect' | 'contact' | 'lead'
  >,
  eventName: CallLifecycleSseEventName,
): ActiveCallSsePayload {
  const direction = mapCallDirection(call.calldirect) ?? 'INBOUND';
  return {
    type: eventName,
    callId: call.id,
    uid: call.uid,
    direction,
    phase: mapAtsStateToPhase(call.state),
    phone: call.phone ?? call.clid,
    displayName:
      formatPersonName(call.contact) ||
      call.lead?.name?.trim() ||
      call.lead?.contactName?.trim() ||
      null,
  };
}
